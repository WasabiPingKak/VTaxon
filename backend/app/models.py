import uuid
from datetime import datetime, timezone

from .extensions import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))
    display_name = db.Column(db.Text, nullable=False)
    avatar_url = db.Column(db.Text)
    role = db.Column(db.Text, nullable=False, default='user')
    organization = db.Column(db.Text)
    bio = db.Column(db.Text)
    country_flags = db.Column(db.JSON, default=list)
    social_links = db.Column(db.JSON, default=dict)
    primary_platform = db.Column(db.Text)
    profile_data = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    oauth_accounts = db.relationship('OAuthAccount', backref='user',
                                     lazy='dynamic', cascade='all, delete-orphan')
    traits = db.relationship('VtuberTrait', backref='user',
                             lazy='dynamic', cascade='all, delete-orphan')

    def _computed_profile_data(self):
        """Return profile_data with computed fields (auto-switch preparing→active)."""
        from datetime import date as _date
        pd = dict(self.profile_data or {})
        if pd.get('activity_status') == 'preparing' and pd.get('debut_date'):
            try:
                debut = _date.fromisoformat(pd['debut_date'])
                if debut <= _date.today():
                    pd['activity_status'] = 'active'
            except (ValueError, TypeError):
                pass
        return pd

    def to_dict(self):
        return {
            'id': self.id,
            'display_name': self.display_name,
            'avatar_url': self.avatar_url,
            'role': self.role,
            'organization': self.organization,
            'bio': self.bio,
            'country_flags': self.country_flags or [],
            'social_links': self.social_links or {},
            'primary_platform': self.primary_platform,
            'profile_data': self._computed_profile_data(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }


class AuthIdAlias(db.Model):
    __tablename__ = 'auth_id_aliases'

    auth_id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id',
                        ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))


class OAuthAccount(db.Model):
    __tablename__ = 'oauth_accounts'

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id',
                        ondelete='CASCADE'), nullable=False)
    provider = db.Column(db.Text, nullable=False)
    provider_account_id = db.Column(db.Text, nullable=False)
    provider_display_name = db.Column(db.Text)
    provider_avatar_url = db.Column(db.Text)
    channel_url = db.Column(db.Text)
    show_on_profile = db.Column(db.Boolean, nullable=False, default=True)
    access_token = db.Column(db.Text)
    refresh_token = db.Column(db.Text)
    token_expires_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('provider', 'provider_account_id',
                            name='uq_provider_account'),
    )

    def to_dict(self, public=False):
        result = {
            'id': self.id,
            'provider': self.provider,
            'provider_display_name': self.provider_display_name,
            'provider_avatar_url': self.provider_avatar_url,
            'channel_url': self.channel_url,
        }
        if not public:
            result.update({
                'provider_account_id': self.provider_account_id,
                'show_on_profile': self.show_on_profile,
                'created_at': self.created_at.isoformat(),
            })
        return result


class SpeciesCache(db.Model):
    __tablename__ = 'species_cache'

    taxon_id = db.Column(db.Integer, primary_key=True)
    scientific_name = db.Column(db.Text, nullable=False)
    common_name_en = db.Column(db.Text)
    common_name_zh = db.Column(db.Text)
    alternative_names_zh = db.Column(db.Text)
    taxon_rank = db.Column(db.Text)
    taxon_path = db.Column(db.Text)
    kingdom = db.Column(db.Text)
    phylum = db.Column(db.Text)
    class_ = db.Column('class', db.Text)
    order_ = db.Column('order_', db.Text)
    family = db.Column(db.Text)
    genus = db.Column(db.Text)
    path_zh = db.Column(db.JSON, default=dict)
    cached_at = db.Column(db.DateTime(timezone=True), nullable=False,
                          default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        path_zh = self.path_zh or {}
        result = {
            'taxon_id': self.taxon_id,
            'scientific_name': self.scientific_name,
            'common_name_en': self.common_name_en,
            'common_name_zh': self.common_name_zh,
            'alternative_names_zh': self.alternative_names_zh,
            'taxon_rank': self.taxon_rank,
            'taxon_path': self.taxon_path,
            'kingdom': self.kingdom,
            'phylum': self.phylum,
            'class': self.class_,
            'order': self.order_,
            'family': self.family,
            'genus': self.genus,
            'kingdom_zh': path_zh.get('kingdom'),
            'phylum_zh': path_zh.get('phylum'),
            'class_zh': path_zh.get('class'),
            'order_zh': path_zh.get('order'),
            'family_zh': path_zh.get('family'),
            'genus_zh': path_zh.get('genus'),
        }
        return result


class FictionalSpecies(db.Model):
    __tablename__ = 'fictional_species'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, nullable=False)
    name_zh = db.Column(db.Text)
    origin = db.Column(db.Text, nullable=False)
    sub_origin = db.Column(db.Text)
    category_path = db.Column(db.Text)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'name_zh': self.name_zh,
            'origin': self.origin,
            'sub_origin': self.sub_origin,
            'category_path': self.category_path,
            'description': self.description,
        }


class FictionalSpeciesRequest(db.Model):
    __tablename__ = 'fictional_species_requests'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id',
                        ondelete='SET NULL'))
    name_zh = db.Column(db.Text, nullable=False)
    name_en = db.Column(db.Text)
    suggested_origin = db.Column(db.Text)
    suggested_sub_origin = db.Column(db.Text)
    description = db.Column(db.Text)
    status = db.Column(db.Text, nullable=False, default='pending')
    admin_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref='fictional_requests', lazy='joined')

    def to_dict(self):
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'name_zh': self.name_zh,
            'name_en': self.name_en,
            'suggested_origin': self.suggested_origin,
            'suggested_sub_origin': self.suggested_sub_origin,
            'description': self.description,
            'status': self.status,
            'admin_note': self.admin_note,
            'created_at': self.created_at.isoformat(),
        }
        if self.user:
            result['user'] = {
                'id': self.user.id,
                'display_name': self.user.display_name,
                'avatar_url': self.user.avatar_url,
            }
        return result


class Breed(db.Model):
    __tablename__ = 'breeds'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    taxon_id = db.Column(db.Integer, db.ForeignKey('species_cache.taxon_id'),
                         nullable=False)
    name_en = db.Column(db.Text, nullable=False)
    name_zh = db.Column(db.Text)
    breed_group = db.Column(db.Text)
    wikidata_id = db.Column(db.Text)
    source = db.Column(db.Text, default='manual')
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))

    species = db.relationship('SpeciesCache', backref='breeds', lazy='joined')

    __table_args__ = (
        db.UniqueConstraint('taxon_id', 'name_en', name='uq_breed_taxon_name'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'taxon_id': self.taxon_id,
            'name_en': self.name_en,
            'name_zh': self.name_zh,
            'breed_group': self.breed_group,
        }


class BreedRequest(db.Model):
    __tablename__ = 'breed_requests'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id',
                        ondelete='SET NULL'))
    taxon_id = db.Column(db.Integer, db.ForeignKey('species_cache.taxon_id'))
    name_zh = db.Column(db.Text)
    name_en = db.Column(db.Text)
    description = db.Column(db.Text)
    status = db.Column(db.Text, nullable=False, default='pending')
    admin_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref='breed_requests', lazy='joined')
    species = db.relationship('SpeciesCache', lazy='joined')

    def to_dict(self):
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'taxon_id': self.taxon_id,
            'name_zh': self.name_zh,
            'name_en': self.name_en,
            'description': self.description,
            'status': self.status,
            'admin_note': self.admin_note,
            'created_at': self.created_at.isoformat(),
        }
        if self.user:
            result['user'] = {
                'id': self.user.id,
                'display_name': self.user.display_name,
                'avatar_url': self.user.avatar_url,
            }
        if self.species:
            result['species_name'] = (self.species.common_name_zh
                                      or self.species.scientific_name)
        return result


class UserReport(db.Model):
    __tablename__ = 'user_reports'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    reporter_id = db.Column(db.String(36), db.ForeignKey('users.id',
                            ondelete='SET NULL'))
    reported_user_id = db.Column(db.String(36), db.ForeignKey('users.id',
                                 ondelete='SET NULL'))
    report_type = db.Column(db.Text, nullable=False, default='impersonation')
    reason = db.Column(db.Text, nullable=False)
    evidence_url = db.Column(db.Text)
    status = db.Column(db.Text, nullable=False, default='pending')
    admin_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))

    reporter = db.relationship('User', foreign_keys=[reporter_id],
                               backref='submitted_reports', lazy='joined')
    reported_user = db.relationship('User', foreign_keys=[reported_user_id],
                                    backref='received_reports', lazy='joined')

    def to_dict(self):
        result = {
            'id': self.id,
            'reporter_id': self.reporter_id,
            'reported_user_id': self.reported_user_id,
            'report_type': self.report_type,
            'reason': self.reason,
            'evidence_url': self.evidence_url,
            'status': self.status,
            'admin_note': self.admin_note,
            'created_at': self.created_at.isoformat(),
        }
        if self.reporter:
            result['reporter'] = {
                'id': self.reporter.id,
                'display_name': self.reporter.display_name,
                'avatar_url': self.reporter.avatar_url,
            }
        if self.reported_user:
            result['reported_user'] = {
                'id': self.reported_user.id,
                'display_name': self.reported_user.display_name,
                'avatar_url': self.reported_user.avatar_url,
            }
        return result


class Blacklist(db.Model):
    __tablename__ = 'blacklist'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    identifier_type = db.Column(db.Text, nullable=False)
    identifier_value = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id',
                         ondelete='SET NULL'))
    reason = db.Column(db.Text)
    banned_by = db.Column(db.String(36), db.ForeignKey('users.id',
                          ondelete='SET NULL'))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))

    original_user = db.relationship('User', foreign_keys=[user_id],
                                    backref='blacklist_entries', lazy='joined')
    banned_by_user = db.relationship('User', foreign_keys=[banned_by],
                                     backref='bans_issued', lazy='joined')

    __table_args__ = (
        db.UniqueConstraint('identifier_type', 'identifier_value',
                            name='uq_blacklist_identifier'),
    )

    def to_dict(self):
        result = {
            'id': self.id,
            'identifier_type': self.identifier_type,
            'identifier_value': self.identifier_value,
            'user_id': self.user_id,
            'reason': self.reason,
            'banned_by': self.banned_by,
            'created_at': self.created_at.isoformat(),
        }
        if self.original_user:
            result['original_user'] = {
                'id': self.original_user.id,
                'display_name': self.original_user.display_name,
                'avatar_url': self.original_user.avatar_url,
            }
        if self.banned_by_user:
            result['banned_by_user'] = {
                'id': self.banned_by_user.id,
                'display_name': self.banned_by_user.display_name,
            }
        return result


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id',
                        ondelete='CASCADE'), nullable=False)
    type = db.Column(db.Text, nullable=False)
    reference_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.Text, nullable=False)
    message = db.Column(db.Text)
    status = db.Column(db.Text)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'reference_id': self.reference_id,
            'title': self.title,
            'message': self.message,
            'status': self.status,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat(),
        }


class VtuberTrait(db.Model):
    __tablename__ = 'vtuber_traits'

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id',
                        ondelete='CASCADE'), nullable=False)
    taxon_id = db.Column(db.Integer, db.ForeignKey('species_cache.taxon_id'))
    fictional_species_id = db.Column(db.Integer,
                                     db.ForeignKey('fictional_species.id'))
    display_name = db.Column(db.Text)  # deprecated, kept for migration compat
    breed_name = db.Column(db.Text)    # legacy free-text, prefer breed_id
    breed_id = db.Column(db.Integer, db.ForeignKey('breeds.id',
                         ondelete='SET NULL'))
    trait_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    species = db.relationship('SpeciesCache', backref='traits', lazy='joined')
    fictional = db.relationship('FictionalSpecies', backref='traits',
                                lazy='joined')
    breed = db.relationship('Breed', backref='traits', lazy='joined')

    __table_args__ = (
        db.CheckConstraint(
            'taxon_id IS NOT NULL OR fictional_species_id IS NOT NULL',
            name='ck_trait_has_species'),
    )

    def computed_display_name(self):
        """Compute display_name from related species/fictional for backward compat."""
        if self.species:
            return (self.species.common_name_zh
                    or self.species.scientific_name)
        if self.fictional:
            return self.fictional.name_zh or self.fictional.name
        return self.display_name

    def to_dict(self):
        # Prefer breed object name over legacy free-text breed_name
        breed_display = None
        if self.breed:
            breed_display = self.breed.name_zh or self.breed.name_en
        elif self.breed_name:
            breed_display = self.breed_name

        result = {
            'id': self.id,
            'user_id': self.user_id,
            'taxon_id': self.taxon_id,
            'fictional_species_id': self.fictional_species_id,
            'display_name': self.computed_display_name(),
            'breed_name': breed_display,
            'breed_id': self.breed_id,
            'trait_note': self.trait_note,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
        if self.breed:
            result['breed'] = self.breed.to_dict()
        if self.species:
            result['species'] = self.species.to_dict()
        if self.fictional:
            result['fictional'] = self.fictional.to_dict()
        return result
