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
    country_flags = db.Column(db.JSON, default=list)
    social_links = db.Column(db.JSON, default=dict)
    primary_platform = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    oauth_accounts = db.relationship('OAuthAccount', backref='user',
                                     lazy='dynamic', cascade='all, delete-orphan')
    traits = db.relationship('VtuberTrait', backref='user',
                             lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'display_name': self.display_name,
            'avatar_url': self.avatar_url,
            'role': self.role,
            'organization': self.organization,
            'country_flags': self.country_flags or [],
            'social_links': self.social_links or {},
            'primary_platform': self.primary_platform,
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
            'origin': self.origin,
            'sub_origin': self.sub_origin,
            'category_path': self.category_path,
            'description': self.description,
        }


class Breed(db.Model):
    __tablename__ = 'breeds'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    taxon_id = db.Column(db.Integer, db.ForeignKey('species_cache.taxon_id'),
                         nullable=False)
    name_en = db.Column(db.Text, nullable=False)
    name_zh = db.Column(db.Text)
    breed_group = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))

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
            return self.fictional.name
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
