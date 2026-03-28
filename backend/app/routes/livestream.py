"""Live stream status query endpoint."""

import time
from datetime import UTC, datetime, timedelta

from flask import Blueprint, jsonify

from ..extensions import db
from ..limiter import limiter
from ..models import LiveStream, User

livestream_bp = Blueprint("livestream", __name__)

# ── In-process cache for /api/live-status (TTL 15s) ──
_live_cache = {"data": None, "ts": 0, "ttl": 15}


@livestream_bp.route("/live-status", methods=["GET"])
@limiter.limit("60/minute")
def live_status():
    """Public endpoint: return all currently live users."""
    now = time.time()
    if _live_cache["data"] is not None and (now - _live_cache["ts"]) < _live_cache["ttl"]:
        return jsonify(_live_cache["data"])

    # Clean up ghost records (started > 24h ago)
    cutoff = datetime.now(UTC) - timedelta(hours=24)
    LiveStream.query.filter(LiveStream.started_at < cutoff).delete()
    db.session.commit()

    streams = LiveStream.query.all()

    # Include live primary trait IDs for dedup in frontend tree
    live_user_ids = list({s.user_id for s in streams})
    primaries = {}
    if live_user_ids:
        users = User.query.filter(User.id.in_(live_user_ids)).all()
        for u in users:
            p = {}
            if u.live_primary_real_trait_id:
                p["real"] = str(u.live_primary_real_trait_id)
            if u.live_primary_fictional_trait_id:
                p["fictional"] = str(u.live_primary_fictional_trait_id)
            if p:
                primaries[str(u.id)] = p

    result = {
        "live": [s.to_dict() for s in streams],
        "primaries": primaries,
    }

    _live_cache["data"] = result
    _live_cache["ts"] = time.time()

    return jsonify(result)


def invalidate_live_cache():
    """Invalidate the live status cache after DB changes."""
    _live_cache["data"] = None
    _live_cache["ts"] = 0
