"""Email notification service using Resend API.

Sends admin notifications when new requests/reports are created.
Silently skips if RESEND_API_KEY is not configured.
"""

import logging
import os
import threading

import resend

logger = logging.getLogger(__name__)

ADMIN_PANEL_URL = 'https://vtaxon.com/admin'


def _get_config():
    api_key = os.environ.get('RESEND_API_KEY', '').strip()
    emails_raw = os.environ.get('ADMIN_NOTIFY_EMAILS', '').strip()
    email_from = os.environ.get('EMAIL_FROM', 'VTaxon <noreply@vtaxon.com>').strip()

    if not api_key or not emails_raw:
        return None

    emails = [e.strip() for e in emails_raw.split(',') if e.strip()]
    if not emails:
        return None

    return {
        'api_key': api_key,
        'emails': emails,
        'from': email_from,
    }


def send_admin_notification(subject, html_body):
    """Send email to all admin notification recipients in a background thread."""
    config = _get_config()
    if not config:
        logger.debug('Email notification skipped: RESEND_API_KEY or ADMIN_NOTIFY_EMAILS not set')
        return

    def _send():
        try:
            resend.api_key = config['api_key']
            resend.Emails.send({
                'from': config['from'],
                'to': config['emails'],
                'subject': subject,
                'html': html_body,
            })
            logger.info('Admin notification sent: %s', subject)
        except Exception:
            logger.exception('Failed to send admin notification: %s', subject)

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()


def _user_info_html(user):
    """Generate HTML snippet for user info."""
    if not user:
        return '<p>申請者：匿名</p>'
    return (
        f'<p>申請者：{user.display_name or "未命名"}'
        f' (<code>{user.id}</code>)</p>'
    )


def notify_new_fictional_request(req):
    """Notify admins about a new fictional species request."""
    subject = f'[VTaxon] 新虛構物種申請：{req.name_zh or req.name_en or "未命名"}'
    html = f"""
    <h2>新虛構物種申請</h2>
    {_user_info_html(req.user)}
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      <tr><td><strong>中文名稱</strong></td><td>{req.name_zh or '-'}</td></tr>
      <tr><td><strong>英文名稱</strong></td><td>{req.name_en or '-'}</td></tr>
      <tr><td><strong>建議來源</strong></td><td>{req.suggested_origin or '-'}</td></tr>
      <tr><td><strong>建議子來源</strong></td><td>{req.suggested_sub_origin or '-'}</td></tr>
      <tr><td><strong>說明</strong></td><td>{req.description or '-'}</td></tr>
    </table>
    <p><a href="{ADMIN_PANEL_URL}/fictional-requests">前往管理後台審核</a></p>
    """
    send_admin_notification(subject, html)


def notify_new_breed_request(req):
    """Notify admins about a new breed request."""
    species_name = ''
    if req.species:
        species_name = req.species.common_name_zh or req.species.scientific_name or ''

    subject = f'[VTaxon] 新品種申請：{req.name_zh or req.name_en or "未命名"}'
    html = f"""
    <h2>新品種申請</h2>
    {_user_info_html(req.user)}
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      <tr><td><strong>中文名稱</strong></td><td>{req.name_zh or '-'}</td></tr>
      <tr><td><strong>英文名稱</strong></td><td>{req.name_en or '-'}</td></tr>
      <tr><td><strong>所屬物種</strong></td><td>{species_name} (taxon_id: {req.taxon_id or '-'})</td></tr>
      <tr><td><strong>說明</strong></td><td>{req.description or '-'}</td></tr>
    </table>
    <p><a href="{ADMIN_PANEL_URL}/breed-requests">前往管理後台審核</a></p>
    """
    send_admin_notification(subject, html)


def notify_new_report(report):
    """Notify admins about a new user report."""
    type_labels = {
        'impersonation': '冒充',
        'not_vtuber': '非 VTuber',
    }
    type_label = type_labels.get(report.report_type, report.report_type)

    reported_name = ''
    if report.reported_user:
        reported_name = report.reported_user.display_name or str(report.reported_user_id)

    subject = f'[VTaxon] 新檢舉：{type_label} — {reported_name}'
    html = f"""
    <h2>新使用者檢舉</h2>
    {_user_info_html(report.reporter)}
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      <tr><td><strong>檢舉類型</strong></td><td>{type_label}</td></tr>
      <tr><td><strong>被檢舉者</strong></td><td>{reported_name} (<code>{report.reported_user_id}</code>)</td></tr>
      <tr><td><strong>理由</strong></td><td>{report.reason}</td></tr>
      <tr><td><strong>證據連結</strong></td><td>{report.evidence_url or '-'}</td></tr>
    </table>
    <p><a href="{ADMIN_PANEL_URL}/reports">前往管理後台審核</a></p>
    """
    send_admin_notification(subject, html)
