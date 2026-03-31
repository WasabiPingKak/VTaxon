"""Livestream subscription management — cron jobs and admin endpoints."""

import os

from flask import Blueprint, Response, jsonify, request

from ..auth import admin_required
from ..limiter import limiter
from ..services import subscriptions as subs_svc

subscriptions_bp = Blueprint("subscriptions", __name__)


def _verify_cron_secret() -> bool:
    """Verify X-Cron-Secret header matches CRON_SECRET env var."""
    secret = os.environ.get("CRON_SECRET", "")
    if not secret:
        return False
    return request.headers.get("X-Cron-Secret", "") == secret


# ── YouTube cron endpoints ──


@subscriptions_bp.route("/livestream/youtube-check-offline", methods=["POST"])
@limiter.exempt
def youtube_check_offline() -> tuple[Response, int] | Response:
    """Cron: 檢查 YouTube 直播是否已結束。
    ---
    tags:
      - Subscriptions
    parameters:
      - name: X-Cron-Secret
        in: header
        type: string
        required: true
    responses:
      200:
        description: 檢查結果
      403:
        description: 未授權
    """
    if not _verify_cron_secret():
        return jsonify({"error": "Unauthorized"}), 403

    api_key = os.environ.get("YOUTUBE_API_KEY", "")
    if not api_key:
        return jsonify({"error": "YOUTUBE_API_KEY not configured"}), 500

    return jsonify(subs_svc.youtube_check_offline(api_key))


@subscriptions_bp.route("/livestream/youtube-renew-subs", methods=["POST"])
@limiter.exempt
def youtube_renew_subs() -> tuple[Response, int] | Response:
    """Cron: 批量續訂 YouTube WebSub 訂閱。
    ---
    tags:
      - Subscriptions
    parameters:
      - name: X-Cron-Secret
        in: header
        type: string
        required: true
    responses:
      200:
        description: 續訂結果
      403:
        description: 未授權
    """
    if not _verify_cron_secret():
        return jsonify({"error": "Unauthorized"}), 403

    result = subs_svc.youtube_renew_subs()
    if result is None:
        return jsonify({"error": "WEBHOOK_BASE_URL not configured"}), 500
    return jsonify(result)


@subscriptions_bp.route("/livestream/youtube-subscribe-one", methods=["POST"])
@limiter.exempt
def youtube_subscribe_one() -> tuple[Response, int]:
    """Cloud Task: 訂閱單一 YouTube 頻道。
    ---
    tags:
      - Subscriptions
    parameters:
      - name: X-Cron-Secret
        in: header
        type: string
        required: true
      - name: channel_id
        in: query
        type: string
        required: true
    responses:
      200:
        description: 訂閱成功
      400:
        description: 缺少 channel_id
      403:
        description: 未授權
      500:
        description: 訂閱失敗
    """
    if not _verify_cron_secret():
        secret = os.environ.get("CRON_SECRET", "")
        provided = request.headers.get("X-Cron-Secret", "")
        if secret and provided and provided != secret:
            return jsonify({"error": "Unauthorized"}), 403

    channel_id = request.args.get("channel_id", "")
    if not channel_id:
        return jsonify({"error": "channel_id required"}), 400

    result, status = subs_svc.youtube_subscribe_one(channel_id)
    return jsonify(result), status


# ── Admin: Twitch subscription management ──


@subscriptions_bp.route("/livestream/twitch-subs", methods=["GET"])
@admin_required
def list_twitch_subs() -> tuple[Response, int]:
    """列出所有 Twitch EventSub 訂閱。管理員。
    ---
    tags:
      - Subscriptions
    security:
      - BearerAuth: []
    responses:
      200:
        description: 訂閱清單
      502:
        description: Twitch API 無法使用
    """
    result, status = subs_svc.list_twitch_subs()
    return jsonify(result), status


@subscriptions_bp.route("/livestream/rebuild-twitch-subs", methods=["POST"])
@admin_required
def rebuild_twitch_subs() -> tuple[Response, int]:
    """批量重建 Twitch EventSub 訂閱。管理員。
    ---
    tags:
      - Subscriptions
    security:
      - BearerAuth: []
    parameters:
      - name: offset
        in: query
        type: integer
        default: 0
      - name: limit
        in: query
        type: integer
        default: 20
      - name: clean
        in: query
        type: string
        description: 設為 1 先刪除現有訂閱
    responses:
      200:
        description: 重建結果
      500:
        description: 設定缺失
    """
    result, status = subs_svc.rebuild_twitch_subs(
        offset=request.args.get("offset", 0, type=int),
        limit=request.args.get("limit", 20, type=int),
        clean=request.args.get("clean", "", type=str) == "1",
    )
    return jsonify(result), status


# ── Admin: YouTube subscription management ──


@subscriptions_bp.route("/livestream/youtube-subs", methods=["GET"])
@admin_required
def list_youtube_subs() -> Response:
    """列出所有 YouTube WebSub 訂閱狀態。管理員。
    ---
    tags:
      - Subscriptions
    security:
      - BearerAuth: []
    responses:
      200:
        description: YouTube 帳號與訂閱狀態
    """
    return jsonify(subs_svc.list_youtube_subs())


@subscriptions_bp.route("/livestream/rebuild-youtube-subs", methods=["POST"])
@admin_required
def rebuild_youtube_subs() -> tuple[Response, int]:
    """批量重建 YouTube WebSub 訂閱。管理員。
    ---
    tags:
      - Subscriptions
    security:
      - BearerAuth: []
    parameters:
      - name: offset
        in: query
        type: integer
        default: 0
      - name: limit
        in: query
        type: integer
        default: 20
      - name: clean
        in: query
        type: string
        description: 設為 1 先取消現有訂閱
    responses:
      200:
        description: 重建結果
      500:
        description: WEBHOOK_BASE_URL 未設定
    """
    result, status = subs_svc.rebuild_youtube_subs(
        offset=request.args.get("offset", 0, type=int),
        limit=request.args.get("limit", 20, type=int),
        clean=request.args.get("clean", "", type=str) == "1",
    )
    return jsonify(result), status
