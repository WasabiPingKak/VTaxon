"""Google Cloud KMS encrypt/decrypt for sensitive tokens.

Encrypts plaintext via KMS symmetric key, returns base64-encoded ciphertext.
When KMS is not configured (local dev), falls back to plaintext storage.
Old unencrypted values are handled gracefully on read (auto-detected).
"""

import base64
import logging
import os

logger = logging.getLogger(__name__)

_kms_key_name: str | None = None


def _get_key_name() -> str:
    """Build KMS key resource name from env vars. Returns empty string if not configured."""
    global _kms_key_name
    if _kms_key_name is not None:
        return _kms_key_name

    project = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("KMS_LOCATION", "asia-east1")
    key_ring = os.getenv("KMS_KEY_RING")
    key_id = os.getenv("KMS_KEY_ID")

    if not all([project, key_ring, key_id]):
        _kms_key_name = ""
        return ""

    _kms_key_name = f"projects/{project}/locations/{location}/keyRings/{key_ring}/cryptoKeys/{key_id}"
    return _kms_key_name


def is_kms_configured() -> bool:
    """Check whether KMS env vars are set."""
    return bool(_get_key_name())


def kms_encrypt(plaintext: str) -> str:
    """Encrypt a string via KMS. Returns base64-encoded ciphertext.

    Falls back to plaintext if KMS is not configured (dev environment).
    """
    if not plaintext:
        return plaintext

    key_name = _get_key_name()
    if not key_name:
        return plaintext

    from google.cloud import kms  # type: ignore[attr-defined]

    client = kms.KeyManagementServiceClient()
    response = client.encrypt(
        request={
            "name": key_name,
            "plaintext": plaintext.encode("utf-8"),
        }
    )
    return base64.b64encode(response.ciphertext).decode("utf-8")


def kms_decrypt(ciphertext: str) -> str:
    """Decrypt a base64-encoded ciphertext via KMS.

    Falls back gracefully for:
    - KMS not configured (dev environment) → return as-is
    - Non-base64 value (old unencrypted data) → return as-is
    - KMS decrypt failure (key rotation edge case) → return as-is
    """
    if not ciphertext:
        return ciphertext

    key_name = _get_key_name()
    if not key_name:
        return ciphertext

    try:
        ciphertext_bytes = base64.b64decode(ciphertext)
    except Exception:
        # Not base64 → unencrypted legacy value
        return ciphertext

    from google.cloud import kms  # type: ignore[attr-defined]

    client = kms.KeyManagementServiceClient()
    try:
        response = client.decrypt(
            request={
                "name": key_name,
                "ciphertext": ciphertext_bytes,
            }
        )
        result: str = response.plaintext.decode("utf-8")
        return result
    except Exception:
        logger.warning("KMS decrypt failed, treating as unencrypted legacy value")
        return ciphertext
