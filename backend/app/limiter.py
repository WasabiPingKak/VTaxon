"""Rate limiting configuration.

Uses in-memory storage by default (per-process, not shared across
gunicorn workers). Set RATE_LIMIT_STORAGE_URL environment variable
to switch to a shared backend (e.g. redis://host:6379).
"""

import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri=os.getenv("RATE_LIMIT_STORAGE_URL", "memory://"),
)
