"""Unit tests for Pydantic schemas and validate_with decorator."""

import pytest
from flask import Flask
from pydantic import BaseModel

from app.schemas import (
    CreateTraitSchema,
    MarkReadSchema,
    UpdateProfileSchema,
    _strip_str,
    validate_with,
)

# ---------------------------------------------------------------------------
# _strip_str helper
# ---------------------------------------------------------------------------


class TestStripStr:
    def test_strips_whitespace(self) -> None:
        assert _strip_str("  hello  ") == "hello"

    def test_preserves_inner_whitespace(self) -> None:
        assert _strip_str("  hello world  ") == "hello world"

    def test_non_string_passthrough(self) -> None:
        assert _strip_str(None) is None
        assert _strip_str(123) == 123


# ---------------------------------------------------------------------------
# validate_with decorator
# ---------------------------------------------------------------------------


class _TestSchema(BaseModel):
    name: str
    age: int | None = None


class TestValidateWith:
    def _make_app(self) -> Flask:
        app = Flask(__name__)

        @app.route("/test", methods=["POST"])
        @validate_with(_TestSchema)
        def test_endpoint(data: dict) -> dict:  # type: ignore[type-arg]
            return {"received": data}

        return app

    def test_valid_data_passes_through(self) -> None:
        app = self._make_app()
        with app.test_client() as c:
            resp = c.post("/test", json={"name": "Alice", "age": 30})
        assert resp.status_code == 200
        assert resp.get_json()["received"]["name"] == "Alice"

    def test_missing_required_field_returns_400(self) -> None:
        app = self._make_app()
        with app.test_client() as c:
            resp = c.post("/test", json={"age": 30})
        assert resp.status_code == 400
        data = resp.get_json()
        assert "error" in data
        assert "name" in data["details"]

    def test_empty_body_returns_400(self) -> None:
        app = self._make_app()
        with app.test_client() as c:
            resp = c.post("/test", data="", content_type="application/json")
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# UpdateProfileSchema PATCH semantics
# ---------------------------------------------------------------------------


class TestUpdateProfileSchema:
    def _load(self, raw: dict) -> dict:  # type: ignore[type-arg]
        model = UpdateProfileSchema.model_validate(raw)
        return model.to_patch_dict()

    def test_country_flags_uppercased(self) -> None:
        data = self._load({"country_flags": ["tw", "jp"]})
        assert data["country_flags"] == ["TW", "JP"]

    def test_indie_clears_organization(self) -> None:
        data = self._load({"org_type": "indie", "organization": "Hololive"})
        assert data["organization"] is None

    def test_corporate_keeps_organization(self) -> None:
        data = self._load({"org_type": "corporate", "organization": "Hololive"})
        assert data["organization"] == "Hololive"

    def test_social_links_stripped(self) -> None:
        data = self._load({"social_links": {"twitter": "  https://x.com/test  "}})
        assert data["social_links"]["twitter"] == "https://x.com/test"

    def test_social_links_empty_values_removed(self) -> None:
        data = self._load({"social_links": {"twitter": "", "discord": "abc"}})
        assert "twitter" not in data["social_links"]
        assert data["social_links"]["discord"] == "abc"

    def test_bio_stripped(self) -> None:
        data = self._load({"bio": "  Hello world  "})
        assert data["bio"] == "Hello world"

    def test_bio_whitespace_only_becomes_none(self) -> None:
        data = self._load({"bio": "   "})
        assert data["bio"] is None

    def test_only_sent_keys_preserved(self) -> None:
        """PATCH semantics: keys not in raw request are excluded."""
        data = self._load({"display_name": "New Name"})
        assert "display_name" in data
        assert "bio" not in data
        assert "country_flags" not in data

    def test_invalid_social_key_rejected(self) -> None:
        with pytest.raises(Exception):
            self._load({"social_links": {"tiktok": "https://tiktok.com/@test"}})

    def test_bio_over_500_chars_rejected(self) -> None:
        with pytest.raises(Exception):
            self._load({"bio": "x" * 501})


# ---------------------------------------------------------------------------
# CreateTraitSchema — cross-field validation
# ---------------------------------------------------------------------------


class TestCreateTraitSchema:
    def test_requires_taxon_or_fictional(self) -> None:
        with pytest.raises(Exception):
            CreateTraitSchema.model_validate({})

    def test_taxon_id_only_valid(self) -> None:
        model = CreateTraitSchema.model_validate({"taxon_id": 123})
        assert model.taxon_id == 123

    def test_fictional_species_id_only_valid(self) -> None:
        model = CreateTraitSchema.model_validate({"fictional_species_id": 5})
        assert model.fictional_species_id == 5


# ---------------------------------------------------------------------------
# MarkReadSchema
# ---------------------------------------------------------------------------


class TestMarkReadSchema:
    def test_requires_all_or_ids(self) -> None:
        with pytest.raises(Exception):
            MarkReadSchema.model_validate({})

    def test_all_true_valid(self) -> None:
        model = MarkReadSchema.model_validate({"all": True})
        assert model.all is True

    def test_ids_valid(self) -> None:
        model = MarkReadSchema.model_validate({"ids": [1, 2, 3]})
        assert model.ids == [1, 2, 3]
