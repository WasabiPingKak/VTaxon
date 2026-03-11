"""Public statistics endpoint."""

from flask import Blueprint, jsonify
from sqlalchemy import func, case, distinct, extract

from ..extensions import db
from ..models import User, VtuberTrait, SpeciesCache, FictionalSpecies, OAuthAccount
from ..cache import get_stats_cache, set_stats_cache

stats_bp = Blueprint('stats', __name__)


def _build_stats():
    """Build all statistics in a single function, cached server-side."""

    # ── Totals ──
    total_users = db.session.query(func.count(User.id)).scalar()
    tagged_users = db.session.query(
        func.count(distinct(VtuberTrait.user_id))
    ).scalar()
    species_used = db.session.query(
        func.count(distinct(VtuberTrait.taxon_id))
    ).filter(VtuberTrait.taxon_id.isnot(None)).scalar()
    fictional_used = db.session.query(
        func.count(distinct(VtuberTrait.fictional_species_id))
    ).filter(VtuberTrait.fictional_species_id.isnot(None)).scalar()

    # ── Top 10 species (by family, excluding Hominidae) ──
    top_species_q = db.session.execute(db.text("""
        SELECT sc.family,
               MAX(sc.path_zh->>'family') AS family_zh,
               COUNT(DISTINCT vt.user_id) AS count
        FROM species_cache sc
        JOIN vtuber_traits vt ON vt.taxon_id = sc.taxon_id
        WHERE sc.family IS NOT NULL
          AND sc.family != 'Hominidae'
        GROUP BY sc.family
        ORDER BY count DESC
        LIMIT 10
    """)).fetchall()
    top_species = [
        {'name': r[1] or r[0],
         'scientific_name': r[0], 'count': r[2]}
        for r in top_species_q
    ]

    # ── Top 10 fictional ──
    top_fictional_q = (
        db.session.query(
            FictionalSpecies.id,
            func.coalesce(FictionalSpecies.name_zh,
                          FictionalSpecies.name).label('name'),
            FictionalSpecies.origin,
            func.count(distinct(VtuberTrait.user_id)).label('count'),
        )
        .join(VtuberTrait,
              VtuberTrait.fictional_species_id == FictionalSpecies.id)
        .group_by(FictionalSpecies.id, FictionalSpecies.name_zh,
                  FictionalSpecies.name, FictionalSpecies.origin)
        .order_by(func.count(distinct(VtuberTrait.user_id)).desc())
        .limit(10)
        .all()
    )
    top_fictional = [
        {'id': r.id, 'name': r.name, 'origin': r.origin, 'count': r.count}
        for r in top_fictional_q
    ]

    # ── Real vs Fictional ratio (per user) ──
    # A user who has at least one real trait AND at least one fictional trait
    # counts as "both"; otherwise "real_only" or "fictional_only".
    ratio_q = db.session.execute(db.text("""
        WITH user_types AS (
            SELECT user_id,
                   bool_or(taxon_id IS NOT NULL) AS has_real,
                   bool_or(fictional_species_id IS NOT NULL) AS has_fictional
            FROM vtuber_traits
            GROUP BY user_id
        )
        SELECT
            COUNT(*) FILTER (WHERE has_real AND NOT has_fictional) AS real_only,
            COUNT(*) FILTER (WHERE NOT has_real AND has_fictional) AS fictional_only,
            COUNT(*) FILTER (WHERE has_real AND has_fictional) AS both
        FROM user_types
    """)).one()
    trait_type_ratio = {
        'real_only': ratio_q.real_only,
        'fictional_only': ratio_q.fictional_only,
        'both': ratio_q.both,
    }

    # ── Taxonomy distribution (kingdom → phylum → class → order → family → genus) ──
    taxonomy_q = db.session.execute(db.text("""
        SELECT COALESCE(sc.kingdom, '未分類'),
               COALESCE(MAX(sc.path_zh->>'kingdom'), sc.kingdom, '未分類'),
               COALESCE(sc.phylum, '未分類'),
               COALESCE(MAX(sc.path_zh->>'phylum'), sc.phylum, '未分類'),
               COALESCE(sc."class", '未分類'),
               COALESCE(MAX(sc.path_zh->>'class'), sc."class", '未分類'),
               COALESCE(sc.order_, '未分類'),
               COALESCE(MAX(sc.path_zh->>'order'), sc.order_, '未分類'),
               COALESCE(sc.family, '未分類'),
               COALESCE(MAX(sc.path_zh->>'family'), sc.family, '未分類'),
               COALESCE(sc.genus, '未分類'),
               COALESCE(MAX(sc.path_zh->>'genus'), sc.genus, '未分類'),
               COUNT(DISTINCT vt.user_id) AS count
        FROM species_cache sc
        JOIN vtuber_traits vt ON vt.taxon_id = sc.taxon_id
        WHERE sc.kingdom IS NOT NULL
        GROUP BY COALESCE(sc.kingdom, '未分類'),
                 COALESCE(sc.phylum, '未分類'),
                 COALESCE(sc."class", '未分類'),
                 COALESCE(sc.order_, '未分類'),
                 COALESCE(sc.family, '未分類'),
                 COALESCE(sc.genus, '未分類')
        ORDER BY count DESC
    """)).fetchall()
    taxonomy_distribution = [
        {
            'kingdom': r[0], 'kingdom_zh': r[1],
            'phylum': r[2], 'phylum_zh': r[3],
            'class': r[4], 'class_zh': r[5],
            'order': r[6], 'order_zh': r[7],
            'family': r[8], 'family_zh': r[9],
            'genus': r[10], 'genus_zh': r[11],
            'count': r[12],
        }
        for r in taxonomy_q
    ]

    # ── Platform distribution ──
    platform_q = (
        db.session.query(
            OAuthAccount.provider,
            func.count(distinct(OAuthAccount.user_id)).label('count'),
        )
        .group_by(OAuthAccount.provider)
        .all()
    )
    by_platform = {r.provider: r.count for r in platform_q}

    # ── Org type distribution ──
    org_q = (
        db.session.query(
            func.coalesce(User.org_type, 'unknown').label('org_type'),
            func.count().label('count'),
        )
        .group_by(func.coalesce(User.org_type, 'unknown'))
        .all()
    )
    by_org_type = {r.org_type: r.count for r in org_q}

    # ── Activity status distribution ──
    status_q = db.session.execute(db.text("""
        SELECT COALESCE(profile_data->>'activity_status', 'unknown') AS status,
               COUNT(*) AS cnt
        FROM users
        GROUP BY profile_data->>'activity_status'
    """)).fetchall()
    by_status = {r[0]: r[1] for r in status_q}

    # ── Average traits per user ──
    avg_q = db.session.query(
        func.count(VtuberTrait.id),
        func.count(distinct(VtuberTrait.user_id)),
    ).one()
    avg_traits = round(avg_q[0] / avg_q[1], 1) if avg_q[1] > 0 else 0

    return {
        'totals': {
            'users': total_users,
            'tagged_users': tagged_users,
            'species_used': species_used,
            'fictional_used': fictional_used,
        },
        'top_species': top_species,
        'top_fictional': top_fictional,
        'trait_type_ratio': trait_type_ratio,
        'taxonomy_distribution': taxonomy_distribution,
        'by_platform': by_platform,
        'by_org_type': by_org_type,
        'by_status': by_status,
        'avg_traits_per_user': avg_traits,
    }


@stats_bp.route('/overview')
def overview():
    cached = get_stats_cache()
    if cached:
        return jsonify(cached)

    data = _build_stats()
    set_stats_cache(data)
    return jsonify(data)
