"""Unit tests for Pydantic response schemas."""

import uuid
from datetime import UTC, datetime

from app.models import (
    Breed,
    FictionalSpecies,
    LiveStream,
    Notification,
    OAuthAccount,
)
from app.response_schemas import (
    BreedResponse,
    FictionalSpeciesResponse,
    LiveStreamResponse,
    NotificationResponse,
    OAuthAccountPublicResponse,
    OAuthAccountResponse,
)

# ---------------------------------------------------------------------------
# BreedResponse
# ---------------------------------------------------------------------------


class TestBreedResponse:
    def test_from_model(self, app, db_session) -> None:
        breed = Breed(id=1, taxon_id=9615, name_en="Shiba Inu", name_zh="柴犬", breed_group="Spitz")
        db_session.add(breed)
        db_session.commit()

        result = BreedResponse.model_validate(breed).model_dump(mode="json")
        assert result == {
            "id": 1,
            "taxon_id": 9615,
            "name_en": "Shiba Inu",
            "name_zh": "柴犬",
            "breed_group": "Spitz",
        }

    def test_nullable_fields(self, app, db_session) -> None:
        breed = Breed(id=2, taxon_id=9615, name_en="Akita")
        db_session.add(breed)
        db_session.commit()

        result = BreedResponse.model_validate(breed).model_dump(mode="json")
        assert result["name_zh"] is None
        assert result["breed_group"] is None


# ---------------------------------------------------------------------------
# FictionalSpeciesResponse
# ---------------------------------------------------------------------------


class TestFictionalSpeciesResponse:
    def test_from_model(self, app, db_session) -> None:
        fs = FictionalSpecies(
            id=1, name="Dragon", name_zh="龍", origin="Western", sub_origin="Norse", description="A fire breather"
        )
        db_session.add(fs)
        db_session.commit()

        result = FictionalSpeciesResponse.model_validate(fs).model_dump(mode="json")
        assert result == {
            "id": 1,
            "name": "Dragon",
            "name_zh": "龍",
            "origin": "Western",
            "sub_origin": "Norse",
            "category_path": None,
            "description": "A fire breather",
        }


# ---------------------------------------------------------------------------
# NotificationResponse
# ---------------------------------------------------------------------------


class TestNotificationResponse:
    def test_from_model(self, app, db_session) -> None:
        uid = str(uuid.uuid4())
        from app.models import User

        db_session.add(User(id=uid, display_name="T"))
        db_session.commit()

        n = Notification(
            id=1,
            user_id=uid,
            type="breed_request",
            reference_id=42,
            title="已收到",
            message="msg",
            status="received",
            is_read=False,
        )
        db_session.add(n)
        db_session.commit()

        result = NotificationResponse.model_validate(n).model_dump(mode="json")
        assert result["id"] == 1
        assert result["type"] == "breed_request"
        assert result["reference_id"] == 42
        assert result["title"] == "已收到"
        assert result["message"] == "msg"
        assert result["status"] == "received"
        assert result["is_read"] is False
        assert isinstance(result["created_at"], str)


# ---------------------------------------------------------------------------
# LiveStreamResponse
# ---------------------------------------------------------------------------


class TestLiveStreamResponse:
    def test_from_model(self, app, db_session) -> None:
        uid = f"u-{uuid.uuid4().hex[:8]}"
        from app.models import User

        db_session.add(User(id=uid, display_name="T"))
        db_session.commit()

        ts = datetime(2025, 1, 1, 12, 0, 0, tzinfo=UTC)
        s = LiveStream(user_id=uid, provider="twitch", stream_id="abc", stream_title="Live!", started_at=ts)
        db_session.add(s)
        db_session.commit()

        result = LiveStreamResponse.model_validate(s).model_dump(mode="json")
        assert result["user_id"] == uid
        assert result["provider"] == "twitch"
        assert result["stream_id"] == "abc"
        assert result["stream_title"] == "Live!"
        assert "2025-01-01" in result["started_at"]


# ---------------------------------------------------------------------------
# OAuthAccountResponse / OAuthAccountPublicResponse
# ---------------------------------------------------------------------------


class TestOAuthAccountResponse:
    def _make_account(self, db_session, uid: str) -> OAuthAccount:
        from app.models import User

        db_session.add(User(id=uid, display_name="T"))
        db_session.commit()
        account = OAuthAccount(
            id=f"oa-{uuid.uuid4().hex[:8]}",
            user_id=uid,
            provider="twitch",
            provider_account_id="12345",
            provider_display_name="Streamer",
            provider_avatar_url="https://example.com/avatar.png",
            channel_url="https://twitch.tv/streamer",
            show_on_profile=True,
            live_sub_status="active",
        )
        db_session.add(account)
        db_session.commit()
        return account

    def test_full_response(self, app, db_session) -> None:
        uid = f"u-{uuid.uuid4().hex[:8]}"
        account = self._make_account(db_session, uid)

        result = OAuthAccountResponse.model_validate(account).model_dump(mode="json")
        assert result["id"] == account.id
        assert result["provider"] == "twitch"
        assert result["provider_account_id"] == "12345"
        assert result["provider_display_name"] == "Streamer"
        assert result["show_on_profile"] is True
        assert result["live_sub_status"] == "active"
        assert isinstance(result["created_at"], str)

    def test_public_response_excludes_private_fields(self, app, db_session) -> None:
        uid = f"u-{uuid.uuid4().hex[:8]}"
        account = self._make_account(db_session, uid)

        result = OAuthAccountPublicResponse.model_validate(account).model_dump(mode="json")
        assert result["id"] == account.id
        assert result["provider"] == "twitch"
        assert result["provider_display_name"] == "Streamer"
        assert "provider_account_id" not in result
        assert "show_on_profile" not in result
        assert "created_at" not in result
        assert "live_sub_status" not in result

    def test_matches_old_to_dict(self, app, db_session) -> None:
        """Verify new schema output matches old to_dict() for non-public mode."""
        uid = f"u-{uuid.uuid4().hex[:8]}"
        account = self._make_account(db_session, uid)

        old = account.to_dict()
        new = OAuthAccountResponse.model_validate(account).model_dump(mode="json")
        # Compare shared keys
        for key in old:
            assert key in new, f"Key {key!r} missing in new schema"
            # Normalize datetime strings for comparison
            if isinstance(old[key], str) and "T" in old[key] and isinstance(new[key], str):
                assert old[key][:19] == new[key][:19], f"Mismatch on {key}"
            else:
                assert old[key] == new[key], f"Mismatch on {key}: {old[key]!r} != {new[key]!r}"

    def test_matches_old_to_dict_public(self, app, db_session) -> None:
        """Verify new public schema output matches old to_dict(public=True)."""
        uid = f"u-{uuid.uuid4().hex[:8]}"
        account = self._make_account(db_session, uid)

        old = account.to_dict(public=True)
        new = OAuthAccountPublicResponse.model_validate(account).model_dump(mode="json")
        for key in old:
            assert key in new, f"Key {key!r} missing in new public schema"
            assert old[key] == new[key], f"Mismatch on {key}: {old[key]!r} != {new[key]!r}"
