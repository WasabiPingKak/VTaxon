"""In-process TTL cache for expensive query results.

Avoids re-querying the DB on every request for taxonomy trees and stats.
TTL-based with manual invalidation when underlying data changes.

Limitation: This is a per-process cache. In multi-worker deployments
(e.g. gunicorn with 2+ workers), each worker maintains its own copy.
Acceptable at current scale (~2,500 users) since taxonomy data changes
infrequently and a 300s TTL bounds staleness. For higher scale,
consider migrating to Redis as a shared cache backend.
"""

import time


class TTLCache:
    """Simple in-memory cache with TTL expiration and manual invalidation."""

    __slots__ = ('_data', '_ts', '_ttl')

    def __init__(self, ttl: int = 300):
        self._data = None
        self._ts: float = 0
        self._ttl = ttl

    def get(self):
        if self._data is not None and (time.time() - self._ts) < self._ttl:
            return self._data
        return None

    def set(self, data):
        self._data = data
        self._ts = time.time()

    def invalidate(self):
        self._data = None
        self._ts = 0


# ── Cache instances ──
_tree_cache = TTLCache()
_fictional_tree_cache = TTLCache()
_stats_cache = TTLCache()


# ── Public API (backward-compatible) ──
def get_tree_cache():
    return _tree_cache.get()


def set_tree_cache(data):
    _tree_cache.set(data)


def invalidate_tree_cache():
    _tree_cache.invalidate()


def get_fictional_tree_cache():
    return _fictional_tree_cache.get()


def set_fictional_tree_cache(data):
    _fictional_tree_cache.set(data)


def invalidate_fictional_tree_cache():
    _fictional_tree_cache.invalidate()


def get_stats_cache():
    return _stats_cache.get()


def set_stats_cache(data):
    _stats_cache.set(data)


def invalidate_stats_cache():
    _stats_cache.invalidate()
