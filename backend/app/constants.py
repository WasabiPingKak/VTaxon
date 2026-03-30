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
