"""Pydantic schemas for request validation.

Each schema defines the expected input shape for a route endpoint.
Business logic validation (DB lookups, ownership, conflicts) stays in routes.
"""

from collections.abc import Callable
from functools import wraps
from typing import Annotated, Any

from flask import Response, jsonify, request
from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    ValidationError,
    field_validator,
    model_validator,
)

from app.constants import ReportStatus, ReportType, RequestStatus, Visibility

# ---------------------------------------------------------------------------
# Helper: validation decorator
# ---------------------------------------------------------------------------


def validate_with(schema_cls: type[BaseModel]) -> Callable[..., Any]:
    """Decorator that validates request JSON against a Pydantic schema.

    On success, injects validated data as first argument (dict).
    On failure, returns 400 with structured error messages.
    """

    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> tuple[Response, int] | Any:
            raw = request.get_json() or {}
            try:
                model = schema_cls.model_validate(raw)
            except ValidationError as err:
                details: dict[str, list[str]] = {}
                for e in err.errors():
                    key = ".".join(str(x) for x in e["loc"]) or "_schema"
                    details.setdefault(key, []).append(e["msg"])
                return jsonify({"error": "Validation failed", "details": details}), 400
            if hasattr(model, "to_patch_dict"):
                data = model.to_patch_dict()  # type: ignore[union-attr]
            else:
                data = model.model_dump()
            return f(data, *args, **kwargs)

        return wrapper

    return decorator


# ---------------------------------------------------------------------------
# Shared types
# ---------------------------------------------------------------------------


def _strip_str(v: Any) -> Any:
    """Strip whitespace from string values."""
    if isinstance(v, str):
        return v.strip()
    return v


TrimStr = Annotated[str, BeforeValidator(_strip_str)]


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

REPORT_TYPES = ReportType.ALL
REPORT_STATUSES = ReportStatus.ALL
REPORT_UPDATE_STATUSES = ReportStatus.UPDATABLE


class CreateReportSchema(BaseModel):
    reported_user_id: str
    report_type: str = ReportType.IMPERSONATION
    reason: TrimStr = Field(min_length=1, max_length=2000)
    evidence_url: TrimStr | None = None

    @field_validator("report_type")
    @classmethod
    def check_report_type(cls, v: str) -> str:
        if v not in REPORT_TYPES:
            raise ValueError("無效的檢舉類型")
        return v


class UpdateReportSchema(BaseModel):
    status: str | None = None
    admin_note: str | None = None

    @field_validator("status")
    @classmethod
    def check_status(cls, v: str | None) -> str | None:
        if v is not None and v not in REPORT_UPDATE_STATUSES:
            raise ValueError(f"status must be one of {REPORT_UPDATE_STATUSES}")
        return v


class HideUserSchema(BaseModel):
    reason: TrimStr | None = None
    admin_note: str | None = None


class BanUserSchema(BaseModel):
    identifiers: list[dict[str, str]] = Field(min_length=1)
    reason: str | None = None
    admin_note: str | None = None


# ---------------------------------------------------------------------------
# Traits
# ---------------------------------------------------------------------------


class CreateTraitSchema(BaseModel):
    taxon_id: int | None = None
    fictional_species_id: int | None = None
    breed_id: int | None = None
    breed_name: str | None = None
    trait_note: str | None = None

    @model_validator(mode="after")
    def require_species(self) -> "CreateTraitSchema":
        if not self.taxon_id and not self.fictional_species_id:
            raise ValueError("taxon_id or fictional_species_id required")
        return self


class UpdateTraitSchema(BaseModel):
    breed_id: int | None = None
    breed_name: str | None = None
    trait_note: str | None = None


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

ALLOWED_SNS_KEYS = frozenset(
    {"twitter", "threads", "instagram", "bluesky", "discord", "facebook", "marshmallow", "email"}
)


class CreatorSchema(BaseModel):
    name: str
    url: str | None = None


class ProfileDataSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    debut_date: str | None = None
    birthday_month: int | None = Field(None, ge=1, le=12)
    birthday_day: int | None = Field(None, ge=1, le=31)
    blood_type: str | None = None
    mbti: str | None = None
    gender: str | None = None
    representative_emoji: str | None = None
    fan_name: str | None = None
    activity_status: str | None = None
    illustrators: list[CreatorSchema] | None = None
    riggers: list[CreatorSchema] | None = None
    modelers_3d: list[CreatorSchema] | None = None
    hashtags: list[str] | None = None
    debut_video_url: str | None = None

    @field_validator("blood_type")
    @classmethod
    def check_blood_type(cls, v: str | None) -> str | None:
        if v is not None and v not in ("A", "B", "O", "AB"):
            raise ValueError("Invalid blood_type")
        return v

    @field_validator("activity_status")
    @classmethod
    def check_activity_status(cls, v: str | None) -> str | None:
        if v is not None and v not in ("active", "hiatus", "preparing"):
            raise ValueError("Invalid activity_status")
        return v


class UpdateProfileSchema(BaseModel):
    """Profile update schema for PATCH /me.

    Uses ``model_fields_set`` to preserve PATCH semantics — only fields
    actually sent by the client appear in ``to_patch_dict()`` output.
    """

    model_config = ConfigDict(extra="ignore")

    display_name: str | None = None
    organization: str | None = None
    bio: TrimStr | None = Field(None, max_length=500)
    country_flags: list[Annotated[str, Field(min_length=2, max_length=2)]] | None = None
    social_links: dict[str, str] | None = None
    primary_platform: str | None = None
    profile_data: ProfileDataSchema | None = None
    org_type: str | None = None
    live_primary_real_trait_id: str | None = None
    live_primary_fictional_trait_id: str | None = None
    vtuber_declaration_at: bool | None = None

    @field_validator("primary_platform")
    @classmethod
    def check_primary_platform(cls, v: str | None) -> str | None:
        if v is not None and v not in ("youtube", "twitch"):
            raise ValueError("primary_platform must be youtube or twitch")
        return v

    @field_validator("org_type")
    @classmethod
    def check_org_type(cls, v: str | None) -> str | None:
        if v is not None and v not in ("indie", "corporate", "club"):
            raise ValueError("org_type must be indie, corporate, or club")
        return v

    @field_validator("social_links")
    @classmethod
    def check_social_links(cls, v: dict[str, str] | None) -> dict[str, str] | None:
        if v is not None:
            invalid = set(v.keys()) - ALLOWED_SNS_KEYS
            if invalid:
                raise ValueError(f"Invalid social link keys: {invalid}")
            for val in v.values():
                if len(val) > 500:
                    raise ValueError("Social link value exceeds 500 characters")
        return v

    def to_patch_dict(self) -> dict[str, Any]:
        """Convert to dict preserving PATCH semantics (only sent fields)."""
        data = self.model_dump(include=self.model_fields_set)
        # Nested model: also filter to only sent sub-fields
        if "profile_data" in data and self.profile_data is not None:
            data["profile_data"] = self.profile_data.model_dump(include=self.profile_data.model_fields_set)
        # Uppercase country flags
        if "country_flags" in data and data["country_flags"] is not None:
            data["country_flags"] = [f.upper() for f in data["country_flags"]]
        # indie org_type clears organization
        if data.get("org_type") == "indie":
            data["organization"] = None
        # Strip social_links values and remove empty
        if "social_links" in data and data["social_links"] is not None:
            data["social_links"] = {k: v.strip() for k, v in data["social_links"].items() if v}
        # Normalize bio: empty/whitespace → None
        if "bio" in data and data["bio"] is not None:
            data["bio"] = data["bio"] or None
        return data


class AppealSchema(BaseModel):
    appeal_note: TrimStr = Field(min_length=1, max_length=2000)


# ---------------------------------------------------------------------------
# Breeds
# ---------------------------------------------------------------------------


class CreateBreedSchema(BaseModel):
    taxon_id: int
    name_en: TrimStr = Field(min_length=1)
    name_zh: TrimStr | None = None
    breed_group: TrimStr | None = None


class CreateBreedRequestSchema(BaseModel):
    taxon_id: int | None = None
    name_zh: TrimStr = Field(min_length=1)
    name_en: TrimStr = Field(min_length=1)
    description: TrimStr = Field(min_length=1)


REQUEST_STATUSES_ALL = RequestStatus.ALL
REQUEST_UPDATE_STATUSES = RequestStatus.UPDATABLE


class UpdateRequestStatusSchema(BaseModel):
    status: str
    admin_note: str | None = None

    @field_validator("status")
    @classmethod
    def check_status(cls, v: str) -> str:
        if v not in REQUEST_UPDATE_STATUSES:
            raise ValueError(f"status must be one of {REQUEST_UPDATE_STATUSES}")
        return v


# ---------------------------------------------------------------------------
# Fictional Species
# ---------------------------------------------------------------------------


class CreateFictionalRequestSchema(BaseModel):
    name_zh: TrimStr = Field(min_length=1, max_length=30)
    name_en: TrimStr | None = Field(None, max_length=60)
    suggested_origin: TrimStr | None = Field(None, min_length=2, max_length=60)
    suggested_sub_origin: TrimStr | None = None
    description: TrimStr | None = Field(None, min_length=10, max_length=500)


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------


class MarkReadSchema(BaseModel):
    all: bool = False
    ids: list[int] | None = None

    @model_validator(mode="after")
    def require_all_or_ids(self) -> "MarkReadSchema":
        if not self.all and not self.ids:
            raise ValueError("Provide all:true or ids:[...]")
        return self


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------


class SetVisibilitySchema(BaseModel):
    visibility: str
    reason: TrimStr | None = None

    @field_validator("visibility")
    @classmethod
    def check_visibility(cls, v: str) -> str:
        if v not in Visibility.ADMIN_SETTABLE:
            raise ValueError("visibility must be visible or hidden")
        return v
