"""Tests for OpenAPI/Swagger integration (Flasgger)."""

from app import create_app

# Expected tags defined in swagger.py
EXPECTED_TAGS = {
    "Health",
    "Auth",
    "Users",
    "Directory",
    "OAuth",
    "Species",
    "Taxonomy",
    "Traits",
    "Breeds",
    "Fictional",
    "Reports",
    "Notifications",
    "Admin",
    "Livestream",
    "Subscriptions",
    "Webhooks",
    "SEO",
    "SSR",
}

# Key paths that must appear in the spec (spot-check, not exhaustive)
REQUIRED_PATHS = [
    "/api/health",
    "/api/auth/callback",
    "/api/users/me",
    "/api/users/directory",
    "/api/species/search",
    "/api/taxonomy/tree",
    "/api/traits",
    "/api/breeds",
    "/api/fictional-species",
    "/api/reports",
    "/api/notifications",
    "/api/admin/request-counts",
    "/api/live-status",
    "/api/webhooks/twitch",
    "/api/sitemap.xml",
    "/vtuber/{user_id}",
]


def _make_swagger_app():
    """Create a test app with Swagger enabled."""
    app = create_app("testing")
    app.config["ENABLE_SWAGGER"] = True
    # Re-init Flasgger since it was skipped during create_app (testing default)
    from flasgger import Swagger

    from app.swagger import SWAGGER_CONFIG, SWAGGER_TEMPLATE

    Swagger(app, template=SWAGGER_TEMPLATE, config=SWAGGER_CONFIG)

    from app.limiter import limiter

    limiter.enabled = False
    return app


class TestApiSpec:
    def setup_method(self):
        self.app = _make_swagger_app()
        self.client = self.app.test_client()

    def test_apispec_returns_200(self):
        resp = self.client.get("/apispec.json")
        assert resp.status_code == 200
        assert resp.content_type.startswith("application/json")

    def test_apispec_has_info(self):
        data = self.client.get("/apispec.json").get_json()
        info = data["info"]
        assert info["title"] == "VTaxon API"
        assert "version" in info

    def test_apispec_has_security_definitions(self):
        data = self.client.get("/apispec.json").get_json()
        sec = data.get("securityDefinitions", {})
        assert "BearerAuth" in sec
        assert sec["BearerAuth"]["type"] == "apiKey"
        assert sec["BearerAuth"]["in"] == "header"

    def test_apispec_has_all_tags(self):
        data = self.client.get("/apispec.json").get_json()
        tag_names = {t["name"] for t in data.get("tags", [])}
        missing = EXPECTED_TAGS - tag_names
        assert not missing, f"Missing tags: {missing}"

    def test_apispec_has_required_paths(self):
        data = self.client.get("/apispec.json").get_json()
        paths = set(data.get("paths", {}).keys())
        for p in REQUIRED_PATHS:
            assert p in paths, f"Missing path: {p}"

    def test_apispec_paths_have_responses(self):
        """Every documented endpoint should have at least one response."""
        data = self.client.get("/apispec.json").get_json()
        for path, methods in data.get("paths", {}).items():
            for method, spec in methods.items():
                if method in ("get", "post", "patch", "put", "delete"):
                    assert "responses" in spec, f"{method.upper()} {path} missing responses"


class TestSwaggerUI:
    def setup_method(self):
        self.app = _make_swagger_app()
        self.client = self.app.test_client()

    def test_apidocs_returns_html(self):
        resp = self.client.get("/apidocs/")
        assert resp.status_code == 200
        assert "text/html" in resp.content_type

    def test_apidocs_contains_swagger_ui(self):
        resp = self.client.get("/apidocs/")
        body = resp.get_data(as_text=True).lower()
        assert "swagger" in body


class TestSwaggerDisabled:
    def test_no_apidocs_when_disabled(self):
        """When ENABLE_SWAGGER is False, /apidocs/ should 404."""
        app = create_app("testing")
        # testing default: ENABLE_SWAGGER not set, config_name != development → False
        from app.limiter import limiter

        limiter.enabled = False
        with app.test_client() as c:
            resp = c.get("/apidocs/")
            assert resp.status_code == 404

    def test_no_apispec_when_disabled(self):
        app = create_app("testing")
        from app.limiter import limiter

        limiter.enabled = False
        with app.test_client() as c:
            resp = c.get("/apispec.json")
            assert resp.status_code == 404
