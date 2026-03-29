"""Shared HTTP client with automatic retry for external API calls.

Provides a pre-configured requests.Session that retries transient errors
(connection failures, timeouts, 5xx responses) with exponential backoff.

Usage:
    from .http_client import external_session

    resp = external_session.get("https://api.gbif.org/v1/species/suggest", timeout=10)
"""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

_retry_strategy = Retry(
    total=2,  # up to 2 retries (3 attempts total)
    backoff_factor=0.5,  # wait 0.5s, then 1s
    status_forcelist=[500, 502, 503, 504],
    allowed_methods=["GET"],
    raise_on_status=False,  # let callers handle status codes themselves
)

_adapter = HTTPAdapter(max_retries=_retry_strategy)

external_session = requests.Session()
external_session.mount("https://", _adapter)
external_session.mount("http://", _adapter)
