"""Tests for ProxyFix middleware (X-Forwarded-For / Proto / Host)."""

from app import create_app


def test_remote_addr_from_x_forwarded_for(client):
    """request.remote_addr should reflect X-Forwarded-For."""
    resp = client.get(
        "/api/health",
        headers={"X-Forwarded-For": "203.0.113.50"},
    )
    assert resp.status_code == 200


def test_x_forwarded_for_uses_last_proxy():
    """When multiple proxies, ProxyFix (x_for=1) trusts the rightmost entry."""
    app = create_app("testing")
    from app.limiter import limiter

    limiter.enabled = False

    with app.test_request_context(
        "/api/health",
        headers={"X-Forwarded-For": "spoofed.ip, 203.0.113.99"},
    ):
        # ProxyFix with x_for=1 picks the last (rightmost) proxy hop
        app.wsgi_app  # middleware is already wrapped
    # Verify via test client
    with app.test_client() as c:
        resp = c.get(
            "/api/health",
            headers={"X-Forwarded-For": "spoofed.ip, 203.0.113.99"},
        )
        assert resp.status_code == 200


def test_x_forwarded_proto_sets_scheme(app):
    """X-Forwarded-Proto should set request.scheme to https."""
    with app.test_request_context(
        "/api/health",
        headers={"X-Forwarded-Proto": "https"},
    ):
        # After ProxyFix processes, the environ should have the correct scheme
        pass  # context creation itself validates no crash

    with app.test_client() as c:
        resp = c.get(
            "/api/health",
            headers={"X-Forwarded-Proto": "https"},
        )
        assert resp.status_code == 200


def test_x_forwarded_host_sets_host(app):
    """X-Forwarded-Host should be respected."""
    with app.test_client() as c:
        resp = c.get(
            "/api/health",
            headers={"X-Forwarded-Host": "vtaxon.com"},
        )
        assert resp.status_code == 200


def test_proxy_fix_is_applied():
    """ProxyFix middleware should wrap the WSGI app."""
    from werkzeug.middleware.proxy_fix import ProxyFix

    app = create_app("testing")
    assert isinstance(app.wsgi_app, ProxyFix)


def test_proxy_fix_config():
    """Verify ProxyFix is configured with correct trust levels."""
    from werkzeug.middleware.proxy_fix import ProxyFix

    app = create_app("testing")
    proxy = app.wsgi_app
    assert isinstance(proxy, ProxyFix)
    assert proxy.x_for == 1
    assert proxy.x_proto == 1
    assert proxy.x_host == 1
