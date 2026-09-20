"""YouTube WebSub subscription management — cron, admin, and per-user helpers."""

import logging
import os
from datetime import UTC, datetime, timedelta
from typing import Any

from ...constants import LiveSubStatus
from ...extensions import db
from ...models import LiveStream, OAuthAccount, User

logger = logging.getLogger(__name__)

# 健康檢查門檻。前提：續訂排程每天跑一次，hub 租約固定 5 天
# 超過這段時間完全沒有訂閱嘗試，代表續訂根本沒跑到這個帳號
SUB_STALE_AFTER = timedelta(days=3)
# PENDING 要等 hub 補送驗證請求，超過這段時間還沒確認才算異常
SUB_CONFIRM_GRACE = timedelta(hours=6)
SUB_HEALTH_MIN_UNHEALTHY = 5
SUB_HEALTH_WARNING_RATIO = 0.2
SUB_HEALTH_CRITICAL_RATIO = 0.5


def _invalidate_live_cache() -> None:
    from ...routes.livestream import invalidate_live_cache

    invalidate_live_cache()


def _as_utc(dt: datetime) -> datetime:
    """SQLite 回傳 naive datetime，比較前補上 UTC。"""
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def _find_account_by_channel_id(channel_id: str) -> OAuthAccount | None:
    account: OAuthAccount | None = OAuthAccount.query.filter(
        OAuthAccount.provider == "youtube",
        OAuthAccount.channel_url.ilike(f"%/channel/{channel_id}%"),
    ).first()
    return account


def _confirmed_since(account: OAuthAccount, since: datetime) -> bool:
    """帳號是否在 *since* 之後已被 hub 的驗證請求確認為 SUBSCRIBED。"""
    # 直接查欄位繞過 identity map，拿 DB 目前的值
    row = (
        db.session.query(OAuthAccount.live_sub_status, OAuthAccount.live_sub_at)
        .filter(OAuthAccount.id == account.id)
        .first()
    )
    if not row or row[0] != LiveSubStatus.SUBSCRIBED or row[1] is None:
        return False
    return _as_utc(row[1]) >= since


def _record_sub_result(account: OAuthAccount, status: str, started_at: datetime) -> None:
    """把一次訂閱嘗試的結果寫回帳號（不 commit）。

    hub 回應很慢時，驗證請求可能比訂閱請求的逾時更早抵達並已把狀態翻成 SUBSCRIBED，
    這時不要再用 PENDING 蓋回去。
    """
    if status == LiveSubStatus.PENDING and _confirmed_since(account, started_at):
        return
    account.live_sub_status = status
    account.live_sub_at = datetime.now(UTC)


# ---------------------------------------------------------------------------
# YouTube cron logic
# ---------------------------------------------------------------------------


def youtube_check_offline(api_key: str) -> dict[str, Any]:
    """Check YouTube streams that have ended. Returns result dict."""
    from ..youtube_pubsub import check_streams_ended

    streams = LiveStream.query.filter_by(provider="youtube").all()
    if not streams:
        return {"checked": 0, "ended": 0}

    video_ids = [s.stream_id for s in streams if s.stream_id]
    ended_ids = check_streams_ended(video_ids, api_key)

    if ended_ids:
        ended_user_ids = [s.user_id for s in streams if s.stream_id in ended_ids]
        if ended_user_ids:
            User.query.filter(User.id.in_(ended_user_ids)).update(
                {"last_live_at": datetime.now(UTC)}, synchronize_session="fetch"
            )
        LiveStream.query.filter(
            LiveStream.provider == "youtube",
            LiveStream.stream_id.in_(ended_ids),
        ).delete(synchronize_session="fetch")
        db.session.commit()
        _invalidate_live_cache()

    logger.info("YouTube check-offline: checked=%d, ended=%d", len(video_ids), len(ended_ids))

    if len(video_ids) >= 5 and len(ended_ids) == len(video_ids):
        from ...constants import AlertSeverity, AlertType
        from ..alerts import log_alert

        ended_streams = [
            {"title": s.stream_title or s.stream_id, "url": s.stream_url or ""}
            for s in streams
            if s.stream_id in ended_ids
        ]
        log_alert(
            alert_type=AlertType.CHECK_OFFLINE_ANOMALY,
            severity=AlertSeverity.WARNING,
            title=f"check-offline 異常：全部 {len(video_ids)} 個直播同時結束",
            context={
                "checked": len(video_ids),
                "ended": len(ended_ids),
                "streams": ended_streams,
            },
        )

    return {"checked": len(video_ids), "ended": len(ended_ids)}


def youtube_renew_subs() -> dict[str, Any] | None:
    """Batch renew YouTube WebSub subscriptions. Returns result dict."""
    from ..youtube_pubsub import extract_channel_id

    accounts = OAuthAccount.query.filter_by(provider="youtube").all()

    params_list = []
    skipped = 0
    for account in accounts:
        channel_id = extract_channel_id(account.channel_url)
        if not channel_id:
            skipped += 1
            continue
        params_list.append({"channel_id": channel_id})

    if not params_list:
        return {"total": len(accounts), "skipped": skipped, "dispatched": 0}

    # Try Cloud Tasks dispatch
    cloud_run_url = os.environ.get("CLOUD_RUN_SERVICE_URL", "")
    if cloud_run_url:
        from ...utils.cloud_tasks_client import dispatch_tasks_batch

        result = dispatch_tasks_batch("/api/livestream/youtube-subscribe-one", params_list=params_list)
        logger.info(
            "YouTube renew-subs via Cloud Tasks: total=%d, dispatched=%d, failed=%d, skipped=%d",
            len(accounts),
            result["dispatched"],
            result["failed"],
            skipped,
        )
        if result["dispatched"] > 0:
            return {
                "mode": "cloud_tasks",
                "total": len(accounts),
                "dispatched": result["dispatched"],
                "failed": result["failed"],
                "skipped": skipped,
            }
        logger.warning(
            "Cloud Tasks dispatch completely failed (dispatched=0, failed=%d), falling back to sync mode",
            result["failed"],
        )
        from ...constants import AlertSeverity, AlertType
        from ..alerts import log_alert

        log_alert(
            alert_type=AlertType.WEBSUB_RENEW_FAIL,
            severity=AlertSeverity.CRITICAL,
            title=f"WebSub renew: Cloud Tasks 全失敗 ({result['failed']} failed)",
            context={
                "dispatched": 0,
                "failed": result["failed"],
                "total": len(accounts),
                "skipped": skipped,
                "mode": "cloud_tasks",
            },
        )

    # Fallback: synchronous subscribe (also used when Cloud Tasks dispatch all fail)
    from ..youtube_pubsub import subscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return None  # signals 500 to caller

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None
    renewed = 0
    pending = 0
    errors = 0
    for p in params_list:
        started_at = datetime.now(UTC)
        status = subscribe_channel(p["channel_id"], callback_url, secret=hub_secret)
        account = _find_account_by_channel_id(p["channel_id"])
        if account:
            _record_sub_result(account, status, started_at)
        if status == LiveSubStatus.SUBSCRIBED:
            renewed += 1
        elif status == LiveSubStatus.PENDING:
            pending += 1
        else:
            errors += 1
    db.session.commit()

    logger.info(
        "YouTube renew-subs (sync fallback): total=%d, renewed=%d, pending=%d, skipped=%d, errors=%d",
        len(accounts),
        renewed,
        pending,
        skipped,
        errors,
    )
    if errors > 0:
        from ...constants import AlertSeverity, AlertType
        from ..alerts import log_alert

        log_alert(
            alert_type=AlertType.WEBSUB_RENEW_FAIL,
            severity=AlertSeverity.CRITICAL if renewed == 0 else AlertSeverity.WARNING,
            title=f"WebSub renew (sync): {errors} error(s) / {len(params_list)} total",
            context={
                "renewed": renewed,
                "pending": pending,
                "errors": errors,
                "total": len(accounts),
                "skipped": skipped,
                "mode": "sync",
            },
        )
    return {
        "mode": "sync",
        "total": len(accounts),
        "renewed": renewed,
        "pending": pending,
        "skipped": skipped,
        "errors": errors,
    }


def youtube_subscribe_one(channel_id: str) -> tuple[dict[str, Any], int]:
    """Subscribe a single YouTube channel. Returns (result_dict, http_status).

    只有 FAILED 回 500 讓 Cloud Tasks 重試。PENDING 回 200：請求已送達 hub，
    重試只會在 hub 忙碌的同一個時段再卡一次，結果交給驗證請求確認。
    """
    from ..youtube_pubsub import subscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return {"error": "WEBHOOK_BASE_URL not configured"}, 500

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None
    started_at = datetime.now(UTC)
    status = subscribe_channel(channel_id, callback_url, secret=hub_secret)

    account = _find_account_by_channel_id(channel_id)
    if account:
        _record_sub_result(account, status, started_at)
        db.session.commit()

    if status == LiveSubStatus.FAILED:
        logger.warning("YouTube subscribe-one FAILED: %s", channel_id)
        return {"channel_id": channel_id, "status": status}, 500

    logger.info("YouTube subscribe-one %s: %s", status, channel_id)
    return {"channel_id": channel_id, "status": status}, 200


def confirm_youtube_subscription(channel_id: str) -> bool:
    """hub 送來訂閱驗證請求時呼叫：hub 確實收到並接受了訂閱，把狀態翻成 SUBSCRIBED。

    Returns False if no account matches the channel.
    """
    # 直接 UPDATE，不載入帳號：載入會觸發 token 欄位的 KMS 解密，而 hub 在等我們回 challenge
    updated: int = OAuthAccount.query.filter(
        OAuthAccount.provider == "youtube",
        OAuthAccount.channel_url.ilike(f"%/channel/{channel_id}%"),
    ).update(
        {"live_sub_status": LiveSubStatus.SUBSCRIBED, "live_sub_at": datetime.now(UTC)},
        synchronize_session=False,
    )
    db.session.commit()
    return updated > 0


def youtube_check_sub_health() -> dict[str, Any]:
    """檢查 YouTube 訂閱的整體健康度，異常比例過高時記一筆 WEBSUB_RENEW_FAIL 告警。

    Cloud Tasks 模式下 renew-subs 只知道「派發成功」，後續 subscribe-one 大量失敗
    不會回報到任何地方，這裡從結果面（帳號上的訂閱狀態）補上偵測。
    """
    from ..youtube_pubsub import extract_channel_id

    now = datetime.now(UTC)
    total = 0
    stale = 0
    failed = 0
    unconfirmed = 0
    # 只查需要的欄位：載入整個帳號會讓每個 token 欄位各打一次 KMS 解密，這支每小時跑一次
    rows = (
        db.session.query(OAuthAccount.channel_url, OAuthAccount.live_sub_status, OAuthAccount.live_sub_at)
        .filter(OAuthAccount.provider == "youtube")
        .all()
    )
    for channel_url, sub_status, sub_at in rows:
        if not extract_channel_id(channel_url):
            continue  # 續訂本來就會跳過這些帳號
        total += 1
        age = now - _as_utc(sub_at) if sub_at else None
        if age is None or age > SUB_STALE_AFTER:
            stale += 1
        elif sub_status == LiveSubStatus.FAILED:
            failed += 1
        elif sub_status != LiveSubStatus.SUBSCRIBED and age > SUB_CONFIRM_GRACE:
            unconfirmed += 1

    unhealthy = stale + failed + unconfirmed
    ratio = unhealthy / total if total else 0.0
    result: dict[str, Any] = {
        "total": total,
        "unhealthy": unhealthy,
        "stale": stale,
        "failed": failed,
        "unconfirmed": unconfirmed,
        "ratio": round(ratio, 3),
    }

    if unhealthy >= SUB_HEALTH_MIN_UNHEALTHY and ratio >= SUB_HEALTH_WARNING_RATIO:
        from ...constants import AlertSeverity, AlertType
        from ..alerts import log_alert

        log_alert(
            alert_type=AlertType.WEBSUB_RENEW_FAIL,
            severity=AlertSeverity.CRITICAL if ratio >= SUB_HEALTH_CRITICAL_RATIO else AlertSeverity.WARNING,
            title=f"WebSub 訂閱健康檢查：{unhealthy}/{total} 個頻道訂閱異常",
            context={**result, "mode": "health_check"},
        )
    return result


# ---------------------------------------------------------------------------
# YouTube admin logic
# ---------------------------------------------------------------------------


def list_youtube_subs() -> dict[str, Any]:
    """List all YouTube WebSub subscription statuses."""
    from ..youtube_pubsub import extract_channel_id

    accounts = OAuthAccount.query.filter_by(provider="youtube").all()
    result = []
    for a in accounts:
        channel_id = extract_channel_id(a.channel_url)
        result.append(
            {
                "user_id": str(a.user_id),
                "provider_account_id": a.provider_account_id,
                "provider_display_name": a.provider_display_name,
                "channel_url": a.channel_url,
                "channel_id": channel_id,
                "has_channel_id": channel_id is not None,
            }
        )
    return {"accounts": result, "total": len(result)}


def rebuild_youtube_subs(*, offset: int, limit: int, clean: bool) -> tuple[dict[str, Any], int]:
    """Batch rebuild YouTube WebSub subscriptions. Returns (result_dict, http_status)."""
    from ..youtube_pubsub import extract_channel_id, subscribe_channel, unsubscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return {"error": "WEBHOOK_BASE_URL not configured"}, 500

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None

    total_accounts = OAuthAccount.query.filter_by(provider="youtube").count()
    yt_accounts = (
        OAuthAccount.query.filter_by(provider="youtube")
        .order_by(OAuthAccount.created_at)
        .offset(offset)
        .limit(limit)
        .all()
    )

    unsubscribed = 0
    if clean:
        for account in yt_accounts:
            channel_id = extract_channel_id(account.channel_url)
            if channel_id:
                unsubscribe_channel(channel_id, callback_url, secret=hub_secret)
                unsubscribed += 1

    subscribed = 0
    pending = 0
    skipped = 0
    errors = 0
    for account in yt_accounts:
        channel_id = extract_channel_id(account.channel_url)
        if not channel_id:
            skipped += 1
            continue
        started_at = datetime.now(UTC)
        status = subscribe_channel(channel_id, callback_url, secret=hub_secret)
        _record_sub_result(account, status, started_at)
        if status == LiveSubStatus.SUBSCRIBED:
            subscribed += 1
        elif status == LiveSubStatus.PENDING:
            pending += 1
        else:
            errors += 1

    db.session.commit()

    next_offset = offset + limit
    return {
        "subscribed": subscribed,
        "pending": pending,
        "skipped": skipped,
        "errors": errors,
        "unsubscribed": unsubscribed,
        "batch": f"{offset}-{offset + len(yt_accounts)}",
        "total_accounts": total_accounts,
        "has_more": next_offset < total_accounts,
        "next_offset": next_offset if next_offset < total_accounts else None,
    }, 200


def backfill_youtube_channels(api_key: str) -> dict[str, Any]:
    """Resolve missing/invalid channel_url for YouTube accounts.

    - @handle URLs → resolve to /channel/UCxxx via YouTube API
    - NULL URLs with access_token → fetch channel via OAuth token
    After resolution, subscribe to WebSub.
    """
    from ..youtube_pubsub import (
        extract_channel_id,
        extract_handle,
        fetch_my_channel_id,
        resolve_handle_to_channel_id,
        subscribe_channel,
    )

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    callback_url = f"{webhook_base_url}/api/webhooks/youtube" if webhook_base_url else ""
    hub_secret = os.environ.get("CRON_SECRET", "") or None

    accounts = OAuthAccount.query.filter_by(provider="youtube").all()

    resolved_handle = 0
    resolved_token = 0
    subscribe_ok = 0
    subscribe_pending = 0
    subscribe_fail = 0
    still_missing = 0
    details: list[dict[str, str | None]] = []

    for account in accounts:
        if extract_channel_id(account.channel_url):
            continue  # already valid

        channel_id: str | None = None
        method = ""

        # Try 1: resolve @handle
        handle = extract_handle(account.channel_url)
        if handle:
            channel_id = resolve_handle_to_channel_id(handle, api_key)
            method = "handle"

        # Try 2: use OAuth access_token
        if not channel_id and account.access_token:
            channel_id = fetch_my_channel_id(account.access_token)
            method = "token"

        if not channel_id:
            still_missing += 1
            details.append({"name": account.provider_display_name, "url": account.channel_url, "status": "unresolved"})
            continue

        # Update channel_url
        account.channel_url = f"https://www.youtube.com/channel/{channel_id}"
        if method == "handle":
            resolved_handle += 1
        else:
            resolved_token += 1

        # Subscribe to WebSub
        if callback_url:
            started_at = datetime.now(UTC)
            status = subscribe_channel(channel_id, callback_url, secret=hub_secret)
            _record_sub_result(account, status, started_at)
            if status == LiveSubStatus.SUBSCRIBED:
                subscribe_ok += 1
            elif status == LiveSubStatus.PENDING:
                subscribe_pending += 1
            else:
                subscribe_fail += 1

        details.append(
            {"name": account.provider_display_name, "url": account.channel_url, "status": f"resolved:{method}"}
        )

    db.session.commit()

    logger.info(
        "YouTube backfill: handle=%d, token=%d, subscribed=%d, pending=%d, failed=%d, missing=%d",
        resolved_handle,
        resolved_token,
        subscribe_ok,
        subscribe_pending,
        subscribe_fail,
        still_missing,
    )
    return {
        "resolved_handle": resolved_handle,
        "resolved_token": resolved_token,
        "subscribe_ok": subscribe_ok,
        "subscribe_pending": subscribe_pending,
        "subscribe_fail": subscribe_fail,
        "still_missing": still_missing,
        "details": details,
    }


# ---------------------------------------------------------------------------
# Per-user helpers (called from oauth.py)
# ---------------------------------------------------------------------------


def subscribe_youtube_user(channel_url: str, oauth_account: OAuthAccount | None = None) -> None:
    """Subscribe to YouTube WebSub for a channel."""
    from ..youtube_pubsub import extract_channel_id, subscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        logger.warning("WEBHOOK_BASE_URL not configured, skipping YouTube WebSub for %s", channel_url)
        if oauth_account:
            oauth_account.live_sub_status = LiveSubStatus.FAILED
            oauth_account.live_sub_at = datetime.now(UTC)
            db.session.commit()
        return

    channel_id = extract_channel_id(channel_url)
    if not channel_id:
        logger.warning("Could not extract channel ID from %s", channel_url)
        if oauth_account:
            oauth_account.live_sub_status = LiveSubStatus.FAILED
            oauth_account.live_sub_at = datetime.now(UTC)
            db.session.commit()
        return

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None
    started_at = datetime.now(UTC)
    status = subscribe_channel(channel_id, callback_url, secret=hub_secret)

    if oauth_account:
        _record_sub_result(oauth_account, status, started_at)
        db.session.commit()


def unsubscribe_youtube_user(channel_url: str) -> None:
    """Unsubscribe from YouTube WebSub for a channel."""
    from ..youtube_pubsub import extract_channel_id, unsubscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return

    channel_id = extract_channel_id(channel_url)
    if not channel_id:
        return

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None
    unsubscribe_channel(channel_id, callback_url, secret=hub_secret)
