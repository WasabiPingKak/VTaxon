"""Unit tests for model methods — computed fields, display names, response schemas."""

import uuid
from datetime import date, timedelta
from unittest.mock import patch

from app.models import Breed, FictionalSpecies, SpeciesCache, User, VtuberTrait
from app.response_schemas import SpeciesCacheResponse, TraitResponse

# ---------------------------------------------------------------------------
# User._computed_profile_data
# ---------------------------------------------------------------------------


class TestComputedProfileData:
    def test_active_status_unchanged(self, app, db_session):
        u = User(id=f"u-{uuid.uuid4().hex[:8]}", display_name="T", profile_data={"activity_status": "active"})
        db_session.add(u)
        db_session.commit()
        assert u._computed_profile_data()["activity_status"] == "active"

    def test_preparing_no_debut_stays_preparing(self, app, db_session):
        u = User(id=f"u-{uuid.uuid4().hex[:8]}", display_name="T", profile_data={"activity_status": "preparing"})
        db_session.add(u)
        db_session.commit()
        assert u._computed_profile_data()["activity_status"] == "preparing"

    def test_preparing_future_debut_stays_preparing(self, app, db_session):
        future = (date.today() + timedelta(days=30)).isoformat()
        u = User(
            id=f"u-{uuid.uuid4().hex[:8]}",
            display_name="T",
            profile_data={"activity_status": "preparing", "debut_date": future},
        )
        db_session.add(u)
        db_session.commit()
        assert u._computed_profile_data()["activity_status"] == "preparing"

    def test_preparing_past_debut_becomes_active(self, app, db_session):
        past = (date.today() - timedelta(days=1)).isoformat()
        u = User(
            id=f"u-{uuid.uuid4().hex[:8]}",
            display_name="T",
            profile_data={"activity_status": "preparing", "debut_date": past},
        )
        db_session.add(u)
        db_session.commit()
        assert u._computed_profile_data()["activity_status"] == "active"

    def test_preparing_today_debut_becomes_active(self, app, db_session):
        today = date.today().isoformat()
        u = User(
            id=f"u-{uuid.uuid4().hex[:8]}",
            display_name="T",
            profile_data={"activity_status": "preparing", "debut_date": today},
        )
        db_session.add(u)
        db_session.commit()
        assert u._computed_profile_data()["activity_status"] == "active"

    def test_invalid_debut_date_stays_preparing(self, app, db_session):
        u = User(
            id=f"u-{uuid.uuid4().hex[:8]}",
            display_name="T",
            profile_data={"activity_status": "preparing", "debut_date": "not-a-date"},
        )
        db_session.add(u)
        db_session.commit()
        assert u._computed_profile_data()["activity_status"] == "preparing"

    def test_none_profile_data(self, app, db_session):
        u = User(id=f"u-{uuid.uuid4().hex[:8]}", display_name="T", profile_data=None)
        db_session.add(u)
        db_session.commit()
        assert u._computed_profile_data() == {}


# ---------------------------------------------------------------------------
# SpeciesCache._effective_common_name_zh
# ---------------------------------------------------------------------------


class TestEffectiveCommonNameZh:
    def test_strips_genus_suffix_for_species(self, app, db_session):
        sp = SpeciesCache(taxon_id=1, scientific_name="Canis lupus", common_name_zh="犬屬", taxon_rank="SPECIES")
        db_session.add(sp)
        db_session.commit()
        assert sp._effective_common_name_zh() == "犬"

    def test_keeps_genus_suffix_for_genus_rank(self, app, db_session):
        sp = SpeciesCache(taxon_id=2, scientific_name="Canis", common_name_zh="犬屬", taxon_rank="GENUS")
        db_session.add(sp)
        db_session.commit()
        assert sp._effective_common_name_zh() == "犬屬"

    def test_no_zh_name_returns_none(self, app, db_session):
        sp = SpeciesCache(taxon_id=3, scientific_name="Canis", common_name_zh=None, taxon_rank="SPECIES")
        db_session.add(sp)
        db_session.commit()
        assert sp._effective_common_name_zh() is None

    def test_single_char_with_genus_suffix(self, app, db_session):
        """Single character + '屬' = '犬屬' (2 chars) should strip to '犬'."""
        sp = SpeciesCache(taxon_id=4, scientific_name="X", common_name_zh="犬屬", taxon_rank="SUBSPECIES")
        db_session.add(sp)
        db_session.commit()
        assert sp._effective_common_name_zh() == "犬"

    def test_name_not_ending_with_shu(self, app, db_session):
        sp = SpeciesCache(taxon_id=5, scientific_name="Felis catus", common_name_zh="家貓", taxon_rank="SPECIES")
        db_session.add(sp)
        db_session.commit()
        assert sp._effective_common_name_zh() == "家貓"


# ---------------------------------------------------------------------------
# SpeciesCache.to_dict
# ---------------------------------------------------------------------------


class TestSpeciesCacheToDict:
    @patch("app.services.taxonomy_zh.get_species_name_override", return_value=None)
    def test_basic_to_dict(self, mock_override, app, db_session):
        sp = SpeciesCache(
            taxon_id=100,
            scientific_name="Canis lupus",
            common_name_en="Wolf",
            common_name_zh="狼",
            taxon_rank="SPECIES",
            kingdom="Animalia",
            path_zh={"kingdom": "動物界"},
        )
        db_session.add(sp)
        db_session.commit()
        d = SpeciesCacheResponse.from_model(sp).model_dump(mode="json")
        assert d["taxon_id"] == 100
        assert d["scientific_name"] == "Canis lupus"
        assert d["kingdom_zh"] == "動物界"
        assert d.get("display_name_override") is None

    @patch("app.services.taxonomy_zh.get_species_name_override", return_value="覆寫名稱")
    def test_with_name_override(self, mock_override, app, db_session):
        sp = SpeciesCache(taxon_id=101, scientific_name="X", taxon_rank="SPECIES")
        db_session.add(sp)
        db_session.commit()
        d = SpeciesCacheResponse.from_model(sp).model_dump(mode="json")
        assert d["display_name_override"] == "覆寫名稱"


# ---------------------------------------------------------------------------
# VtuberTrait.computed_display_name
# ---------------------------------------------------------------------------


class TestComputedDisplayName:
    @patch("app.services.taxonomy_zh.get_species_name_override", return_value=None)
    def test_real_species_zh_name(self, mock_override, app, db_session):
        uid = f"u-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="T")
        sp = SpeciesCache(taxon_id=200, scientific_name="Canis lupus", common_name_zh="狼", taxon_rank="SPECIES")
        db_session.add_all([u, sp])
        db_session.flush()
        trait = VtuberTrait(user_id=uid, taxon_id=200)
        db_session.add(trait)
        db_session.commit()
        assert trait.computed_display_name() == "狼"

    @patch("app.services.taxonomy_zh.get_species_name_override", return_value=None)
    def test_real_species_fallback_scientific(self, mock_override, app, db_session):
        uid = f"u-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="T")
        sp = SpeciesCache(taxon_id=201, scientific_name="Vulpes vulpes", common_name_zh=None, taxon_rank="SPECIES")
        db_session.add_all([u, sp])
        db_session.flush()
        trait = VtuberTrait(user_id=uid, taxon_id=201)
        db_session.add(trait)
        db_session.commit()
        assert trait.computed_display_name() == "Vulpes vulpes"

    def test_fictional_zh_name(self, app, db_session):
        uid = f"u-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="T")
        fs = FictionalSpecies(name="Dragon", name_zh="龍", origin="Eastern")
        db_session.add_all([u, fs])
        db_session.flush()
        trait = VtuberTrait(user_id=uid, fictional_species_id=fs.id)
        db_session.add(trait)
        db_session.commit()
        assert trait.computed_display_name() == "龍"

    def test_fictional_fallback_en(self, app, db_session):
        uid = f"u-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="T")
        fs = FictionalSpecies(name="Phoenix", name_zh=None, origin="Western")
        db_session.add_all([u, fs])
        db_session.flush()
        trait = VtuberTrait(user_id=uid, fictional_species_id=fs.id)
        db_session.add(trait)
        db_session.commit()
        assert trait.computed_display_name() == "Phoenix"


# ---------------------------------------------------------------------------
# TraitResponse — breed display logic
# ---------------------------------------------------------------------------


class TestTraitBreedDisplay:
    @patch("app.services.taxonomy_zh.get_species_name_override", return_value=None)
    def test_breed_object_preferred(self, mock_override, app, db_session):
        uid = f"u-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="T")
        sp = SpeciesCache(taxon_id=300, scientific_name="Canis lupus familiaris", taxon_rank="SUBSPECIES")
        db_session.add_all([u, sp])
        db_session.flush()
        breed = Breed(taxon_id=300, name_en="Shiba Inu", name_zh="柴犬")
        db_session.add(breed)
        db_session.flush()
        trait = VtuberTrait(user_id=uid, taxon_id=300, breed_id=breed.id, breed_name="old-text")
        db_session.add(trait)
        db_session.commit()
        d = TraitResponse.from_model(trait).model_dump(mode="json")
        assert d["breed_name"] == "柴犬"
        assert d["breed"] is not None

    @patch("app.services.taxonomy_zh.get_species_name_override", return_value=None)
    def test_legacy_breed_name_fallback(self, mock_override, app, db_session):
        uid = f"u-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="T")
        sp = SpeciesCache(taxon_id=301, scientific_name="Felis catus", taxon_rank="SPECIES")
        db_session.add_all([u, sp])
        db_session.flush()
        trait = VtuberTrait(user_id=uid, taxon_id=301, breed_name="三花貓")
        db_session.add(trait)
        db_session.commit()
        d = TraitResponse.from_model(trait).model_dump(mode="json")
        assert d["breed_name"] == "三花貓"
        assert d["breed"] is None
