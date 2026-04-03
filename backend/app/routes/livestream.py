"""Live stream status query endpoint."""

import time
from datetime import UTC, datetime, timedelta
from typing import Any

from flask import Blueprint, Response, jsonify

from ..extensions import db
from ..limiter import limiter
from ..models import LiveStream, User
from ..response_schemas import LiveStreamResponse

livestream_bp = Blueprint("livestream", __name__)

# ── In-process cache for /api/live-status (TTL 15s) ──
_live_cache: dict[str, Any] = {"data": None, "ts": 0, "ttl": 15}


@livestream_bp.route("/live-status", methods=["GET"])
@limiter.limit("60/minute")
def live_status() -> tuple[Response, int]:
    """取得目前所有直播中的使用者。
    ---
    tags:
      - Livestream
    responses:
      200:
        description: 直播狀態（快取 15 秒）
        schema:
          type: object
          properties:
            live:
              type: array
              items:
                type: object
            primaries:
              type: object
    """
    now = time.time()
    if _live_cache["data"] is not None and (now - _live_cache["ts"]) < _live_cache["ttl"]:
        return jsonify(_live_cache["data"]), 200

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
        "live": [LiveStreamResponse.model_validate(s).model_dump(mode="json") for s in streams],
        "primaries": primaries,
    }

    _live_cache["data"] = result
    _live_cache["ts"] = time.time()

    return jsonify(result), 200


def invalidate_live_cache() -> None:
    """Invalidate the live status cache after DB changes."""
    _live_cache["data"] = None
    _live_cache["ts"] = 0
