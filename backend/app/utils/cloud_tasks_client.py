"""Cloud Tasks utility — dispatch HTTP tasks to a Cloud Tasks queue."""

import logging
import os

from google.api_core.exceptions import GoogleAPICallError
from google.cloud import tasks_v2

logger = logging.getLogger(__name__)

_PROJECT_ID = None
_LOCATION = None
_QUEUE_NAME = None
_SERVICE_URL = None

_client = None


def _load_config():
    global _PROJECT_ID, _LOCATION, _QUEUE_NAME, _SERVICE_URL
    _PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    _LOCATION = os.environ.get("CLOUD_TASKS_LOCATION", "asia-east1")
    _QUEUE_NAME = os.environ.get("CLOUD_TASKS_QUEUE", "websub-subscribe")
    _SERVICE_URL = os.environ.get("CLOUD_RUN_SERVICE_URL", "")


def _get_client() -> tasks_v2.CloudTasksClient:
    global _client
    if _client is None:
        _client = tasks_v2.CloudTasksClient()
    return _client


def dispatch_task(
    path: str,
    *,
    params: dict | None = None,
    method: str = "POST",
) -> str | None:
    """Create a single Cloud Task targeting *path* on the Cloud Run service.

    Returns the task name on success, or None on failure.
    """
    _load_config()

    if not _PROJECT_ID or not _SERVICE_URL:
        logger.error(
            "Cloud Tasks config incomplete: PROJECT=%s, SERVICE_URL=%s",
            _PROJECT_ID, _SERVICE_URL,
        )
        return None

    client = _get_client()
    queue_path = client.queue_path(_PROJECT_ID, _LOCATION, _QUEUE_NAME)

    url = f"{_SERVICE_URL.rstrip('/')}{path}"
    if params:
        query = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"{url}?{query}"

    http_method = (
        tasks_v2.HttpMethod.POST if method == "POST"
        else tasks_v2.HttpMethod.GET
    )

    task = {
        "http_request": {
            "http_method": http_method,
            "url": url,
            "headers": {"Content-Type": "application/json"},
        }
    }

    try:
        created = client.create_task(
            request={"parent": queue_path, "task": task}
        )
        logger.info("Cloud Task created: %s", created.name)
        return created.name
    except GoogleAPICallError:
        logger.error("Failed to create Cloud Task: %s", url, exc_info=True)
        return None


def dispatch_tasks_batch(
    path: str,
    *,
    params_list: list[dict],
    method: str = "POST",
) -> dict:
    """Dispatch multiple Cloud Tasks, one per params dict.

    Returns {'dispatched': int, 'failed': int}.
    """
    dispatched = 0
    failed = 0
    for params in params_list:
        result = dispatch_task(path, params=params, method=method)
        if result:
            dispatched += 1
        else:
            failed += 1
    return {"dispatched": dispatched, "failed": failed}
