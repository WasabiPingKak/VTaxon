"""Rate limiting configuration.

Uses in-memory storage, which is per-process (not shared across
gunicorn workers). Acceptable at current scale; for stricter
enforcement, switch storage_uri to a Redis instance.
"""

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri="memory://",
)
