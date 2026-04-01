"""Unit tests for marshmallow schemas and validate_with decorator."""

import pytest
from flask import Flask
from marshmallow import Schema, fields

from app.schemas import (
    CreateTraitSchema,
    MarkReadSchema,
    TrimString,
    UpdateProfileSchema,
    validate_with,
)

# ---------------------------------------------------------------------------
# TrimString field
# ---------------------------------------------------------------------------


class TestTrimString:
    def test_strips_whitespace(self):
        field = TrimString()
        assert field._deserialize("  hello  ", None, {}) == "hello"

    def test_preserves_inner_whitespace(self):
        field = TrimString()
        assert field._deserialize("  hello world  ", None, {}) == "hello world"

    def test_empty_string_passthrough(self):
        field = TrimString()
        # Empty string is falsy, so strip is not called
        assert field._deserialize("", None, {}) == ""


# ---------------------------------------------------------------------------
# validate_with decorator
# ---------------------------------------------------------------------------


class _TestSchema(Schema):
    name = fields.String(required=True)
    age = fields.Integer()


class TestValidateWith:
    def _make_app(self):
        app = Flask(__name__)

        @app.route("/test", methods=["POST"])
        @validate_with(_TestSchema)
        def test_endpoint(data):
            return {"received": data}

        return app

    def test_valid_data_passes_through(self):
        app = self._make_app()
        with app.test_client() as c:
            resp = c.post("/test", json={"name": "Alice", "age": 30})
        assert resp.status_code == 200
        assert resp.get_json()["received"]["name"] == "Alice"

    def test_missing_required_field_returns_400(self):
        app = self._make_app()
        with app.test_client() as c:
            resp = c.post("/test", json={"age": 30})
        assert resp.status_code == 400
        data = resp.get_json()
        assert "error" in data
        assert "name" in data["details"]

    def test_empty_body_returns_400(self):
        app = self._make_app()
        with app.test_client() as c:
            resp = c.post("/test", data="", content_type="application/json")
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# UpdateProfileSchema.normalize
# ---------------------------------------------------------------------------


class TestUpdateProfileSchemaNormalize:
    def _load(self, raw: dict):
        schema = UpdateProfileSchema()
        schema.context = {"raw": raw}
        return schema.load(raw)

    def test_country_flags_uppercased(self):
        data = self._load({"country_flags": ["tw", "jp"]})
        assert data["country_flags"] == ["TW", "JP"]

    def test_indie_clears_organization(self):
        data = self._load({"org_type": "indie", "organization": "Hololive"})
        assert data["organization"] is None

    def test_corporate_keeps_organization(self):
        data = self._load({"org_type": "corporate", "organization": "Hololive"})
        assert data["organization"] == "Hololive"

    def test_social_links_stripped(self):
        data = self._load({"social_links": {"twitter": "  https://x.com/test  "}})
        assert data["social_links"]["twitter"] == "https://x.com/test"

    def test_social_links_empty_values_removed(self):
        data = self._load({"social_links": {"twitter": "", "discord": "abc"}})
        assert "twitter" not in data["social_links"]
        assert data["social_links"]["discord"] == "abc"

    def test_bio_stripped(self):
        data = self._load({"bio": "  Hello world  "})
        assert data["bio"] == "Hello world"

    def test_bio_whitespace_only_becomes_none(self):
        data = self._load({"bio": "   "})
        assert data["bio"] is None

    def test_only_sent_keys_preserved(self):
        """PATCH semantics: keys not in raw request are excluded."""
        data = self._load({"display_name": "New Name"})
        assert "display_name" in data
        assert "bio" not in data
        assert "country_flags" not in data

    def test_invalid_social_key_rejected(self):
        with pytest.raises(Exception):
            self._load({"social_links": {"tiktok": "https://tiktok.com/@test"}})

    def test_bio_over_500_chars_rejected(self):
        with pytest.raises(Exception):
            self._load({"bio": "x" * 501})


# ---------------------------------------------------------------------------
# CreateTraitSchema — cross-field validation
# ---------------------------------------------------------------------------


class TestCreateTraitSchema:
    def test_requires_taxon_or_fictional(self):
        schema = CreateTraitSchema()
        with pytest.raises(Exception):
            schema.load({})

    def test_taxon_id_only_valid(self):
        data = CreateTraitSchema().load({"taxon_id": 123})
        assert data["taxon_id"] == 123

    def test_fictional_species_id_only_valid(self):
        data = CreateTraitSchema().load({"fictional_species_id": 5})
        assert data["fictional_species_id"] == 5


# ---------------------------------------------------------------------------
# MarkReadSchema
# ---------------------------------------------------------------------------


class TestMarkReadSchema:
    def test_requires_all_or_ids(self):
        with pytest.raises(Exception):
            MarkReadSchema().load({})

    def test_all_true_valid(self):
        data = MarkReadSchema().load({"all": True})
        assert data["all"] is True

    def test_ids_valid(self):
        data = MarkReadSchema().load({"ids": [1, 2, 3]})
        assert data["ids"] == [1, 2, 3]
