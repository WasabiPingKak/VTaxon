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


# ---------------------------------------------------------------------------
# SpeciesCache
# ---------------------------------------------------------------------------


class SpeciesCacheResponse(ResponseBase):
    """Serialized species cache entry.

    Requires ``from_model()`` because of computed fields (effective_common_name_zh,
    path_zh flattening, display_name_override from service).
    """

    taxon_id: int
    scientific_name: str
    common_name_en: str | None = None
    common_name_zh: str | None = None
    alternative_names_zh: str | None = None
    taxon_rank: str | None = None
    taxon_path: str | None = None
    kingdom: str | None = None
    phylum: str | None = None
    class_field: str | None = Field(None, serialization_alias="class")
    order: str | None = None
    family: str | None = None
    genus: str | None = None
    kingdom_zh: str | None = None
    phylum_zh: str | None = None
    class_zh: str | None = None
    order_zh: str | None = None
    family_zh: str | None = None
    genus_zh: str | None = None
    display_name_override: str | None = None

    @classmethod
    def from_model(cls, species: Any) -> SpeciesCacheResponse:
        from app.services.taxonomy_zh import get_species_name_override

        path_zh = species.path_zh or {}
        name_override = get_species_name_override(species.taxon_id)
        return cls(
            taxon_id=species.taxon_id,
            scientific_name=species.scientific_name,
            common_name_en=species.common_name_en,
            common_name_zh=species._effective_common_name_zh(),
            alternative_names_zh=species.alternative_names_zh,
            taxon_rank=species.taxon_rank,
            taxon_path=species.taxon_path,
            kingdom=species.kingdom,
            phylum=species.phylum,
            class_field=species.class_,
            order=species.order_,
            family=species.family,
            genus=species.genus,
            kingdom_zh=path_zh.get("kingdom"),
            phylum_zh=path_zh.get("phylum"),
            class_zh=path_zh.get("class"),
            order_zh=path_zh.get("order"),
            family_zh=path_zh.get("family"),
            genus_zh=path_zh.get("genus"),
            display_name_override=name_override or None,
        )

    def model_dump(self, **kwargs: Any) -> dict[str, Any]:
        """Always use by_alias so ``class_field`` serializes as ``class``."""
        kwargs.setdefault("by_alias", True)
        return super().model_dump(**kwargs)


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------


class UserResponse(ResponseBase):
    """Serialized user profile.

    Requires ``from_model()`` because ``profile_data`` needs
    ``_computed_profile_data()`` (preparing→active auto-transition).
    """

    id: str
    display_name: str
    avatar_url: str | None = None
    role: str = "user"
    organization: str | None = None
    org_type: str = "indie"
    bio: str | None = None
    country_flags: list[str] = []
    social_links: dict[str, str] = {}
    primary_platform: str | None = None
    profile_data: dict[str, Any] = {}
    live_primary_real_trait_id: str | None = None
    live_primary_fictional_trait_id: str | None = None
    visibility: str = "visible"
    visibility_reason: str | None = None
    visibility_changed_at: datetime | None = None
    vtuber_declaration_at: datetime | None = None
    appeal_note: str | None = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, user: Any) -> UserResponse:
        return cls(
            id=user.id,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
            role=user.role,
            organization=user.organization,
            org_type=user.org_type or "indie",
            bio=user.bio,
            country_flags=user.country_flags or [],
            social_links=user.social_links or {},
            primary_platform=user.primary_platform,
            profile_data=user._computed_profile_data(),
            live_primary_real_trait_id=user.live_primary_real_trait_id,
            live_primary_fictional_trait_id=user.live_primary_fictional_trait_id,
            visibility=user.visibility or "visible",
            visibility_reason=user.visibility_reason,
            visibility_changed_at=user.visibility_changed_at,
            vtuber_declaration_at=user.vtuber_declaration_at,
            appeal_note=user.appeal_note,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


# ---------------------------------------------------------------------------
# VtuberTrait
# ---------------------------------------------------------------------------


class TraitResponse(ResponseBase):
    """Serialized vtuber trait with nested species/fictional/breed.

    Requires ``from_model()`` because of computed display_name,
    breed_name logic, and nested SpeciesCacheResponse.from_model().
    """

    id: str
    user_id: str
    taxon_id: int | None = None
    fictional_species_id: int | None = None
    display_name: str | None = None
    breed_name: str | None = None
    breed_id: int | None = None
    trait_note: str | None = None
    created_at: datetime
    updated_at: datetime
    breed: BreedResponse | None = None
    species: SpeciesCacheResponse | None = None
    fictional: FictionalSpeciesResponse | None = None

    @classmethod
    def from_model(cls, trait: Any) -> TraitResponse:
        breed_display = None
        if trait.breed:
            breed_display = trait.breed.name_zh or trait.breed.name_en
        elif trait.breed_name:
            breed_display = trait.breed_name

        return cls(
            id=trait.id,
            user_id=trait.user_id,
            taxon_id=trait.taxon_id,
            fictional_species_id=trait.fictional_species_id,
            display_name=trait.computed_display_name(),
            breed_name=breed_display,
            breed_id=trait.breed_id,
            trait_note=trait.trait_note,
            created_at=trait.created_at,
            updated_at=trait.updated_at,
            breed=BreedResponse.model_validate(trait.breed) if trait.breed else None,
            species=SpeciesCacheResponse.from_model(trait.species) if trait.species else None,
            fictional=FictionalSpeciesResponse.model_validate(trait.fictional) if trait.fictional else None,
        )


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
