"""SQLAlchemy custom type that transparently encrypts/decrypts via KMS."""

import sqlalchemy as sa

from .kms_crypto import kms_decrypt, kms_encrypt


class EncryptedText(sa.TypeDecorator):
    """A Text column that encrypts on write and decrypts on read via KMS.

    - Write: plaintext → kms_encrypt() → stored as base64 ciphertext
    - Read:  ciphertext → kms_decrypt() → plaintext
    - None values pass through unchanged
    - When KMS is not configured (dev), values are stored/read as plaintext
    - Old unencrypted values are auto-detected and returned as-is on read
    """

    impl = sa.Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return kms_encrypt(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return kms_decrypt(value)
