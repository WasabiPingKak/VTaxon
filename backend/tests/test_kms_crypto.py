"""Tests for KMS crypto utilities and EncryptedText SQLAlchemy type."""

import base64
import sys
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

import app.utils.kms_crypto as kms_mod
from app.utils.kms_crypto import kms_decrypt, kms_encrypt

# ---------------------------------------------------------------------------
# Mock google.cloud.kms module (not installed in test env)
# ---------------------------------------------------------------------------

_mock_kms_module = MagicMock()


@pytest.fixture(autouse=True)
def _reset_kms_state():
    """Reset module-level KMS cache and inject mock KMS module."""
    kms_mod._kms_key_name = None
    sys.modules["google.cloud.kms"] = _mock_kms_module
    _mock_kms_module.KeyManagementServiceClient.reset_mock()
    yield
    kms_mod._kms_key_name = None
    sys.modules.pop("google.cloud.kms", None)


# ---------------------------------------------------------------------------
# kms_encrypt
# ---------------------------------------------------------------------------


class TestKmsEncrypt:
    def test_none_returns_none(self):
        assert kms_encrypt(None) is None

    def test_empty_string_returns_empty(self):
        assert kms_encrypt("") == ""

    def test_fallback_plaintext_when_kms_not_configured(self):
        assert kms_encrypt("my-secret-token") == "my-secret-token"

    @patch.dict("os.environ", {"GOOGLE_CLOUD_PROJECT": "test", "KMS_KEY_RING": "ring", "KMS_KEY_ID": "key"})
    def test_encrypts_via_kms(self):
        fake_ciphertext = b"encrypted-bytes"
        _mock_kms_module.KeyManagementServiceClient.return_value.encrypt.return_value = SimpleNamespace(
            ciphertext=fake_ciphertext,
        )

        result = kms_encrypt("my-token")

        assert result == base64.b64encode(fake_ciphertext).decode("utf-8")
        _mock_kms_module.KeyManagementServiceClient.return_value.encrypt.assert_called_once()


# ---------------------------------------------------------------------------
# kms_decrypt
# ---------------------------------------------------------------------------


class TestKmsDecrypt:
    def test_none_returns_none(self):
        assert kms_decrypt(None) is None

    def test_empty_string_returns_empty(self):
        assert kms_decrypt("") == ""

    def test_fallback_plaintext_when_kms_not_configured(self):
        assert kms_decrypt("some-plaintext-token") == "some-plaintext-token"

    @patch.dict("os.environ", {"GOOGLE_CLOUD_PROJECT": "test", "KMS_KEY_RING": "ring", "KMS_KEY_ID": "key"})
    def test_decrypts_via_kms(self):
        plaintext = "my-token"
        fake_ciphertext = b"encrypted-bytes"
        b64_input = base64.b64encode(fake_ciphertext).decode("utf-8")

        _mock_kms_module.KeyManagementServiceClient.return_value.decrypt.return_value = SimpleNamespace(
            plaintext=plaintext.encode("utf-8"),
        )

        result = kms_decrypt(b64_input)

        assert result == plaintext

    @patch.dict("os.environ", {"GOOGLE_CLOUD_PROJECT": "test", "KMS_KEY_RING": "ring", "KMS_KEY_ID": "key"})
    def test_non_base64_fallback(self):
        """Non-base64 value (legacy plaintext) should be returned as-is."""
        legacy = "not-base64-!!!-token"
        result = kms_decrypt(legacy)
        assert result == legacy

    @patch.dict("os.environ", {"GOOGLE_CLOUD_PROJECT": "test", "KMS_KEY_RING": "ring", "KMS_KEY_ID": "key"})
    def test_kms_failure_fallback(self):
        """If KMS decrypt fails, return ciphertext as-is."""
        _mock_kms_module.KeyManagementServiceClient.return_value.decrypt.side_effect = Exception("KMS unavailable")

        b64_input = base64.b64encode(b"some-bytes").decode("utf-8")
        result = kms_decrypt(b64_input)

        assert result == b64_input

    @patch.dict("os.environ", {"GOOGLE_CLOUD_PROJECT": "test", "KMS_KEY_RING": "ring", "KMS_KEY_ID": "key"})
    def test_encrypt_decrypt_roundtrip(self):
        original = "ya29.access-token-here"
        fake_ciphertext = b"kms-encrypted-output"

        mock_client = MagicMock()
        mock_client.encrypt.return_value = SimpleNamespace(ciphertext=fake_ciphertext)
        mock_client.decrypt.return_value = SimpleNamespace(plaintext=original.encode("utf-8"))
        _mock_kms_module.KeyManagementServiceClient.return_value = mock_client

        encrypted = kms_encrypt(original)
        decrypted = kms_decrypt(encrypted)

        assert decrypted == original


# ---------------------------------------------------------------------------
# EncryptedText TypeDecorator
# ---------------------------------------------------------------------------


class TestEncryptedText:
    def test_none_passthrough(self):
        from app.utils.encrypted_type import EncryptedText

        col_type = EncryptedText()
        assert col_type.process_bind_param(None, None) is None
        assert col_type.process_result_value(None, None) is None

    def test_plaintext_fallback_without_kms(self):
        from app.utils.encrypted_type import EncryptedText

        col_type = EncryptedText()
        assert col_type.process_bind_param("token123", None) == "token123"
        assert col_type.process_result_value("token123", None) == "token123"

    @patch.dict("os.environ", {"GOOGLE_CLOUD_PROJECT": "test", "KMS_KEY_RING": "ring", "KMS_KEY_ID": "key"})
    def test_roundtrip_with_kms(self):
        from app.utils.encrypted_type import EncryptedText

        original = "secret-token"
        fake_ciphertext = b"enc-bytes"

        mock_client = MagicMock()
        mock_client.encrypt.return_value = SimpleNamespace(ciphertext=fake_ciphertext)
        mock_client.decrypt.return_value = SimpleNamespace(plaintext=original.encode("utf-8"))
        _mock_kms_module.KeyManagementServiceClient.return_value = mock_client

        col_type = EncryptedText()
        stored = col_type.process_bind_param(original, None)
        recovered = col_type.process_result_value(stored, None)

        assert stored == base64.b64encode(fake_ciphertext).decode("utf-8")
        assert recovered == original
