"""SQLAlchemy custom type that transparently encrypts/decrypts via KMS."""

from typing import Any

import sqlalchemy as sa
from sqlalchemy.engine import Dialect

from .kms_crypto import kms_decrypt, kms_encrypt


class EncryptedText(sa.TypeDecorator[str]):
    """A Text column that encrypts on write and decrypts on read via KMS.

    - Write: plaintext → kms_encrypt() → stored as base64 ciphertext
    - Read:  ciphertext → kms_decrypt() → plaintext
    - None values pass through unchanged
    - When KMS is not configured (dev), values are stored/read as plaintext
    - Old unencrypted values are auto-detected and returned as-is on read
    """

    impl = sa.Text
    cache_ok = True

    def process_bind_param(self, value: str | None, dialect: Dialect) -> str | None:
        if value is None:
            return None
        return kms_encrypt(value)

    def process_result_value(self, value: Any, dialect: Dialect) -> str | None:
        if value is None:
            return None
        return kms_decrypt(value)
