"""Route integration tests for /api/users/recent and /api/users/directory."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import patch
from urllib.parse import quote

from app.models import OAuthAccount, SpeciesCache, User, VtuberTrait

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Empty facets stub — _compute_facets uses PostgreSQL JSONB operators
# that aren't available in SQLite test DB.
_EMPTY_FACETS = {
    "country": {},
    "country_none": 0,
    "gender": {},
    "status": {},
    "org_type": {},
    "platform": {},
    "has_traits": {"true": 0, "false": 0},
}


def _user(db_session, name="DirUser", **kw):
    uid = f"user-{uuid.uuid4().hex[:8]}"
    u = User(
        id=uid,
        display_name=name,
        role="user",
        visibility="visible",
        org_type=kw.get("org_type", "indie"),
        country_flags=kw.get("country_flags"),
        profile_data=kw.get("profile_data", {}),
    )
    db_session.add(u)
    db_session.flush()
    return u


def _species(db_session, taxon_id, name="Test sp.", zh=None):
    sp = SpeciesCache(
        taxon_id=taxon_id,
        scientific_name=name,
        common_name_zh=zh,
        taxon_rank="SPECIES",
        taxon_path=str(taxon_id),
    )
    db_session.add(sp)
    db_session.flush()
    return sp


def _trait(db_session, user, species, created_at=None):
    t = VtuberTrait(user_id=user.id, taxon_id=species.taxon_id)
    if created_at:
        t.created_at = created_at
    db_session.add(t)
    db_session.flush()
    return t


def _since_url(dt):
    """Encode a datetime as a URL-safe since parameter."""
    return quote(dt.isoformat(), safe="")


# ---------------------------------------------------------------------------
# GET /api/users/recent
# ---------------------------------------------------------------------------


class TestRecentUsers:
    def test_returns_recent_users(self, client, db_session):
        user = _user(db_session, name="NewVtuber")
        sp = _species(db_session, 100, name="Canis lupus", zh="狼")
        now = datetime.now(UTC)
        _trait(db_session, user, sp, created_at=now)

        since = _since_url(now - timedelta(minutes=5))
        resp = client.get(f"/api/users/recent?since={since}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == 1
        assert data[0]["display_name"] == "NewVtuber"
        assert data[0]["species_summary"] is not None

    def test_empty_since_returns_empty(self, client):
        resp = client.get("/api/users/recent")
        assert resp.status_code == 200
        assert resp.get_json() == []

    def test_invalid_since_returns_400(self, client):
        resp = client.get("/api/users/recent?since=not-a-date")
        assert resp.status_code == 400

    def test_limit_capped(self, client, db_session):
        sp = _species(db_session, 200, name="Felis catus")
        now = datetime.now(UTC)
        for i in range(5):
            u = _user(db_session, name=f"User{i}")
            _trait(db_session, u, sp, created_at=now - timedelta(seconds=i))

        since = _since_url(now - timedelta(hours=1))
        resp = client.get(f"/api/users/recent?since={since}&limit=2")
        assert resp.status_code == 200
        assert len(resp.get_json()) == 2

    def test_hidden_user_excluded(self, client, db_session):
        user = _user(db_session, name="Hidden")
        user.visibility = "hidden"
        sp = _species(db_session, 300)
        _trait(db_session, user, sp, created_at=datetime.now(UTC))

        since = _since_url(datetime.now(UTC) - timedelta(hours=1))
        resp = client.get(f"/api/users/recent?since={since}")
        assert resp.status_code == 200
        assert resp.get_json() == []


# ---------------------------------------------------------------------------
# GET /api/users/directory
# ---------------------------------------------------------------------------


class TestDirectory:
    @patch("app.routes.directory._compute_facets", return_value=_EMPTY_FACETS)
    def test_default_pagination(self, mock_facets, client, db_session):
        _user(db_session, name="Alpha")
        resp = client.get("/api/users/directory")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "items" in data
        assert "total" in data
        assert data["page"] == 1
        assert data["per_page"] == 24
        assert "facets" in data

    @patch("app.routes.directory._compute_facets", return_value=_EMPTY_FACETS)
    def test_search_by_name(self, mock_facets, client, db_session):
        _user(db_session, name="UniqueVtuberName")
        _user(db_session, name="OtherUser")

        resp = client.get("/api/users/directory?q=UniqueVtuber")
        data = resp.get_json()
        assert data["total"] == 1
        assert data["items"][0]["display_name"] == "UniqueVtuberName"

    @patch("app.routes.directory._compute_facets", return_value=_EMPTY_FACETS)
    def test_has_traits_filter(self, mock_facets, client, db_session):
        u_with = _user(db_session, name="WithTrait")
        _user(db_session, name="WithoutTrait")
        sp = _species(db_session, 400)
        _trait(db_session, u_with, sp)

        resp = client.get("/api/users/directory?has_traits=true")
        data = resp.get_json()
        names = [i["display_name"] for i in data["items"]]
        assert "WithTrait" in names
        assert "WithoutTrait" not in names

    @patch("app.routes.directory._compute_facets", return_value=_EMPTY_FACETS)
    def test_sort_by_name_asc(self, mock_facets, client, db_session):
        _user(db_session, name="Zebra")
        _user(db_session, name="Apple")

        resp = client.get("/api/users/directory?sort=name&order=asc")
        items = resp.get_json()["items"]
        assert items[0]["display_name"] == "Apple"
        assert items[1]["display_name"] == "Zebra"

    @patch("app.routes.directory._compute_facets", return_value=_EMPTY_FACETS)
    def test_per_page_capped(self, mock_facets, client, db_session):
        _user(db_session)
        resp = client.get("/api/users/directory?per_page=999")
        assert resp.get_json()["per_page"] == 100

    @patch("app.routes.directory._compute_facets", return_value=_EMPTY_FACETS)
    def test_items_include_platforms(self, mock_facets, client, db_session):
        user = _user(db_session, name="PlatformUser")
        acct = OAuthAccount(
            user_id=user.id,
            provider="twitch",
            provider_account_id="tw-123",
        )
        db_session.add(acct)
        db_session.flush()

        resp = client.get("/api/users/directory")
        item = next(i for i in resp.get_json()["items"] if i["display_name"] == "PlatformUser")
        assert "twitch" in item["platforms"]

    @patch("app.routes.directory._compute_facets", return_value=_EMPTY_FACETS)
    def test_items_include_species_names(self, mock_facets, client, db_session):
        user = _user(db_session, name="SpeciesUser")
        sp = _species(db_session, 500, name="Felis catus", zh="貓")
        _trait(db_session, user, sp)

        resp = client.get("/api/users/directory")
        item = next(i for i in resp.get_json()["items"] if i["display_name"] == "SpeciesUser")
        assert item["has_traits"] is True
        assert len(item["species_names"]) >= 1

    @patch("app.routes.directory._compute_facets", return_value=_EMPTY_FACETS)
    def test_hidden_user_excluded(self, mock_facets, client, db_session):
        user = _user(db_session, name="Invisible")
        user.visibility = "hidden"
        db_session.flush()

        resp = client.get("/api/users/directory?q=Invisible")
        assert resp.get_json()["total"] == 0
