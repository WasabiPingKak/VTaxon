"""Directory facet / aggregation statistics."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import text

from ...extensions import db


def compute_facets() -> dict[str, Any]:
    """Compute aggregated facet statistics for the directory sidebar."""
    today_str = datetime.now(UTC).date().isoformat()
    facets: dict[str, Any] = {}

    # Country counts (unnest JSONB array)
    rows = db.session.execute(
        text(
            "SELECT UPPER(elem::text), COUNT(DISTINCT u.id) "
            "FROM users u, jsonb_array_elements_text(u.country_flags) AS elem "
            "GROUP BY 1"
        )
    ).fetchall()
    facets["country"] = {r[0]: r[1] for r in rows}

    # No-flag count
    facets["country_none"] = (
        db.session.execute(
            text(
                "SELECT COUNT(*) FROM users "
                "WHERE country_flags IS NULL "
                "OR country_flags = '[]'::jsonb "
                "OR country_flags::text = 'null'"
            )
        ).scalar()
        or 0
    )

    # Gender counts
    rows = db.session.execute(
        text(
            "SELECT "
            "  CASE "
            "    WHEN profile_data->>'gender' IS NULL "
            "      OR profile_data->>'gender' = '' THEN 'unset' "
            "    WHEN profile_data->>'gender' IN ('男','女') "
            "      THEN profile_data->>'gender' "
            "    ELSE 'other' "
            "  END, "
            "  COUNT(*) "
            "FROM users GROUP BY 1"
        )
    ).fetchall()
    facets["gender"] = {r[0]: r[1] for r in rows}

    # Status counts (with preparing→active auto-switch)
    rows = db.session.execute(
        text(
            "SELECT "
            "  CASE "
            "    WHEN profile_data->>'activity_status' = 'active' THEN 'active' "
            "    WHEN profile_data->>'activity_status' = 'preparing' "
            "      AND profile_data->>'debut_date' IS NOT NULL "
            "      AND profile_data->>'debut_date' <= :today THEN 'active' "
            "    WHEN profile_data->>'activity_status' = 'preparing' THEN 'preparing' "
            "    WHEN profile_data->>'activity_status' = 'hiatus' THEN 'hiatus' "
            "    ELSE '_none' "
            "  END, "
            "  COUNT(*) "
            "FROM users GROUP BY 1"
        ),
        {"today": today_str},
    ).fetchall()
    facets["status"] = {r[0]: r[1] for r in rows if r[0] != "_none"}

    # Org type counts
    rows = db.session.execute(text("SELECT COALESCE(org_type, 'indie'), COUNT(*) FROM users GROUP BY 1")).fetchall()
    facets["org_type"] = {r[0]: r[1] for r in rows}
    total_users = sum(facets["org_type"].values())

    # Platform counts
    rows = db.session.execute(
        text("SELECT provider, COUNT(DISTINCT user_id) FROM oauth_accounts GROUP BY provider")
    ).fetchall()
    facets["platform"] = {r[0]: r[1] for r in rows}

    # Has traits counts
    with_traits = db.session.execute(text("SELECT COUNT(DISTINCT user_id) FROM vtuber_traits")).scalar() or 0
    facets["has_traits"] = {
        "true": with_traits,
        "false": total_users - with_traits,
    }

    return facets
