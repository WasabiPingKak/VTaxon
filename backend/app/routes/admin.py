from flask import Blueprint, jsonify
from sqlalchemy import func

from ..auth import admin_required
from ..extensions import db
from ..models import BreedRequest, FictionalSpeciesRequest, UserReport

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/request-counts')
@admin_required
def get_request_counts():
    """Return status counts for all admin request types in one call."""
    # Fictional species requests: group by status
    fictional_rows = (
        db.session.query(FictionalSpeciesRequest.status, func.count())
        .group_by(FictionalSpeciesRequest.status)
        .all()
    )
    fictional = {status: count for status, count in fictional_rows}

    # Breed requests: group by status
    breed_rows = (
        db.session.query(BreedRequest.status, func.count())
        .group_by(BreedRequest.status)
        .all()
    )
    breed = {status: count for status, count in breed_rows}

    # User reports: group by status
    report_rows = (
        db.session.query(UserReport.status, func.count())
        .group_by(UserReport.status)
        .all()
    )
    report = {status: count for status, count in report_rows}

    return jsonify({
        'fictional': fictional,
        'breed': breed,
        'report': report,
    })
