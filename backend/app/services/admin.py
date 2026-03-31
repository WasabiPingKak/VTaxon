"""Business logic for admin operations — request counts, exports, transitions, visibility."""

import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from ..cache import invalidate_fictional_tree_cache, invalidate_tree_cache
from ..extensions import db
from ..models import Breed, BreedRequest, FictionalSpeciesRequest, SpeciesCache, SpeciesNameReport, User, UserReport

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Request counts
# ---------------------------------------------------------------------------


def get_request_counts() -> dict[str, Any]:
    """Aggregate status counts for all admin request types."""
    fictional_rows = (
        db.session.query(FictionalSpeciesRequest.status, func.count()).group_by(FictionalSpeciesRequest.status).all()
    )
    breed_rows = db.session.query(BreedRequest.status, func.count()).group_by(BreedRequest.status).all()
    name_report_rows = db.session.query(SpeciesNameReport.status, func.count()).group_by(SpeciesNameReport.status).all()
    report_rows = db.session.query(UserReport.status, func.count()).group_by(UserReport.status).all()
    pending_review_count = User.query.filter_by(visibility="pending_review").count()

    return {
        "fictional": {status: count for status, count in fictional_rows},
        "breed": {status: count for status, count in breed_rows},
        "name_report": {status: count for status, count in name_report_rows},
        "report": {status: count for status, count in report_rows},
        "visibility": {"pending_review": pending_review_count},
    }


# ---------------------------------------------------------------------------
# Exports
# ---------------------------------------------------------------------------


def export_fictional() -> dict[str, Any]:
    """Export received fictional species requests."""
    requests = (
        FictionalSpeciesRequest.query.filter_by(status="received").order_by(FictionalSpeciesRequest.created_at).all()
    )
    return {
        "export_metadata": {
            "exported_at": datetime.now(UTC).isoformat(),
            "type": "fictional_species",
            "total_requests": len(requests),
        },
        "instructions": (
            "以下是已排入待辦的虛構物種回報。"
            "請檢查這些物種是否有確切的文化來源或典故，使用者填的物種是否有具體可聯想的外型。"
            "除了評估適合分類在目前系統中的哪個分類以外，也可以獨立為比較特殊的物種建立新的分類。"
            "請跟我討論接下來的處理方式。"
            "【重要】禁止自行呼叫 API 變更回報狀態或寫入管理員備註，所有狀態變更必須由管理員手動操作。"
        ),
        "requests": [
            {
                "request_id": r.id,
                "name_zh": r.name_zh,
                "name_en": r.name_en,
                "suggested_origin": r.suggested_origin,
                "suggested_sub_origin": r.suggested_sub_origin,
                "description": r.description,
                "admin_note": r.admin_note,
                "created_at": r.created_at.isoformat(),
            }
            for r in requests
        ],
    }


def export_breeds() -> dict[str, Any]:
    """Export received breed requests with species context."""
    requests = BreedRequest.query.filter_by(status="received").order_by(BreedRequest.created_at).all()

    result_requests = []
    for r in requests:
        species_ctx = None
        existing_breeds = []
        if r.taxon_id:
            sc = db.session.get(SpeciesCache, r.taxon_id)
            if sc:
                species_ctx = {
                    "taxon_id": sc.taxon_id,
                    "scientific_name": sc.scientific_name,
                    "common_name_zh": sc.common_name_zh,
                    "taxon_rank": sc.taxon_rank,
                }
            breeds = Breed.query.filter_by(taxon_id=r.taxon_id).all()
            existing_breeds = [{"name_en": b.name_en, "name_zh": b.name_zh} for b in breeds]

        result_requests.append(
            {
                "request_id": r.id,
                "name_zh": r.name_zh,
                "name_en": r.name_en,
                "taxon_id": r.taxon_id,
                "description": r.description,
                "admin_note": r.admin_note,
                "created_at": r.created_at.isoformat(),
                "species_context": species_ctx,
                "existing_breeds_for_species": existing_breeds,
            }
        )

    return {
        "export_metadata": {
            "exported_at": datetime.now(UTC).isoformat(),
            "type": "breed",
            "total_requests": len(requests),
        },
        "instructions": (
            "以下是已排入待辦的品種新增回報。"
            "請根據每筆回報，判斷品種名稱是否正確、是否已存在。"
            "回報為什麼在系統中查不到指定的品種或物種名稱。"
            "然後跟我討論接下來的處理方式。"
            "【重要】禁止自行呼叫 API 變更回報狀態或寫入管理員備註，所有狀態變更必須由管理員手動操作。"
        ),
        "requests": result_requests,
    }


# ---------------------------------------------------------------------------
# Transitions
# ---------------------------------------------------------------------------


def transition_fictional() -> tuple[dict[str, Any], int]:
    """Batch transition fictional species requests from received to in_progress.

    Returns (result_dict, http_status).
    """
    from .notifications import create_notification

    reqs = FictionalSpeciesRequest.query.filter_by(status="received").all()
    for r in reqs:
        r.status = "in_progress"
        create_notification(r.user_id, "fictional_request", r.id, "in_progress", subject_name=r.name_zh)
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        logger.exception("批量轉移虛構物種回報失敗")
        return {"error": "批量轉移失敗，請稍後再試"}, 500
    return {"updated": len(reqs)}, 200


def transition_breeds() -> tuple[dict[str, Any], int]:
    """Batch transition breed requests from received to in_progress.

    Returns (result_dict, http_status).
    """
    from .notifications import create_notification

    reqs = BreedRequest.query.filter_by(status="received").all()
    for r in reqs:
        r.status = "in_progress"
        create_notification(r.user_id, "breed_request", r.id, "in_progress", subject_name=r.name_zh or r.name_en)
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        logger.exception("批量轉移品種回報失敗")
        return {"error": "批量轉移失敗，請稍後再試"}, 500
    return {"updated": len(reqs)}, 200


# ---------------------------------------------------------------------------
# Visibility
# ---------------------------------------------------------------------------


def set_user_visibility(user_id: str, admin_user_id: str, data: dict[str, Any]) -> tuple[dict[str, Any], int]:
    """Set user visibility. Returns (result_dict, http_status)."""
    user = db.session.get(User, user_id)
    if not user:
        return {"error": "User not found"}, 404

    new_visibility = data.get("visibility")
    if new_visibility not in ("visible", "hidden"):
        return {"error": "visibility must be visible or hidden"}, 400

    reason = (data.get("reason") or "").strip() or None

    user.visibility = new_visibility
    user.visibility_reason = reason
    user.visibility_changed_at = datetime.now(UTC)
    user.visibility_changed_by = admin_user_id
    if new_visibility == "visible":
        user.appeal_note = None

    db.session.commit()
    invalidate_tree_cache()
    invalidate_fictional_tree_cache()

    return {"ok": True, "user_id": user.id, "visibility": user.visibility}, 200
