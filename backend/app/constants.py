"""Centralized string constants for status fields and enums.

Replaces magic strings scattered across routes, services, and schemas.
"""


# ---------------------------------------------------------------------------
# User visibility
# ---------------------------------------------------------------------------


class Visibility:
    VISIBLE = "visible"
    HIDDEN = "hidden"
    PENDING_REVIEW = "pending_review"

    ALL = (VISIBLE, HIDDEN, PENDING_REVIEW)
    ADMIN_SETTABLE = (VISIBLE, HIDDEN)


# ---------------------------------------------------------------------------
# Report types & statuses
# ---------------------------------------------------------------------------


class ReportType:
    IMPERSONATION = "impersonation"
    NOT_VTUBER = "not_vtuber"

    ALL = (IMPERSONATION, NOT_VTUBER)


class ReportStatus:
    PENDING = "pending"
    INVESTIGATING = "investigating"
    CONFIRMED = "confirmed"
    DISMISSED = "dismissed"

    ALL = (PENDING, INVESTIGATING, CONFIRMED, DISMISSED)
    UPDATABLE = (INVESTIGATING, CONFIRMED, DISMISSED)


# ---------------------------------------------------------------------------
# Request statuses (breed requests, fictional species requests, name reports)
# ---------------------------------------------------------------------------


class RequestStatus:
    PENDING = "pending"
    RECEIVED = "received"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    APPROVED = "approved"
    REJECTED = "rejected"

    ALL = (PENDING, RECEIVED, IN_PROGRESS, COMPLETED, APPROVED, REJECTED)
    UPDATABLE = (RECEIVED, IN_PROGRESS, COMPLETED, REJECTED)


# ---------------------------------------------------------------------------
# Admin alert types & severities
# ---------------------------------------------------------------------------


class AlertType:
    WEBSUB_RENEW_FAIL = "websub_renew_fail"
    YT_API_QUOTA = "yt_api_quota"
    TWITCH_REVOCATION = "twitch_revocation"
    CHECK_OFFLINE_ANOMALY = "check_offline_anomaly"
    YT_SIG_FAIL = "yt_sig_fail"

    ALL = (WEBSUB_RENEW_FAIL, YT_API_QUOTA, TWITCH_REVOCATION, CHECK_OFFLINE_ANOMALY, YT_SIG_FAIL)


class AlertSeverity:
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

    ALL = (CRITICAL, WARNING, INFO)

    COOLDOWN: dict[str, int] = {
        CRITICAL: 4 * 3600,
        WARNING: 24 * 3600,
        INFO: 24 * 3600,
    }
