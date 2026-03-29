"""Route integration tests for /vtuber/<user_id> — SSR meta tag injection."""

import uuid
from unittest.mock import patch

from app.models import User

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
