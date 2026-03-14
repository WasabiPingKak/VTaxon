from datetime import datetime, timezone
from xml.etree.ElementTree import Element, SubElement, tostring

from flask import Blueprint, Response

from ..extensions import db
from ..models import User

seo_bp = Blueprint('seo', __name__)

SITE_URL = 'https://vtaxon.com'

STATIC_PAGES = [
    {'loc': '/',          'priority': '1.0', 'changefreq': 'daily'},
    {'loc': '/directory', 'priority': '0.9', 'changefreq': 'daily'},
    {'loc': '/search',    'priority': '0.7', 'changefreq': 'weekly'},
    {'loc': '/about',     'priority': '0.4', 'changefreq': 'monthly'},
    {'loc': '/privacy',   'priority': '0.2', 'changefreq': 'monthly'},
    {'loc': '/terms',     'priority': '0.2', 'changefreq': 'monthly'},
]

STATIC_LASTMOD = '2026-03-05'


@seo_bp.route('/sitemap.xml')
def sitemap():
    ns = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    urlset = Element('urlset', xmlns=ns)

    # Static pages
    for page in STATIC_PAGES:
        url_el = SubElement(urlset, 'url')
        SubElement(url_el, 'loc').text = f'{SITE_URL}{page["loc"]}'
        SubElement(url_el, 'lastmod').text = STATIC_LASTMOD
        SubElement(url_el, 'changefreq').text = page['changefreq']
        SubElement(url_el, 'priority').text = page['priority']

    # Dynamic VTuber profile pages
    users = db.session.execute(
        db.text('SELECT id, updated_at FROM users ORDER BY updated_at DESC')
    ).fetchall()

    for user in users:
        url_el = SubElement(urlset, 'url')
        SubElement(url_el, 'loc').text = f'{SITE_URL}/vtuber/{user.id}'
        if user.updated_at:
            ts = user.updated_at
            if isinstance(ts, str):
                SubElement(url_el, 'lastmod').text = ts[:10]
            else:
                SubElement(url_el, 'lastmod').text = ts.strftime('%Y-%m-%d')
        SubElement(url_el, 'changefreq').text = 'weekly'
        SubElement(url_el, 'priority').text = '0.7'

    xml_bytes = b'<?xml version="1.0" encoding="UTF-8"?>\n' + tostring(urlset, encoding='unicode').encode('utf-8')

    return Response(
        xml_bytes,
        mimetype='application/xml',
        headers={'Cache-Control': 'public, max-age=3600'},
    )
