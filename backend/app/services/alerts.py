"""Admin alert event logging and digest email service.

Alert producers call ``log_alert()`` to insert events into DB.
A cron job calls ``send_alert_digest()`` to batch-send unnotified
events as a single digest email, respecting per-type cooldowns.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import func

from ..constants import AlertSeverity
from ..extensions import db
from ..models import AdminAlertEvent

logger = logging.getLogger(__name__)


def log_alert(
    *,
    alert_type: str,
    severity: str,
    title: str,
    context: dict[str, Any] | None = None,
) -> None:
    """Insert an alert event. Fire-and-forget — caller should not depend on success.

    Uses a SAVEPOINT so the insert is committed independently and any
    failure does not corrupt the caller's DB session.
    """
    try:
        with db.session.begin_nested():
            event = AdminAlertEvent(
                alert_type=alert_type,
                severity=severity,
                title=title,
                context=context or {},
            )
            db.session.add(event)
        db.session.commit()
    except Exception:
        logger.exception("Failed to log alert event: %s", title)
        db.session.rollback()


def send_alert_digest() -> dict[str, Any]:
    """Query unnotified events, apply cooldown, send digest email, mark as notified."""
    now = datetime.now(UTC)

    unnotified = (
        AdminAlertEvent.query.filter(AdminAlertEvent.notified_at.is_(None)).order_by(AdminAlertEvent.created_at).all()
    )

    if not unnotified:
        return {"status": "no_events", "total": 0}

    # Group by (alert_type, severity)
    groups: dict[tuple[str, str], list[AdminAlertEvent]] = defaultdict(list)
    for event in unnotified:
        groups[(event.alert_type, event.severity)].append(event)

    events_to_send: list[AdminAlertEvent] = []
    skipped_cooldown = 0

    for (alert_type, severity), events in groups.items():
        cooldown_seconds = AlertSeverity.COOLDOWN.get(severity, 24 * 3600)

        last_notified: datetime | None = (
            db.session.query(func.max(AdminAlertEvent.notified_at))
            .filter(
                AdminAlertEvent.alert_type == alert_type,
                AdminAlertEvent.notified_at.isnot(None),
            )
            .scalar()
        )

        if last_notified:
            # Ensure timezone-aware comparison (SQLite returns naive datetimes)
            if last_notified.tzinfo is None:
                last_notified = last_notified.replace(tzinfo=UTC)
        if last_notified and (now - last_notified) < timedelta(seconds=cooldown_seconds):
            skipped_cooldown += len(events)
            continue

        events_to_send.extend(events)

    if not events_to_send:
        return {"status": "all_cooldown", "total": len(unnotified), "skipped": skipped_cooldown}

    # Build and send digest email
    html = _build_digest_html(events_to_send)

    severity_counts: dict[str, int] = {}
    for e in events_to_send:
        severity_counts[e.severity] = severity_counts.get(e.severity, 0) + 1

    subject_parts = []
    if severity_counts.get(AlertSeverity.CRITICAL, 0):
        subject_parts.append(f"{severity_counts[AlertSeverity.CRITICAL]} critical")
    if severity_counts.get(AlertSeverity.WARNING, 0):
        subject_parts.append(f"{severity_counts[AlertSeverity.WARNING]} warning")
    if severity_counts.get(AlertSeverity.INFO, 0):
        subject_parts.append(f"{severity_counts[AlertSeverity.INFO]} info")

    subject = f"[VTaxon Alert] {', '.join(subject_parts)}"

    from .email import send_admin_notification

    send_admin_notification(subject, html)

    # Mark as notified
    event_ids = [e.id for e in events_to_send]
    AdminAlertEvent.query.filter(AdminAlertEvent.id.in_(event_ids)).update(
        {"notified_at": now}, synchronize_session="fetch"
    )
    db.session.commit()

    logger.info("Alert digest sent: %d events (%s)", len(events_to_send), ", ".join(subject_parts))
    return {
        "status": "sent",
        "total": len(events_to_send),
        "skipped_cooldown": skipped_cooldown,
    }


def _format_context(ctx: dict[str, Any]) -> str:
    """Format context dict to human-readable HTML."""
    parts = []
    for k, v in ctx.items():
        if k == "streams" and isinstance(v, list):
            items = "".join(
                f'<li><a href="{s.get("url", "")}">{s.get("title", "?")}</a></li>'
                if s.get("url")
                else f"<li>{s.get('title', '?')}</li>"
                for s in v
            )
            parts.append(f"<br><strong>Streams:</strong><ul style='margin:4px 0;'>{items}</ul>")
        else:
            parts.append(f"{k}={v}")
    return ", ".join(parts)


def _build_digest_html(events: list[AdminAlertEvent]) -> str:
    """Build HTML email body for the alert digest."""
    severity_order = {AlertSeverity.CRITICAL: 0, AlertSeverity.WARNING: 1, AlertSeverity.INFO: 2}
    events.sort(key=lambda e: (severity_order.get(e.severity, 9), e.alert_type, e.created_at))

    grouped: dict[tuple[str, str], list[AdminAlertEvent]] = defaultdict(list)
    for e in events:
        grouped[(e.severity, e.alert_type)].append(e)

    severity_colors = {
        AlertSeverity.CRITICAL: "#dc3545",
        AlertSeverity.WARNING: "#ffc107",
        AlertSeverity.INFO: "#17a2b8",
    }

    rows_html = ""
    for (severity, alert_type), group_events in grouped.items():
        color = severity_colors.get(severity, "#6c757d")
        count = len(group_events)
        latest = group_events[-1]
        context_str = _format_context(latest.context or {})

        rows_html += f"""
        <tr>
          <td style="color:{color};font-weight:bold;">{severity.upper()}</td>
          <td>{alert_type}</td>
          <td>{count}</td>
          <td>{latest.title}</td>
          <td style="font-size:13px;">{context_str}</td>
          <td>{latest.created_at.strftime("%Y-%m-%d %H:%M UTC") if latest.created_at else "-"}</td>
        </tr>"""

    return f"""
    <h2>VTaxon Alert Digest</h2>
    <p>{len(events)} event(s) since last digest</p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      <tr style="background:#f8f9fa;">
        <th>Severity</th><th>Type</th><th>Count</th>
        <th>Latest Title</th><th>Context</th><th>Time</th>
      </tr>
      {rows_html}
    </table>
    """
