"""SSR meta tag injection for SEO.

Serves the SPA index.html with user-specific <head> meta tags
so crawlers (Discord, LINE, Facebook, Google) see correct previews.
"""

import json
import logging
import os
import re
import time

import requests as http_requests
from flask import Blueprint, Response

from ..extensions import db
from ..models import User, VtuberTrait

logger = logging.getLogger(__name__)

ssr_bp = Blueprint("ssr", __name__)

SITE_URL = "https://vtaxon.com"
DEFAULT_OG_IMAGE = f"{SITE_URL}/og-default.png"
DEFAULT_DESCRIPTION = "VTaxon — 將 VTuber 角色形象對應到生物分類學體系，以分類樹呈現角色之間的關聯。"

# --- SPA HTML cache ---

_spa_html_cache = None
_spa_html_cache_time = 0
_SPA_CACHE_TTL = 3600  # 1 hour


def _get_frontend_url():
    """Derive the frontend URL from ALLOWED_ORIGINS env var."""
    origins = os.environ.get("ALLOWED_ORIGINS", "")
    if origins:
        return origins.split(",")[0].strip()
    return "http://localhost:5173"


def _fetch_spa_html():
    """Fetch and cache the SPA index.html from the frontend."""
    global _spa_html_cache, _spa_html_cache_time

    now = time.time()
    if _spa_html_cache and (now - _spa_html_cache_time) < _SPA_CACHE_TTL:
        return _spa_html_cache

    frontend_url = _get_frontend_url()
    try:
        resp = http_requests.get(
            f"{frontend_url}/index.html",
            timeout=10,
            headers={"User-Agent": "VTaxon-SSR/1.0"},
        )
        resp.raise_for_status()
        _spa_html_cache = resp.text
        _spa_html_cache_time = now
        logger.info("Fetched SPA index.html from %s", frontend_url)
        return _spa_html_cache
    except http_requests.RequestException:
        logger.exception("Failed to fetch SPA index.html from %s", frontend_url)
        if _spa_html_cache:
            return _spa_html_cache
        return None


# --- Meta tag injection ---


def _escape_html(text):
    """Escape HTML special characters for safe attribute insertion."""
    return text.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


def _build_species_description(user, traits):
    """Build a description string from user bio and species traits."""
    display_name = user.display_name or "VTuber"

    if user.bio:
        bio_short = user.bio[:120].replace("\n", " ")
        if len(user.bio) > 120:
            bio_short += "…"
        return f"{display_name} — {bio_short}"

    species_names = []
    for t in traits:
        if t.species:
            name = t.species.common_name_zh or t.species.scientific_name
            species_names.append(name)
        if t.fictional:
            name = t.fictional.name_zh or t.fictional.name
            species_names.append(name)

    if species_names:
        joined = "、".join(species_names)
        return f"{display_name} 的 VTuber 角色檔案 — 物種：{joined}"

    return f"{display_name} 的 VTuber 角色檔案"


def _build_json_ld(user, user_id):
    """Build JSON-LD structured data for a user profile."""
    ld = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "mainEntity": {
            "@type": "Person",
            "name": user.display_name or "VTuber",
            "url": f"{SITE_URL}/vtuber/{user_id}",
        },
    }
    if user.avatar_url:
        ld["mainEntity"]["image"] = user.avatar_url
    return json.dumps(ld, ensure_ascii=False)


def _inject_meta_tags(html, *, title, description, image, url, json_ld):
    """Replace default meta tags in the SPA HTML with user-specific values."""
    title_full = f"{_escape_html(title)} | VTaxon"
    desc_safe = _escape_html(description)
    image_safe = _escape_html(image)
    url_safe = _escape_html(url)

    # Replace <title>
    html = re.sub(r"<title>[^<]*</title>", f"<title>{title_full}</title>", html)

    # Replace meta description
    html = re.sub(
        r'<meta\s+name="description"\s+content="[^"]*"\s*/?>',
        f'<meta name="description" content="{desc_safe}" />',
        html,
    )

    # Replace canonical URL
    html = re.sub(
        r'<link\s+rel="canonical"\s+href="[^"]*"\s*/?>',
        f'<link rel="canonical" href="{url_safe}" />',
        html,
    )

    # Replace og: tags
    og_replacements = {
        "og:title": title_full,
        "og:description": desc_safe,
        "og:image": image_safe,
        "og:url": url_safe,
        "og:type": "profile",
    }
    for prop, value in og_replacements.items():
        html = re.sub(
            rf'<meta\s+property="{re.escape(prop)}"\s+content="[^"]*"\s*/?>',
            f'<meta property="{prop}" content="{value}" />',
            html,
        )

    # Replace twitter: tags
    twitter_replacements = {
        "twitter:title": title_full,
        "twitter:description": desc_safe,
        "twitter:image": image_safe,
    }
    for name, value in twitter_replacements.items():
        html = re.sub(
            rf'<meta\s+name="{re.escape(name)}"\s+content="[^"]*"\s*/?>',
            f'<meta name="{name}" content="{value}" />',
            html,
        )

    # Replace og:image:alt
    html = re.sub(
        r'<meta\s+property="og:image:alt"\s+content="[^"]*"\s*/?>',
        f'<meta property="og:image:alt" content="{title_full}" />',
        html,
    )

    # Inject JSON-LD before </head>
    if json_ld:
        json_ld_tag = f'<script type="application/ld+json">{json_ld}</script>'
        html = html.replace("</head>", f"{json_ld_tag}\n</head>")

    return html


# --- Route ---


@ssr_bp.route("/<user_id>")
def vtuber_profile_ssr(user_id):
    """VTuber 個人頁面 SSR（注入 meta tag 供爬蟲使用）。
    ---
    tags:
      - SSR
    produces:
      - text/html
    parameters:
      - name: user_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: 含 meta tag 的 SPA HTML
      503:
        description: 無法取得前端 HTML
    """
    spa_html = _fetch_spa_html()
    if not spa_html:
        return Response("Service temporarily unavailable", status=503)

    user = db.session.get(User, user_id)
    if not user:
        # User not found — return SPA with default meta tags
        # (React Router will show 404 UI)
        return Response(spa_html, mimetype="text/html")

    traits = VtuberTrait.query.filter_by(user_id=user_id).all()

    title = user.display_name or "VTuber"
    description = _build_species_description(user, traits)
    image = user.avatar_url or DEFAULT_OG_IMAGE
    url = f"{SITE_URL}/vtuber/{user_id}"
    json_ld = _build_json_ld(user, user_id)

    result_html = _inject_meta_tags(
        spa_html,
        title=title,
        description=description,
        image=image,
        url=url,
        json_ld=json_ld,
    )

    return Response(
        result_html,
        mimetype="text/html",
        headers={"Cache-Control": "public, max-age=300"},
    )
