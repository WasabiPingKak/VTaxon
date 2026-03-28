from flask import Blueprint, g, jsonify, request

from ..auth import admin_required, login_required
from ..extensions import db
from ..models import FictionalSpecies, FictionalSpeciesRequest
from ..schemas import CreateFictionalRequestSchema, UpdateRequestStatusSchema, validate_with

fictional_bp = Blueprint("fictional", __name__)


@fictional_bp.route("", methods=["GET"])
def list_fictional_species():
    query = FictionalSpecies.query

    origin = request.args.get("origin")
    if origin:
        query = query.filter_by(origin=origin)

    species = query.order_by(
        FictionalSpecies.origin,
        FictionalSpecies.sub_origin,
        FictionalSpecies.name,
    ).all()

    return jsonify({"species": [s.to_dict() for s in species]})


@fictional_bp.route("/requests", methods=["GET"])
@admin_required
def list_requests():
    status = request.args.get("status", "pending")
    if status not in ("pending", "received", "in_progress", "completed", "approved", "rejected"):
        return jsonify({"error": "Invalid status filter"}), 400

    reqs = (
        FictionalSpeciesRequest.query.filter_by(status=status).order_by(FictionalSpeciesRequest.created_at.desc()).all()
    )

    return jsonify({"requests": [r.to_dict() for r in reqs]})


@fictional_bp.route("/requests/<int:req_id>", methods=["PATCH"])
@admin_required
@validate_with(UpdateRequestStatusSchema)
def update_request(data, req_id):
    req = db.session.get(FictionalSpeciesRequest, req_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    req.status = data["status"]
    req.admin_note = data.get("admin_note") or req.admin_note

    from ..services.notifications import create_notification

    create_notification(
        req.user_id,
        "fictional_request",
        req.id,
        data["status"],
        req.admin_note,
        subject_name=req.name_zh or req.name_en,
    )

    db.session.commit()

    return jsonify(req.to_dict())


@fictional_bp.route("/requests", methods=["POST"])
@login_required
@validate_with(CreateFictionalRequestSchema)
def create_request(data):
    req = FictionalSpeciesRequest(
        user_id=g.current_user_id,
        name_zh=data["name_zh"],
        name_en=data.get("name_en") or None,
        suggested_origin=data.get("suggested_origin") or None,
        suggested_sub_origin=data.get("suggested_sub_origin") or None,
        description=data.get("description") or None,
    )
    db.session.add(req)
    db.session.commit()

    from ..services.email import notify_new_fictional_request

    notify_new_fictional_request(req)

    return jsonify(req.to_dict()), 201
