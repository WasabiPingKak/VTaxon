from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..extensions import db
from ..models import Notification

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@login_required
def list_notifications():
    query = Notification.query.filter_by(user_id=str(g.current_user_id))
    if request.args.get('unread_only') == 'true':
        query = query.filter_by(is_read=False)
    notifs = query.order_by(Notification.created_at.desc()).limit(50).all()
    return jsonify({'notifications': [n.to_dict() for n in notifs]})


@notifications_bp.route('/unread-count', methods=['GET'])
@login_required
def unread_count():
    count = (Notification.query
             .filter_by(user_id=str(g.current_user_id), is_read=False)
             .count())
    return jsonify({'count': count})


@notifications_bp.route('/read', methods=['POST'])
@login_required
def mark_read():
    data = request.get_json() or {}
    query = Notification.query.filter_by(user_id=str(g.current_user_id), is_read=False)
    if data.get('all'):
        query.update({'is_read': True})
    elif data.get('ids'):
        ids = data['ids']
        if not isinstance(ids, list):
            return jsonify({'error': 'ids must be a list'}), 400
        query.filter(Notification.id.in_(ids)).update({'is_read': True})
    else:
        return jsonify({'error': 'Provide all:true or ids:[...]'}), 400
    db.session.commit()
    return jsonify({'ok': True})
