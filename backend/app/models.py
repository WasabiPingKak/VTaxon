import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.dialects.postgresql import UUID as pgUUID

from .constants import ReportStatus, ReportType, RequestStatus, Visibility
from .extensions import db
from .utils.encrypted_type import EncryptedText


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    display_name = db.Column(db.Text, nullable=False)
    avatar_url = db.Column(db.Text)
    role = db.Column(db.Text, nullable=False, default="user")
    organization = db.Column(db.Text)
    org_type = db.Column(db.String(20), default="indie")
    bio = db.Column(db.Text)
    country_flags = db.Column(db.JSON, default=list)
    social_links = db.Column(db.JSON, default=dict)
    primary_platform = db.Column(db.Text)
    profile_data = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
    last_live_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Visibility / shadow-ban system
    visibility = db.Column(db.Text, nullable=False, default=Visibility.VISIBLE)
    visibility_reason = db.Column(db.Text)
    visibility_changed_at = db.Column(db.DateTime(timezone=True))
    visibility_changed_by = db.Column(db.String(36))
    vtuber_declaration_at = db.Column(db.DateTime(timezone=True))
    appeal_note = db.Column(db.Text)

    live_primary_real_trait_id = db.Column(
        db.String(36), db.ForeignKey("vtuber_traits.id", ondelete="SET NULL", use_alter=True)
    )
    live_primary_fictional_trait_id = db.Column(
        db.String(36), db.ForeignKey("vtuber_traits.id", ondelete="SET NULL", use_alter=True)
    )

    oauth_accounts = db.relationship("OAuthAccount", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    traits = db.relationship(
        "VtuberTrait", backref="user", lazy="dynamic", cascade="all, delete-orphan", foreign_keys="VtuberTrait.user_id"
    )

    def _computed_profile_data(self) -> dict[str, Any]:
        """Return profile_data with computed fields (auto-switch preparing→active)."""
        from datetime import date as _date

        pd = dict(self.profile_data or {})
        if pd.get("activity_status") == "preparing" and pd.get("debut_date"):
            try:
                debut = _date.fromisoformat(pd["debut_date"])
                if debut <= _date.today():
                    pd["activity_status"] = "active"
            except (ValueError, TypeError):
                pass
        return pd


class AuthIdAlias(db.Model):
    __tablename__ = "auth_id_aliases"

    auth_id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))


class OAuthAccount(db.Model):
    __tablename__ = "oauth_accounts"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = db.Column(db.Text, nullable=False)
    provider_account_id = db.Column(db.Text, nullable=False)
    provider_display_name = db.Column(db.Text)
    provider_avatar_url = db.Column(db.Text)
    channel_url = db.Column(db.Text)
    show_on_profile = db.Column(db.Boolean, nullable=False, default=True)
    access_token = db.Column(EncryptedText)
    refresh_token = db.Column(EncryptedText)
    token_expires_at = db.Column(db.DateTime(timezone=True))
    live_sub_status = db.Column(db.Text)
    live_sub_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    __table_args__ = (
        db.UniqueConstraint("provider", "provider_account_id", name="uq_provider_account"),
        db.CheckConstraint("provider IN ('youtube', 'twitch')", name="ck_oauth_provider"),
    )


class SpeciesCache(db.Model):
    """Local cache of GBIF species data.

    NOTE: GBIF may reassign taxon keys (usageKey) for the same species over
    time. When this happens, the old cache row remains (FK references from
    vtuber_traits, breeds, etc. still point to it), but a new row with the
    updated key may also be created. This can cause the same species to appear
    as two separate nodes in the taxonomy tree. Currently only breeds.py has
    a fallback that matches by canonical scientific name. If this becomes a
    real issue, consider a periodic reconciliation job that merges old/new
    keys and updates FK references across all related tables.
    """

    __tablename__ = "species_cache"

    taxon_id = db.Column(db.Integer, primary_key=True)
    scientific_name = db.Column(db.Text, nullable=False)
    common_name_en = db.Column(db.Text)
    common_name_zh = db.Column(db.Text)
    alternative_names_zh = db.Column(db.Text)
    taxon_rank = db.Column(db.Text)
    taxon_path = db.Column(db.Text)
    kingdom = db.Column(db.Text)
    phylum = db.Column(db.Text)
    class_ = db.Column("class", db.Text)
    order_ = db.Column("order_", db.Text)
    family = db.Column(db.Text)
    genus = db.Column(db.Text)
    path_zh = db.Column(db.JSON, default=dict)
    cached_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    def _effective_common_name_zh(self) -> str | None:
        """Return common_name_zh with genus suffix '屬' stripped for species-level taxa."""
        from .utils.taxonomy import strip_genus_suffix

        return strip_genus_suffix(self.common_name_zh, self.taxon_rank)


class FictionalSpecies(db.Model):
    __tablename__ = "fictional_species"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, nullable=False)
    name_zh = db.Column(db.Text)
    origin = db.Column(db.Text, nullable=False)
    sub_origin = db.Column(db.Text)
    category_path = db.Column(db.Text)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))


class FictionalSpeciesRequest(db.Model):
    __tablename__ = "fictional_species_requests"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"))
    name_zh = db.Column(db.Text, nullable=False)
    name_en = db.Column(db.Text)
    suggested_origin = db.Column(db.Text)
    suggested_sub_origin = db.Column(db.Text)
    description = db.Column(db.Text)
    status = db.Column(db.Text, nullable=False, default=RequestStatus.PENDING)
    admin_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    user = db.relationship("User", backref="fictional_requests", lazy="joined")


class Breed(db.Model):
    __tablename__ = "breeds"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    taxon_id = db.Column(db.Integer, db.ForeignKey("species_cache.taxon_id"), nullable=False)
    name_en = db.Column(db.Text, nullable=False)
    name_zh = db.Column(db.Text)
    breed_group = db.Column(db.Text)
    wikidata_id = db.Column(db.Text)
    source = db.Column(db.Text, default="manual")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    species = db.relationship("SpeciesCache", backref="breeds", lazy="joined")

    __table_args__ = (db.UniqueConstraint("taxon_id", "name_en", name="uq_breed_taxon_name"),)


class BreedRequest(db.Model):
    __tablename__ = "breed_requests"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"))
    taxon_id = db.Column(db.Integer, db.ForeignKey("species_cache.taxon_id"))
    name_zh = db.Column(db.Text)
    name_en = db.Column(db.Text)
    description = db.Column(db.Text)
    status = db.Column(db.Text, nullable=False, default=RequestStatus.PENDING)
    admin_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    user = db.relationship("User", backref="breed_requests", lazy="joined")
    species = db.relationship("SpeciesCache", lazy="joined")


class SpeciesNameReport(db.Model):
    __tablename__ = "species_name_reports"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"))
    taxon_id = db.Column(db.Integer, db.ForeignKey("species_cache.taxon_id"))
    report_type = db.Column(db.Text, nullable=False)  # 'missing_zh' | 'wrong_zh'
    current_name_zh = db.Column(db.Text)
    suggested_name_zh = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Text, nullable=False, default=RequestStatus.PENDING)
    admin_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    user = db.relationship("User", backref="species_name_reports", lazy="joined")
    species = db.relationship("SpeciesCache", lazy="joined")


class UserReport(db.Model):
    __tablename__ = "user_reports"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    reporter_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"))
    reported_user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"))
    report_type = db.Column(db.Text, nullable=False, default=ReportType.IMPERSONATION)
    reason = db.Column(db.Text, nullable=False)
    evidence_url = db.Column(db.Text)
    status = db.Column(db.Text, nullable=False, default=ReportStatus.PENDING)
    admin_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    reporter = db.relationship("User", foreign_keys=[reporter_id], backref="submitted_reports", lazy="joined")
    reported_user = db.relationship("User", foreign_keys=[reported_user_id], backref="received_reports", lazy="joined")


class Blacklist(db.Model):
    __tablename__ = "blacklist"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    identifier_type = db.Column(db.Text, nullable=False)
    identifier_value = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"))
    reason = db.Column(db.Text)
    banned_by = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    original_user = db.relationship("User", foreign_keys=[user_id], backref="blacklist_entries", lazy="joined")
    banned_by_user = db.relationship("User", foreign_keys=[banned_by], backref="bans_issued", lazy="joined")

    __table_args__ = (db.UniqueConstraint("identifier_type", "identifier_value", name="uq_blacklist_identifier"),)


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(pgUUID(as_uuid=False), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = db.Column(db.Text, nullable=False)
    reference_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.Text, nullable=False)
    message = db.Column(db.Text)
    status = db.Column(db.Text)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))


class LiveStream(db.Model):
    __tablename__ = "live_streams"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = db.Column(db.Text, nullable=False)
    stream_id = db.Column(db.Text)
    stream_title = db.Column(db.Text)
    stream_url = db.Column(db.Text)
    started_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    __table_args__ = (
        db.UniqueConstraint("user_id", "provider", name="uq_live_stream_user_provider"),
        db.CheckConstraint("provider IN ('youtube', 'twitch')", name="ck_live_stream_provider"),
    )


class VtuberTrait(db.Model):
    __tablename__ = "vtuber_traits"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    taxon_id = db.Column(db.Integer, db.ForeignKey("species_cache.taxon_id"))
    fictional_species_id = db.Column(db.Integer, db.ForeignKey("fictional_species.id"))
    breed_name = db.Column(db.Text)  # legacy free-text, prefer breed_id
    breed_id = db.Column(db.Integer, db.ForeignKey("breeds.id", ondelete="SET NULL"))
    trait_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    species = db.relationship("SpeciesCache", backref="traits", lazy="joined")
    fictional = db.relationship("FictionalSpecies", backref="traits", lazy="joined")
    breed = db.relationship("Breed", backref="traits", lazy="joined")

    __table_args__ = (
        db.CheckConstraint("taxon_id IS NOT NULL OR fictional_species_id IS NOT NULL", name="ck_trait_has_species"),
    )

    def computed_display_name(self) -> str | None:
        """Compute display name from related species or fictional species."""
        if self.species:
            return self.species._effective_common_name_zh() or self.species.scientific_name
        if self.fictional:
            return self.fictional.name_zh or self.fictional.name
        return None


# ---------------------------------------------------------------------------
# Admin Alert Events
# ---------------------------------------------------------------------------


class AdminAlertEvent(db.Model):  # type: ignore[name-defined]
    __tablename__ = "admin_alert_events"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    alert_type = db.Column(db.Text, nullable=False)
    severity = db.Column(db.Text, nullable=False)
    title = db.Column(db.Text, nullable=False)
    context = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
    notified_at = db.Column(db.DateTime(timezone=True))
