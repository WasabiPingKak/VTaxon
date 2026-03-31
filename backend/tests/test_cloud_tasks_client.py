"""Tests for Cloud Tasks dispatch utilities."""

import sys
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Mock google.cloud.tasks_v2 and google.api_core.exceptions before import
# ---------------------------------------------------------------------------

_mock_tasks_v2 = MagicMock()


class _FakeGoogleAPICallError(Exception):
    """Stand-in for google.api_core.exceptions.GoogleAPICallError."""


_mock_api_core_exceptions = MagicMock()
_mock_api_core_exceptions.GoogleAPICallError = _FakeGoogleAPICallError

# Save originals to restore later if needed
_orig_modules = {k: sys.modules.get(k) for k in ("google.cloud.tasks_v2", "google.api_core.exceptions")}

sys.modules["google.cloud.tasks_v2"] = _mock_tasks_v2
sys.modules["google.api_core.exceptions"] = _mock_api_core_exceptions

import app.utils.cloud_tasks_client as ct  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_module_state():
    """Reset module-level global state before each test."""
    ct._PROJECT_ID = None
    ct._LOCATION = None
    ct._QUEUE_NAME = None
    ct._SERVICE_URL = None
    ct._client = None
    _mock_tasks_v2.CloudTasksClient.reset_mock()
    mock_client = _mock_tasks_v2.CloudTasksClient.return_value
    mock_client.reset_mock()
    mock_client.create_task.side_effect = None
    yield
    ct._PROJECT_ID = None
    ct._LOCATION = None
    ct._QUEUE_NAME = None
    ct._SERVICE_URL = None
    ct._client = None


# ---------------------------------------------------------------------------
# _load_config
# ---------------------------------------------------------------------------


class TestLoadConfig:
    @patch.dict("os.environ", {}, clear=True)
    def test_defaults_when_no_env_vars(self):
        ct._load_config()
        assert ct._PROJECT_ID == ""
        assert ct._LOCATION == "asia-east1"
        assert ct._QUEUE_NAME == "websub-subscribe"
        assert ct._SERVICE_URL == ""

    @patch.dict(
        "os.environ",
        {
            "GOOGLE_CLOUD_PROJECT": "my-project",
            "CLOUD_TASKS_LOCATION": "us-central1",
            "CLOUD_TASKS_QUEUE": "my-queue",
            "CLOUD_RUN_SERVICE_URL": "https://my-service.run.app",
        },
    )
    def test_reads_all_env_vars(self):
        ct._load_config()
        assert ct._PROJECT_ID == "my-project"
        assert ct._LOCATION == "us-central1"
        assert ct._QUEUE_NAME == "my-queue"
        assert ct._SERVICE_URL == "https://my-service.run.app"


# ---------------------------------------------------------------------------
# _get_client
# ---------------------------------------------------------------------------


class TestGetClient:
    def test_creates_client_on_first_call(self):
        client = ct._get_client()
        _mock_tasks_v2.CloudTasksClient.assert_called_once()
        assert client is _mock_tasks_v2.CloudTasksClient.return_value

    def test_returns_cached_client_on_second_call(self):
        first = ct._get_client()
        second = ct._get_client()
        assert first is second
        assert _mock_tasks_v2.CloudTasksClient.call_count == 1


# ---------------------------------------------------------------------------
# dispatch_task
# ---------------------------------------------------------------------------


_VALID_ENV = {
    "GOOGLE_CLOUD_PROJECT": "test-project",
    "CLOUD_RUN_SERVICE_URL": "https://service.run.app",
}


class TestDispatchTask:
    @patch.dict("os.environ", {}, clear=True)
    def test_returns_none_when_project_missing(self):
        result = ct.dispatch_task("/some/path")
        assert result is None

    @patch.dict("os.environ", {"GOOGLE_CLOUD_PROJECT": "proj"}, clear=True)
    def test_returns_none_when_service_url_missing(self):
        result = ct.dispatch_task("/some/path")
        assert result is None

    @patch.dict("os.environ", {"CLOUD_RUN_SERVICE_URL": "https://svc.run.app"}, clear=True)
    def test_returns_none_when_project_empty(self):
        result = ct.dispatch_task("/some/path")
        assert result is None

    @patch.dict("os.environ", _VALID_ENV, clear=True)
    def test_creates_task_successfully(self):
        mock_client = _mock_tasks_v2.CloudTasksClient.return_value
        mock_client.queue_path.return_value = "projects/test-project/locations/asia-east1/queues/websub-subscribe"
        mock_client.create_task.return_value = SimpleNamespace(name="tasks/12345")

        result = ct.dispatch_task("/api/subscribe")

        assert result == "tasks/12345"
        mock_client.create_task.assert_called_once()
        call_kwargs = mock_client.create_task.call_args
        task_arg = call_kwargs[1]["request"] if "request" in (call_kwargs[1] or {}) else call_kwargs[0][0]
        # Verify the request contains the right URL
        if isinstance(task_arg, dict):
            url = task_arg["task"]["http_request"]["url"]
            assert url == "https://service.run.app/api/subscribe"

    @patch.dict("os.environ", _VALID_ENV, clear=True)
    def test_appends_query_params(self):
        mock_client = _mock_tasks_v2.CloudTasksClient.return_value
        mock_client.queue_path.return_value = "projects/test-project/locations/asia-east1/queues/websub-subscribe"
        mock_client.create_task.return_value = SimpleNamespace(name="tasks/99")

        result = ct.dispatch_task("/api/subscribe", params={"channel_id": "UC123", "mode": "subscribe"})

        assert result == "tasks/99"
        call_args = mock_client.create_task.call_args
        request = call_args[1].get("request") or call_args[0][0]
        url = request["task"]["http_request"]["url"]
        assert "channel_id=UC123" in url
        assert "mode=subscribe" in url

    @patch.dict("os.environ", _VALID_ENV, clear=True)
    def test_strips_trailing_slash_from_service_url(self):
        env_with_slash = {**_VALID_ENV, "CLOUD_RUN_SERVICE_URL": "https://service.run.app/"}
        with patch.dict("os.environ", env_with_slash, clear=True):
            mock_client = _mock_tasks_v2.CloudTasksClient.return_value
            mock_client.queue_path.return_value = "queue-path"
            mock_client.create_task.return_value = SimpleNamespace(name="tasks/1")

            ct.dispatch_task("/api/test")

            call_args = mock_client.create_task.call_args
            request = call_args[1].get("request") or call_args[0][0]
            url = request["task"]["http_request"]["url"]
            assert "//api" not in url

    @patch.dict("os.environ", _VALID_ENV, clear=True)
    def test_uses_get_method(self):
        mock_client = _mock_tasks_v2.CloudTasksClient.return_value
        mock_client.queue_path.return_value = "queue-path"
        mock_client.create_task.return_value = SimpleNamespace(name="tasks/1")

        ct.dispatch_task("/api/check", method="GET")

        call_args = mock_client.create_task.call_args
        request = call_args[1].get("request") or call_args[0][0]
        http_method = request["task"]["http_request"]["http_method"]
        assert http_method == _mock_tasks_v2.HttpMethod.GET

    @patch.dict("os.environ", _VALID_ENV, clear=True)
    def test_returns_none_on_google_api_error(self):
        mock_client = _mock_tasks_v2.CloudTasksClient.return_value
        mock_client.queue_path.return_value = "queue-path"
        mock_client.create_task.side_effect = ct.GoogleAPICallError("boom")

        result = ct.dispatch_task("/api/subscribe")

        assert result is None


# ---------------------------------------------------------------------------
# dispatch_tasks_batch
# ---------------------------------------------------------------------------


class TestDispatchTasksBatch:
    @patch.dict("os.environ", _VALID_ENV, clear=True)
    def test_all_succeed(self):
        mock_client = _mock_tasks_v2.CloudTasksClient.return_value
        mock_client.queue_path.return_value = "queue-path"
        mock_client.create_task.return_value = SimpleNamespace(name="tasks/ok")

        result = ct.dispatch_tasks_batch(
            "/api/subscribe",
            params_list=[{"id": "1"}, {"id": "2"}, {"id": "3"}],
        )

        assert result == {"dispatched": 3, "failed": 0}

    @patch.dict("os.environ", {}, clear=True)
    def test_all_fail_when_config_missing(self):
        result = ct.dispatch_tasks_batch(
            "/api/subscribe",
            params_list=[{"id": "1"}, {"id": "2"}],
        )

        assert result == {"dispatched": 0, "failed": 2}

    @patch.dict("os.environ", _VALID_ENV, clear=True)
    def test_mixed_success_and_failure(self):
        mock_client = _mock_tasks_v2.CloudTasksClient.return_value
        mock_client.queue_path.return_value = "queue-path"
        mock_client.create_task.side_effect = [
            SimpleNamespace(name="tasks/1"),
            ct.GoogleAPICallError("fail"),
            SimpleNamespace(name="tasks/3"),
        ]

        result = ct.dispatch_tasks_batch(
            "/api/subscribe",
            params_list=[{"id": "1"}, {"id": "2"}, {"id": "3"}],
        )

        assert result == {"dispatched": 2, "failed": 1}

    @patch.dict("os.environ", _VALID_ENV, clear=True)
    def test_empty_params_list(self):
        result = ct.dispatch_tasks_batch("/api/subscribe", params_list=[])

        assert result == {"dispatched": 0, "failed": 0}
