"""Pydantic schemas for response serialization.

Each schema defines the output shape for an API endpoint.
Request validation schemas are in schemas.py.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------


class ResponseBase(BaseModel):
    """Base class for all response schemas."""

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Shared summaries
# ---------------------------------------------------------------------------


class UserSummary(ResponseBase):
    """Minimal user info embedded in other responses."""

    id: str
    display_name: str
    avatar_url: str | None = None


class BannedByUserSummary(ResponseBase):
    """Minimal user info for banned_by_user (no avatar)."""

    id: str
    display_name: str


# ---------------------------------------------------------------------------
# Breed
# ---------------------------------------------------------------------------


class BreedResponse(ResponseBase):
    id: int
    taxon_id: int
    name_en: str
    name_zh: str | None = None
    breed_group: str | None = None


# ---------------------------------------------------------------------------
# Fictional Species
# ---------------------------------------------------------------------------


class FictionalSpeciesResponse(ResponseBase):
    id: int
    name: str
    name_zh: str | None = None
    origin: str
    sub_origin: str | None = None
    category_path: str | None = None
    description: str | None = None


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------


class NotificationResponse(ResponseBase):
    id: int
    type: str
    reference_id: int
    title: str
    message: str | None = None
    status: str | None = None
    is_read: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# LiveStream
# ---------------------------------------------------------------------------


class LiveStreamResponse(ResponseBase):
    user_id: str
    provider: str
    stream_id: str | None = None
    stream_title: str | None = None
    stream_url: str | None = None
    started_at: datetime | None = None


# ---------------------------------------------------------------------------
# AdminAlertEvent
# ---------------------------------------------------------------------------


class AdminAlertEventResponse(ResponseBase):
    id: int
    alert_type: str
    severity: str
    title: str
    context: dict[str, Any] = {}
    created_at: datetime | None = None
    notified_at: datetime | None = None


# ---------------------------------------------------------------------------
# OAuthAccount (public / full)
# ---------------------------------------------------------------------------


class OAuthAccountPublicResponse(ResponseBase):
    """Public OAuth account info — visible to other users."""

    id: str
    provider: str
    provider_display_name: str | None = None
    provider_avatar_url: str | None = None
    channel_url: str | None = None


class OAuthAccountResponse(OAuthAccountPublicResponse):
    """Full OAuth account info — visible to account owner."""

    provider_account_id: str
    show_on_profile: bool = True
    live_sub_status: str | None = None
    live_sub_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.now)
