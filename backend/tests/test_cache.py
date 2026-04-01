"""Unit tests for TTLCache — expiration, invalidation, public wrappers."""

import time

from app.cache import (
    TTLCache,
    get_fictional_tree_cache,
    get_stats_cache,
    get_tree_cache,
    invalidate_fictional_tree_cache,
    invalidate_stats_cache,
    invalidate_tree_cache,
    set_fictional_tree_cache,
    set_stats_cache,
    set_tree_cache,
)


class TestTTLCache:
    def test_set_and_get(self):
        cache = TTLCache(ttl=60)
        cache.set({"key": "value"})
        assert cache.get() == {"key": "value"}

    def test_get_empty_returns_none(self):
        cache = TTLCache(ttl=60)
        assert cache.get() is None

    def test_expired_returns_none(self):
        cache = TTLCache(ttl=1)
        cache.set("data")
        # Simulate time passing beyond TTL
        cache._ts = time.time() - 2
        assert cache.get() is None

    def test_not_yet_expired(self):
        cache = TTLCache(ttl=300)
        cache.set("data")
        assert cache.get() == "data"

    def test_invalidate(self):
        cache = TTLCache(ttl=300)
        cache.set("data")
        assert cache.get() == "data"
        cache.invalidate()
        assert cache.get() is None

    def test_overwrite(self):
        cache = TTLCache(ttl=300)
        cache.set("first")
        cache.set("second")
        assert cache.get() == "second"

    def test_set_resets_timer(self):
        cache = TTLCache(ttl=5)
        cache.set("old")
        cache._ts = time.time() - 4  # almost expired
        cache.set("new")  # resets timer
        assert cache.get() == "new"


# ---------------------------------------------------------------------------
# Public wrapper functions
# ---------------------------------------------------------------------------


class TestTreeCacheWrappers:
    def test_tree_cache_roundtrip(self):
        invalidate_tree_cache()
        assert get_tree_cache() is None
        set_tree_cache({"tree": True})
        assert get_tree_cache() == {"tree": True}
        invalidate_tree_cache()
        assert get_tree_cache() is None

    def test_fictional_tree_cache_roundtrip(self):
        invalidate_fictional_tree_cache()
        assert get_fictional_tree_cache() is None
        set_fictional_tree_cache({"fictional": True})
        assert get_fictional_tree_cache() == {"fictional": True}
        invalidate_fictional_tree_cache()
        assert get_fictional_tree_cache() is None

    def test_stats_cache_roundtrip(self):
        invalidate_stats_cache()
        assert get_stats_cache() is None
        set_stats_cache({"count": 42})
        assert get_stats_cache() == {"count": 42}
        invalidate_stats_cache()
        assert get_stats_cache() is None
