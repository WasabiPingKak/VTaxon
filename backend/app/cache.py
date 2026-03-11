"""In-process cache for taxonomy tree data.

Avoids re-querying the DB on every /api/taxonomy/tree request.
TTL-based with manual invalidation when traits/breeds change.
"""

import time

_tree_cache = {"data": None, "ts": 0, "ttl": 300}


def get_tree_cache():
    if _tree_cache["data"] and (time.time() - _tree_cache["ts"]) < _tree_cache["ttl"]:
        return _tree_cache["data"]
    return None


def set_tree_cache(data):
    _tree_cache["data"] = data
    _tree_cache["ts"] = time.time()


def invalidate_tree_cache():
    _tree_cache["data"] = None
    _tree_cache["ts"] = 0


# ── Fictional tree cache ──
_fictional_tree_cache = {"data": None, "ts": 0, "ttl": 300}


def get_fictional_tree_cache():
    if _fictional_tree_cache["data"] and (time.time() - _fictional_tree_cache["ts"]) < _fictional_tree_cache["ttl"]:
        return _fictional_tree_cache["data"]
    return None


def set_fictional_tree_cache(data):
    _fictional_tree_cache["data"] = data
    _fictional_tree_cache["ts"] = time.time()


def invalidate_fictional_tree_cache():
    _fictional_tree_cache["data"] = None
    _fictional_tree_cache["ts"] = 0


# ── Stats cache ──
_stats_cache = {"data": None, "ts": 0, "ttl": 300}


def get_stats_cache():
    if _stats_cache["data"] and (time.time() - _stats_cache["ts"]) < _stats_cache["ttl"]:
        return _stats_cache["data"]
    return None


def set_stats_cache(data):
    _stats_cache["data"] = data
    _stats_cache["ts"] = time.time()


def invalidate_stats_cache():
    _stats_cache["data"] = None
    _stats_cache["ts"] = 0
