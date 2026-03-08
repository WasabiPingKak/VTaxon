from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..cache import invalidate_tree_cache, invalidate_fictional_tree_cache
from ..extensions import db
from ..models import Breed, FictionalSpecies, SpeciesCache, VtuberTrait
from ..services.gbif import get_species
from sqlalchemy import func

traits_bp = Blueprint('traits', __name__)

ALLOWED_RANKS = {'KINGDOM', 'PHYLUM', 'SUBPHYLUM', 'CLASS', 'SUBCLASS', 'ORDER', 'FAMILY', 'GENUS', 'SPECIES', 'SUBSPECIES', 'VARIETY', 'FORM'}


def _canonical_name(scientific_name):
    """Extract canonical name (genus + lowercase epithets), stripping author."""
    parts = scientific_name.split()
    canon = [parts[0]]
    for p in parts[1:]:
        if p[0].islower():
            canon.append(p)
        else:
            break
    return ' '.join(canon)


def _breed_matches_taxon(breed, taxon_id):
    """Check if a breed belongs to this taxon, tolerating GBIF key changes."""
    if breed.taxon_id == taxon_id:
        return True
    # Fallback: compare canonical scientific names
    sp = SpeciesCache.query.get(taxon_id)
    breed_sp = SpeciesCache.query.get(breed.taxon_id)
    if sp and breed_sp:
        return _canonical_name(sp.scientific_name) == _canonical_name(breed_sp.scientific_name)
    return False


@traits_bp.route('', methods=['POST'])
@login_required
def create_trait():
    data = request.get_json() or {}

    taxon_id = data.get('taxon_id')
    fictional_species_id = data.get('fictional_species_id')

    if not taxon_id and not fictional_species_id:
        return jsonify({'error': 'taxon_id or fictional_species_id required'}), 400

    replaced_info = None

    # Validate referenced species exist
    if taxon_id:
        species = db.session.get(SpeciesCache, taxon_id)
        if not species:
            # Try to fetch and cache from GBIF
            result = get_species(taxon_id)
            if not result:
                return jsonify({'error': 'Species not found in GBIF'}), 404
            species = db.session.get(SpeciesCache, taxon_id)

        # Rank restriction
        rank = (species.taxon_rank or '').upper() if species else ''
        if rank and rank not in ALLOWED_RANKS:
            return jsonify({
                'error': f'不支援此分類階層：{rank}。請選擇目(Order)到亞種(Subspecies)之間的階層。',
                'code': 'rank_not_allowed',
            }), 400

        new_path = species.taxon_path if species else None

        # Ancestor-descendant conflict detection using taxon_path prefix
        if new_path:
            existing_traits = VtuberTrait.query.filter_by(
                user_id=g.current_user_id,
            ).filter(
                VtuberTrait.taxon_id.isnot(None),
            ).all()

            for et in existing_traits:
                if et.taxon_id == taxon_id:
                    # Exact duplicate
                    return jsonify({'error': '你已經有這個物種的特徵了'}), 409

                existing_sp = et.species
                if not existing_sp or not existing_sp.taxon_path:
                    continue

                ex_path = existing_sp.taxon_path

                # New is descendant of existing (more specific) → replace existing
                if new_path.startswith(ex_path + '|'):
                    replaced_info = {
                        'replaced_trait_id': et.id,
                        'replaced_display_name': et.computed_display_name(),
                        'replaced_sort_order': et.sort_order,
                    }
                    db.session.delete(et)
                    break

                # New is ancestor of existing (less specific) → block
                if ex_path.startswith(new_path + '|'):
                    return jsonify({
                        'error': f'無法新增：你已經有「{et.computed_display_name()}」，範圍比這個更小更準確',
                        'code': 'ancestor_blocked',
                        'existing_display_name': et.computed_display_name(),
                    }), 409

    if fictional_species_id:
        fictional = db.session.get(FictionalSpecies, fictional_species_id)
        if not fictional:
            return jsonify({'error': 'Fictional species not found'}), 404

        existing = VtuberTrait.query.filter_by(
            user_id=g.current_user_id,
            fictional_species_id=fictional_species_id).first()
        if existing:
            return jsonify({'error': 'You already have this fictional species trait'}), 409

    # Validate breed_id if provided
    breed_id = data.get('breed_id')
    if breed_id:
        breed = db.session.get(Breed, breed_id)
        if not breed:
            return jsonify({'error': 'Breed not found'}), 404
        if taxon_id and not _breed_matches_taxon(breed, taxon_id):
            return jsonify({'error': 'Breed does not belong to this species'}), 400

    # Determine sort_order for new trait
    if replaced_info:
        new_sort_order = replaced_info['replaced_sort_order']
    else:
        max_order = db.session.query(func.max(VtuberTrait.sort_order)).filter_by(
            user_id=g.current_user_id).scalar()
        new_sort_order = (max_order + 1) if max_order is not None else 0

    trait = VtuberTrait(
        user_id=g.current_user_id,
        taxon_id=taxon_id,
        fictional_species_id=fictional_species_id,
        breed_id=breed_id,
        breed_name=data.get('breed_name') if not breed_id else None,
        trait_note=data.get('trait_note'),
        sort_order=new_sort_order,
    )
    db.session.add(trait)
    db.session.commit()
    invalidate_tree_cache()
    if fictional_species_id:
        invalidate_fictional_tree_cache()

    result = trait.to_dict()
    if replaced_info:
        result['replaced'] = replaced_info

    return jsonify(result), 201


@traits_bp.route('', methods=['GET'])
def list_traits():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id query parameter required'}), 400

    traits = VtuberTrait.query.filter_by(user_id=user_id).order_by(
        VtuberTrait.sort_order.asc()).all()
    return jsonify({'traits': [t.to_dict() for t in traits]})


@traits_bp.route('/reorder', methods=['PUT'])
@login_required
def reorder_traits():
    data = request.get_json() or {}
    ordered_ids = data.get('trait_ids', [])

    traits = VtuberTrait.query.filter_by(user_id=g.current_user_id).all()
    trait_map = {str(t.id): t for t in traits}

    if len(ordered_ids) != len(traits):
        return jsonify({'error': 'trait_ids count mismatch'}), 400

    for i, tid in enumerate(ordered_ids):
        trait = trait_map.get(str(tid))
        if not trait:
            return jsonify({'error': f'Trait {tid} not found'}), 400
        trait.sort_order = i

    db.session.commit()
    invalidate_tree_cache()
    invalidate_fictional_tree_cache()
    return jsonify({'message': 'ok'})


@traits_bp.route('/<trait_id>', methods=['PATCH'])
@login_required
def update_trait(trait_id):
    trait = db.session.get(VtuberTrait, trait_id)
    if not trait:
        return jsonify({'error': 'Trait not found'}), 404
    if str(trait.user_id) != str(g.current_user_id):
        return jsonify({'error': 'Not authorized to update this trait'}), 403

    data = request.get_json() or {}

    if 'breed_id' in data:
        breed_id = data['breed_id']
        if breed_id is not None:
            breed = db.session.get(Breed, breed_id)
            if not breed:
                return jsonify({'error': 'Breed not found'}), 404
            if trait.taxon_id and not _breed_matches_taxon(breed, trait.taxon_id):
                return jsonify({'error': 'Breed does not belong to this species'}), 400
        trait.breed_id = breed_id
        trait.breed_name = None  # clear legacy field when using breed_id
    elif 'breed_name' in data:
        trait.breed_name = data['breed_name']
    if 'trait_note' in data:
        trait.trait_note = data['trait_note']

    db.session.commit()
    invalidate_tree_cache()
    if trait.fictional_species_id:
        invalidate_fictional_tree_cache()
    return jsonify(trait.to_dict())


@traits_bp.route('/<trait_id>', methods=['DELETE'])
@login_required
def delete_trait(trait_id):
    trait = db.session.get(VtuberTrait, trait_id)
    if not trait:
        return jsonify({'error': 'Trait not found'}), 404
    if str(trait.user_id) != str(g.current_user_id):
        return jsonify({'error': 'Not authorized to delete this trait'}), 403

    had_fictional = trait.fictional_species_id is not None
    db.session.delete(trait)
    db.session.commit()
    invalidate_tree_cache()
    if had_fictional:
        invalidate_fictional_tree_cache()
    return jsonify({'message': 'Trait deleted'}), 200
