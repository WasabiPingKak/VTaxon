"""Route integration tests for /api/sitemap.xml."""

import uuid

from app.models import User


class TestSitemap:
    def test_returns_xml(self, client):
        resp = client.get("/api/sitemap.xml")
        assert resp.status_code == 200
        assert "application/xml" in resp.content_type

    def test_contains_static_pages(self, client):
        resp = client.get("/api/sitemap.xml")
        xml = resp.data.decode()
        assert "https://vtaxon.com/" in xml
        assert "https://vtaxon.com/directory" in xml
        assert "https://vtaxon.com/search" in xml

    def test_contains_user_profiles(self, client, db_session):
        uid = f"user-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="SitemapUser", role="user")
        db_session.add(u)
        db_session.flush()

        resp = client.get("/api/sitemap.xml")
        xml = resp.data.decode()
        assert f"/vtuber/{uid}" in xml

    def test_valid_xml_structure(self, client):
        resp = client.get("/api/sitemap.xml")
        xml = resp.data.decode()
        assert '<?xml version="1.0" encoding="UTF-8"?>' in xml
        assert "<urlset" in xml
        assert "</urlset>" in xml
