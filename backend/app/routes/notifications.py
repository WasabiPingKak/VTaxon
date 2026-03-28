from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..extensions import db
from ..models import BreedRequest, FictionalSpeciesRequest, Notification, UserReport

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("", methods=["GET"])
@login_required
def list_notifications():
    query = Notification.query.filter_by(user_id=str(g.current_user_id))
    if request.args.get("unread_only") == "true":
        query = query.filter_by(is_read=False)
    limit = request.args.get("limit", 50, type=int)
    limit = min(limit, 200)
    notifs = query.order_by(Notification.created_at.desc()).limit(limit).all()
    return jsonify({"notifications": [n.to_dict() for n in notifs]})


@notifications_bp.route("/grouped", methods=["GET"])
@login_required
def grouped_notifications():
    """Return notifications grouped by (type, reference_id) as a timeline."""
    uid = str(g.current_user_id)
    notifs = Notification.query.filter_by(user_id=uid).order_by(Notification.created_at.desc()).all()

    # Group by (type, reference_id)
    groups = {}
    for n in notifs:
        key = (n.type, n.reference_id)
        if key not in groups:
            groups[key] = []
        groups[key].append(n.to_dict())

    # Batch-load original requests for summaries
    fictional_ids = [k[1] for k in groups if k[0] == "fictional_request"]
    breed_ids = [k[1] for k in groups if k[0] == "breed_request"]
    report_ids = [k[1] for k in groups if k[0] == "report"]

    fictional_map = (
        {r.id: r for r in FictionalSpeciesRequest.query.filter(FictionalSpeciesRequest.id.in_(fictional_ids)).all()}
        if fictional_ids
        else {}
    )
    breed_map = {r.id: r for r in BreedRequest.query.filter(BreedRequest.id.in_(breed_ids)).all()} if breed_ids else {}
    report_map = {r.id: r for r in UserReport.query.filter(UserReport.id.in_(report_ids)).all()} if report_ids else {}

    def _build_summary(type_, ref_id):
        if type_ == "fictional_request":
            r = fictional_map.get(ref_id)
            if not r:
                return None
            return {
                "name_zh": r.name_zh,
                "name_en": r.name_en,
                "suggested_origin": r.suggested_origin,
                "suggested_sub_origin": r.suggested_sub_origin,
                "description": r.description,
            }
        if type_ == "breed_request":
            r = breed_map.get(ref_id)
            if not r:
                return None
            return {
                "name_zh": r.name_zh,
                "name_en": r.name_en,
                "description": r.description,
                "taxon_id": r.taxon_id,
            }
        if type_ == "report":
            r = report_map.get(ref_id)
            if not r:
                return None
            return {
                "report_type": r.report_type,
                "reason": r.reason,
            }
        return None

    # Build result sorted by latest notification time per group
    result = []
    for (type_, ref_id), items in groups.items():
        has_unread = any(not it["is_read"] for it in items)
        result.append(
            {
                "type": type_,
                "reference_id": ref_id,
                "latest_title": items[0]["title"],
                "latest_status": items[0].get("status"),
                "latest_at": items[0]["created_at"],
                "has_unread": has_unread,
                "request_summary": _build_summary(type_, ref_id),
                "timeline": items,  # newest first
            }
        )

    # Sort by latest_at descending (already ordered)
    type_filter = request.args.get("type")
    if type_filter:
        result = [g for g in result if g["type"] == type_filter]

    return jsonify({"groups": result})


@notifications_bp.route("/unread-count", methods=["GET"])
@login_required
def unread_count():
    count = Notification.query.filter_by(user_id=str(g.current_user_id), is_read=False).count()
    return jsonify({"count": count})


@notifications_bp.route("/read", methods=["POST"])
@login_required
def mark_read():
    data = request.get_json() or {}
    query = Notification.query.filter_by(user_id=str(g.current_user_id), is_read=False)
    if data.get("all"):
        query.update({"is_read": True})
    elif data.get("ids"):
        ids = data["ids"]
        if not isinstance(ids, list):
            return jsonify({"error": "ids must be a list"}), 400
        query.filter(Notification.id.in_(ids)).update({"is_read": True})
    else:
        return jsonify({"error": "Provide all:true or ids:[...]"}), 400
    db.session.commit()
    return jsonify({"ok": True})
