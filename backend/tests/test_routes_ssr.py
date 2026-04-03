"""Route integration tests for /vtuber/<user_id> — SSR meta tag injection."""

import uuid
from unittest.mock import patch

import requests
import responses as responses_mock

from app.models import FictionalSpecies, SpeciesCache, User, VtuberTrait

MOCK_SPA_HTML = """<!DOCTYPE html>
<html>
<head>
<title>VTaxon</title>
<meta name="description" content="default" />
<meta property="og:title" content="default" />
<meta property="og:description" content="default" />
<meta property="og:image" content="default" />
<meta property="og:url" content="default" />
<meta property="og:type" content="website" />
<meta property="og:image:alt" content="default" />
<meta name="twitter:title" content="default" />
<meta name="twitter:description" content="default" />
<meta name="twitter:image" content="default" />
<link rel="canonical" href="default" />
</head>
<body><div id="root"></div></body>
</html>"""


class TestSSR:
    @patch("app.routes.ssr._fetch_spa_html", return_value=MOCK_SPA_HTML)
    def test_injects_user_meta_tags(self, mock_fetch, client, db_session):
        uid = f"user-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="TestVtuber", role="user", avatar_url="https://example.com/avatar.png")
        db_session.add(u)
        db_session.flush()

        resp = client.get(f"/vtuber/{uid}")
        assert resp.status_code == 200
        html = resp.data.decode()
        assert "TestVtuber | VTaxon" in html
        assert "https://example.com/avatar.png" in html
        assert "application/ld+json" in html

    @patch("app.routes.ssr._fetch_spa_html", return_value=MOCK_SPA_HTML)
    def test_unknown_user_returns_spa(self, mock_fetch, client):
        resp = client.get("/vtuber/nonexistent-user")
        assert resp.status_code == 200
        # Should return the default SPA HTML (React Router handles 404)
        assert "VTaxon" in resp.data.decode()

    @patch("app.routes.ssr._fetch_spa_html", return_value=None)
    def test_spa_unavailable_returns_503(self, mock_fetch, client):
        resp = client.get("/vtuber/anyone")
        assert resp.status_code == 503

    @patch("app.routes.ssr._fetch_spa_html", return_value=MOCK_SPA_HTML)
    def test_json_ld_contains_user_name(self, mock_fetch, client, db_session):
        uid = f"user-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="JSONLDUser", role="user")
        db_session.add(u)
        db_session.flush()

        resp = client.get(f"/vtuber/{uid}")
        html = resp.data.decode()
        assert "JSONLDUser" in html
        assert "ProfilePage" in html

    @patch("app.routes.ssr._fetch_spa_html", return_value=MOCK_SPA_HTML)
    def test_user_with_bio_truncates_description(self, mock_fetch, client, db_session):
        """User with long bio should have it truncated in meta description."""
        uid = f"user-{uuid.uuid4().hex[:8]}"
        long_bio = "A" * 200
        u = User(id=uid, display_name="BioUser", role="user", bio=long_bio)
        db_session.add(u)
        db_session.flush()

        resp = client.get(f"/vtuber/{uid}")
        html = resp.data.decode()
        # Bio should be truncated to 120 chars + ellipsis
        assert "BioUser" in html
        assert "…" in html

    @patch("app.routes.ssr._fetch_spa_html", return_value=MOCK_SPA_HTML)
    def test_user_with_species_traits_in_description(self, mock_fetch, client, db_session):
        """User without bio but with traits should show species names."""
        uid = f"user-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="TraitUser", role="user")
        db_session.add(u)
        sp = SpeciesCache(
            taxon_id=3001,
            scientific_name="Vulpes vulpes",
            common_name_zh="紅狐",
            taxon_rank="SPECIES",
            taxon_path="1|3001",
        )
        db_session.add(sp)
        db_session.flush()
        trait = VtuberTrait(user_id=uid, taxon_id=3001)
        db_session.add(trait)
        db_session.flush()

        resp = client.get(f"/vtuber/{uid}")
        html = resp.data.decode()
        assert "紅狐" in html
        assert "物種" in html

    @patch("app.routes.ssr._fetch_spa_html", return_value=MOCK_SPA_HTML)
    def test_user_with_fictional_trait_in_description(self, mock_fetch, client, db_session):
        """User with fictional trait should show fictional species name."""
        uid = f"user-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="FictUser", role="user")
        db_session.add(u)
        fs = FictionalSpecies(name="Dragon", name_zh="龍", origin="Western", category_path="Western|Dragon")
        db_session.add(fs)
        db_session.flush()
        trait = VtuberTrait(user_id=uid, fictional_species_id=fs.id)
        db_session.add(trait)
        db_session.flush()

        resp = client.get(f"/vtuber/{uid}")
        html = resp.data.decode()
        assert "龍" in html


class TestFetchSpaHtml:
    """Test the actual _fetch_spa_html function (HTTP fetch + caching)."""

    @responses_mock.activate
    def test_fetches_and_caches_html(self, app):
        """First call should fetch from frontend URL."""
        import app.routes.ssr as ssr_mod

        # Reset cache
        ssr_mod._spa_html_cache = None
        ssr_mod._spa_html_cache_time = 0

        with app.app_context():
            with patch.dict("os.environ", {"ALLOWED_ORIGINS": "https://vtaxon-staging.web.app"}):
                responses_mock.add(
                    responses_mock.GET,
                    "https://vtaxon-staging.web.app/index.html",
                    body="<html>cached</html>",
                    status=200,
                )
                result = ssr_mod._fetch_spa_html()
                assert result == "<html>cached</html>"
                assert ssr_mod._spa_html_cache == "<html>cached</html>"

    @responses_mock.activate
    def test_returns_stale_cache_on_failure(self, app):
        """If fetch fails but we have stale cache, return it."""
        import app.routes.ssr as ssr_mod

        ssr_mod._spa_html_cache = "<html>stale</html>"
        ssr_mod._spa_html_cache_time = 0  # expired

        with app.app_context():
            with patch.dict("os.environ", {"ALLOWED_ORIGINS": "https://vtaxon-staging.web.app"}):
                responses_mock.add(
                    responses_mock.GET,
                    "https://vtaxon-staging.web.app/index.html",
                    body=requests.ConnectionError("fail"),
                )
                result = ssr_mod._fetch_spa_html()
                assert result == "<html>stale</html>"

    @responses_mock.activate
    def test_returns_none_on_failure_no_cache(self, app):
        """If fetch fails and no cache, return None."""
        import app.routes.ssr as ssr_mod

        ssr_mod._spa_html_cache = None
        ssr_mod._spa_html_cache_time = 0

        with app.app_context():
            with patch.dict("os.environ", {"ALLOWED_ORIGINS": "https://vtaxon-staging.web.app"}):
                responses_mock.add(
                    responses_mock.GET,
                    "https://vtaxon-staging.web.app/index.html",
                    body=requests.ConnectionError("fail"),
                )
                result = ssr_mod._fetch_spa_html()
                assert result is None

    def test_get_frontend_url_from_env(self, app):
        """Should extract first origin from ALLOWED_ORIGINS."""
        from app.routes.ssr import _get_frontend_url

        with patch.dict("os.environ", {"ALLOWED_ORIGINS": "https://a.com,https://b.com"}):
            assert _get_frontend_url() == "https://a.com"

    def test_get_frontend_url_default(self, app):
        """Should fall back to localhost when env is empty."""
        from app.routes.ssr import _get_frontend_url

        with patch.dict("os.environ", {"ALLOWED_ORIGINS": ""}):
            assert _get_frontend_url() == "http://localhost:5173"
