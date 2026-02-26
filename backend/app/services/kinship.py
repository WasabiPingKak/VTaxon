from ..extensions import db
from ..models import FictionalSpecies, SpeciesCache, User, VtuberTrait


def compute_lcp_distance(path_a, path_b):
    """Compute distance between two materialized paths.

    Distance = total unique levels - shared prefix levels.
    Lower = more related.
    """
    if not path_a or not path_b:
        return None

    parts_a = path_a.split('|')
    parts_b = path_b.split('|')

    common = 0
    for a, b in zip(parts_a, parts_b):
        if a == b:
            common += 1
        else:
            break

    max_depth = max(len(parts_a), len(parts_b))
    return max_depth - common


def find_kinship(user_id, include_human=False, limit=10):
    """Find closest characters for each trait of the given user.

    Returns separate results for real species traits and fictional traits.
    """
    user_traits = VtuberTrait.query.filter_by(user_id=user_id).all()
    if not user_traits:
        return {'real': [], 'fictional': []}

    # Human taxon_id (Homo sapiens in GBIF = 2436436)
    HUMAN_TAXON_ID = 2436436

    real_results = []
    fictional_results = []

    for trait in user_traits:
        if trait.taxon_id:
            rankings = _rank_real_trait(
                trait, user_id, include_human, HUMAN_TAXON_ID, limit)
            real_results.append({
                'trait': trait.to_dict(),
                'rankings': rankings,
            })

        if trait.fictional_species_id:
            rankings = _rank_fictional_trait(trait, user_id, limit)
            fictional_results.append({
                'trait': trait.to_dict(),
                'rankings': rankings,
            })

    return {'real': real_results, 'fictional': fictional_results}


def _rank_real_trait(trait, user_id, include_human, human_taxon_id, limit):
    """Rank other characters by distance to this real species trait."""
    source_species = db.session.get(SpeciesCache, trait.taxon_id)
    if not source_species or not source_species.taxon_path:
        return []

    # Find all other traits with taxon_id set (excluding this user)
    query = VtuberTrait.query.filter(
        VtuberTrait.user_id != user_id,
        VtuberTrait.taxon_id.isnot(None),
    )

    if not include_human:
        query = query.filter(VtuberTrait.taxon_id != human_taxon_id)

    other_traits = query.all()

    rankings = []
    for other_trait in other_traits:
        other_species = db.session.get(SpeciesCache, other_trait.taxon_id)
        if not other_species or not other_species.taxon_path:
            continue

        distance = compute_lcp_distance(
            source_species.taxon_path, other_species.taxon_path)
        if distance is None:
            continue

        other_user = db.session.get(User, other_trait.user_id)
        rankings.append({
            'user': other_user.to_dict() if other_user else None,
            'trait': other_trait.to_dict(),
            'distance': distance,
        })

    rankings.sort(key=lambda x: x['distance'])
    return rankings[:limit]


def _rank_fictional_trait(trait, user_id, limit):
    """Rank other characters by distance to this fictional species trait."""
    source_fictional = db.session.get(FictionalSpecies,
                                      trait.fictional_species_id)
    if not source_fictional or not source_fictional.category_path:
        return []

    other_traits = VtuberTrait.query.filter(
        VtuberTrait.user_id != user_id,
        VtuberTrait.fictional_species_id.isnot(None),
    ).all()

    rankings = []
    for other_trait in other_traits:
        other_fictional = db.session.get(FictionalSpecies,
                                         other_trait.fictional_species_id)
        if not other_fictional or not other_fictional.category_path:
            continue

        distance = compute_lcp_distance(
            source_fictional.category_path, other_fictional.category_path)
        if distance is None:
            continue

        other_user = db.session.get(User, other_trait.user_id)
        rankings.append({
            'user': other_user.to_dict() if other_user else None,
            'trait': other_trait.to_dict(),
            'distance': distance,
        })

    rankings.sort(key=lambda x: x['distance'])
    return rankings[:limit]
