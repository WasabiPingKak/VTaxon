"""Marshmallow schemas for request validation.

Each schema defines the expected input shape for a route endpoint.
Business logic validation (DB lookups, ownership, conflicts) stays in routes.
"""

from functools import wraps

from flask import jsonify, request
from marshmallow import Schema, ValidationError, fields, validate, validates_schema

# ---------------------------------------------------------------------------
# Helper: validation decorator
# ---------------------------------------------------------------------------


def validate_with(schema_cls):
    """Decorator that validates request JSON against a marshmallow schema.

    On success, injects validated data as first argument.
    On failure, returns 400 with structured error messages.
    """

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            raw = request.get_json() or {}
            try:
                data = schema_cls().load(raw)
            except ValidationError as err:
                return jsonify({"error": "Validation failed", "details": err.messages}), 400
            return f(data, *args, **kwargs)

        return wrapper

    return decorator


# ---------------------------------------------------------------------------
# Shared field types
# ---------------------------------------------------------------------------

TrimmedString = fields.String


class TrimString(fields.String):
    """String field that strips whitespace on deserialization."""

    def _deserialize(self, value, attr, data, **kwargs):
        val = super()._deserialize(value, attr, data, **kwargs)
        return val.strip() if val else val


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

REPORT_TYPES = ("impersonation", "not_vtuber")
REPORT_STATUSES = ("pending", "investigating", "confirmed", "dismissed")
REPORT_UPDATE_STATUSES = ("investigating", "confirmed", "dismissed")


class CreateReportSchema(Schema):
    reported_user_id = fields.String(required=True, error_messages={"required": "缺少被舉報使用者 ID"})
    report_type = fields.String(
        validate=validate.OneOf(REPORT_TYPES, error="無效的檢舉類型"),
        load_default="impersonation",
    )
    reason = TrimString(
        required=True,
        validate=validate.Length(min=1, max=2000, error="理由不得超過 2000 字"),
        error_messages={"required": "請填寫舉報理由"},
    )
    evidence_url = TrimString(load_default=None)


class UpdateReportSchema(Schema):
    status = fields.String(validate=validate.OneOf(REPORT_UPDATE_STATUSES))
    admin_note = fields.String(load_default=None, allow_none=True)


class HideUserSchema(Schema):
    reason = TrimString(load_default=None)
    admin_note = fields.String(load_default=None, allow_none=True)


class BanUserSchema(Schema):
    identifiers = fields.List(
        fields.Dict(keys=fields.String(), values=fields.String()),
        required=True,
        validate=validate.Length(min=1, error="請選擇至少一個要封鎖的帳號"),
    )
    reason = fields.String(load_default=None)
    admin_note = fields.String(load_default=None, allow_none=True)


# ---------------------------------------------------------------------------
# Traits
# ---------------------------------------------------------------------------


class CreateTraitSchema(Schema):
    taxon_id = fields.Integer(load_default=None)
    fictional_species_id = fields.Integer(load_default=None)
    breed_id = fields.Integer(load_default=None)
    breed_name = fields.String(load_default=None)
    trait_note = fields.String(load_default=None)

    @validates_schema
    def require_species(self, data, **kwargs):
        if not data.get("taxon_id") and not data.get("fictional_species_id"):
            raise ValidationError("taxon_id or fictional_species_id required")


class UpdateTraitSchema(Schema):
    breed_id = fields.Integer(load_default=None, allow_none=True)
    breed_name = fields.String(load_default=None, allow_none=True)
    trait_note = fields.String(load_default=None, allow_none=True)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

ALLOWED_SNS_KEYS = frozenset(
    {"twitter", "threads", "instagram", "bluesky", "discord", "facebook", "marshmallow", "email"}
)


class CreatorSchema(Schema):
    """Schema for illustrator/rigger/modeler entries."""

    name = fields.String(required=True)
    url = fields.String(load_default=None, allow_none=True)


class ProfileDataSchema(Schema):
    """Nested schema for profile_data JSON field."""

    debut_date = fields.String(load_default=None, allow_none=True)
    birthday_month = fields.Integer(
        load_default=None,
        allow_none=True,
        validate=validate.Range(min=1, max=12, error="birthday_month must be 1-12"),
    )
    birthday_day = fields.Integer(
        load_default=None,
        allow_none=True,
        validate=validate.Range(min=1, max=31, error="birthday_day must be 1-31"),
    )
    blood_type = fields.String(
        load_default=None,
        allow_none=True,
        validate=validate.OneOf(("A", "B", "O", "AB"), error="Invalid blood_type"),
    )
    mbti = fields.String(load_default=None, allow_none=True)
    gender = fields.String(load_default=None, allow_none=True)
    representative_emoji = fields.String(load_default=None, allow_none=True)
    fan_name = fields.String(load_default=None, allow_none=True)
    activity_status = fields.String(
        load_default=None,
        allow_none=True,
        validate=validate.OneOf(("active", "hiatus", "preparing"), error="Invalid activity_status"),
    )
    illustrators = fields.List(fields.Nested(CreatorSchema), load_default=None, allow_none=True)
    riggers = fields.List(fields.Nested(CreatorSchema), load_default=None, allow_none=True)
    modelers_3d = fields.List(fields.Nested(CreatorSchema), load_default=None, allow_none=True)
    hashtags = fields.List(fields.String(), load_default=None, allow_none=True)
    debut_video_url = fields.String(load_default=None, allow_none=True)

    class Meta:
        # Reject unknown keys
        unknown = "RAISE"


class UpdateProfileSchema(Schema):
    display_name = fields.String(load_default=None)
    organization = fields.String(load_default=None, allow_none=True)
    bio = TrimString(
        load_default=None,
        allow_none=True,
        validate=validate.Length(max=500, error="bio must be 500 characters or less"),
    )
    country_flags = fields.List(
        fields.String(validate=validate.Length(equal=2, error="Each flag must be a 2-character country code")),
        load_default=None,
    )
    social_links = fields.Dict(
        keys=fields.String(validate=validate.OneOf(ALLOWED_SNS_KEYS)),
        values=fields.String(validate=validate.Length(max=500)),
        load_default=None,
    )
    primary_platform = fields.String(
        load_default=None,
        validate=validate.OneOf(("youtube", "twitch"), error="primary_platform must be youtube or twitch"),
    )
    profile_data = fields.Nested(ProfileDataSchema, load_default=None)
    org_type = fields.String(
        load_default=None,
        validate=validate.OneOf(("indie", "corporate", "club"), error="org_type must be indie, corporate, or club"),
    )
    live_primary_real_trait_id = fields.String(load_default=None, allow_none=True)
    live_primary_fictional_trait_id = fields.String(load_default=None, allow_none=True)
    vtuber_declaration_at = fields.Boolean(load_default=None)

    class Meta:
        unknown = "EXCLUDE"


class AppealSchema(Schema):
    appeal_note = TrimString(
        required=True,
        validate=validate.Length(min=1, max=2000, error="申訴說明不得超過 2000 字"),
        error_messages={"required": "請填寫申訴說明"},
    )


# ---------------------------------------------------------------------------
# Breeds
# ---------------------------------------------------------------------------


class CreateBreedSchema(Schema):
    taxon_id = fields.Integer(required=True, error_messages={"required": "taxon_id required"})
    name_en = TrimString(
        required=True,
        validate=validate.Length(min=1),
        error_messages={"required": "name_en required"},
    )
    name_zh = TrimString(load_default=None)
    breed_group = TrimString(load_default=None)


class CreateBreedRequestSchema(Schema):
    taxon_id = fields.Integer(load_default=None)
    name_zh = TrimString(
        required=True,
        validate=validate.Length(min=1),
        error_messages={"required": "請填寫品種中文名稱"},
    )
    name_en = TrimString(
        required=True,
        validate=validate.Length(min=1),
        error_messages={"required": "請填寫品種英文名稱"},
    )
    description = TrimString(
        required=True,
        validate=validate.Length(min=1),
        error_messages={"required": "請填寫補充說明並附上參考來源連結"},
    )


REQUEST_STATUSES_ALL = ("pending", "received", "in_progress", "completed", "approved", "rejected")
REQUEST_UPDATE_STATUSES = ("received", "in_progress", "completed", "rejected")


class UpdateRequestStatusSchema(Schema):
    status = fields.String(
        required=True,
        validate=validate.OneOf(REQUEST_UPDATE_STATUSES),
    )
    admin_note = fields.String(load_default=None, allow_none=True)


# ---------------------------------------------------------------------------
# Fictional Species
# ---------------------------------------------------------------------------


class CreateFictionalRequestSchema(Schema):
    name_zh = TrimString(
        required=True,
        validate=validate.Length(min=1, max=30),
        error_messages={"required": "name_zh is required"},
    )
    name_en = TrimString(load_default=None, validate=validate.Length(max=60))
    suggested_origin = TrimString(load_default=None, validate=validate.Length(min=2, max=60))
    suggested_sub_origin = TrimString(load_default=None)
    description = TrimString(load_default=None, validate=validate.Length(min=10, max=500))


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------


class MarkReadSchema(Schema):
    all = fields.Boolean(load_default=False)
    ids = fields.List(fields.Integer(), load_default=None)

    @validates_schema
    def require_all_or_ids(self, data, **kwargs):
        if not data.get("all") and not data.get("ids"):
            raise ValidationError("Provide all:true or ids:[...]")


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------


class SetVisibilitySchema(Schema):
    visibility = fields.String(
        required=True,
        validate=validate.OneOf(("visible", "hidden"), error="visibility must be visible or hidden"),
    )
    reason = TrimString(load_default=None)
