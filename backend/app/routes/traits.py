from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..extensions import db
from ..models import FictionalSpecies, SpeciesCache, VtuberTrait
from ..services.gbif import get_species

traits_bp = Blueprint('traits', __name__)

ALLOWED_RANKS = {'ORDER', 'FAMILY', 'GENUS', 'SPECIES', 'SUBSPECIES', 'VARIETY'}


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
                    return jsonify({'error': 'You already have this species trait'}), 409

                existing_sp = et.species
                if not existing_sp or not existing_sp.taxon_path:
                    continue

                ex_path = existing_sp.taxon_path

                # New is descendant of existing (more specific) → replace existing
                if new_path.startswith(ex_path + '|'):
                    replaced_info = {
                        'replaced_trait_id': et.id,
                        'replaced_display_name': et.computed_display_name(),
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

    trait = VtuberTrait(
        user_id=g.current_user_id,
        taxon_id=taxon_id,
        fictional_species_id=fictional_species_id,
        breed_name=data.get('breed_name'),
        trait_note=data.get('trait_note'),
    )
    db.session.add(trait)
    db.session.commit()

    result = trait.to_dict()
    if replaced_info:
        result['replaced'] = replaced_info

    return jsonify(result), 201


@traits_bp.route('', methods=['GET'])
def list_traits():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id query parameter required'}), 400

    traits = VtuberTrait.query.filter_by(user_id=user_id).all()
    return jsonify({'traits': [t.to_dict() for t in traits]})


@traits_bp.route('/<trait_id>', methods=['PATCH'])
@login_required
def update_trait(trait_id):
    trait = db.session.get(VtuberTrait, trait_id)
    if not trait:
        return jsonify({'error': 'Trait not found'}), 404
    if str(trait.user_id) != str(g.current_user_id):
        return jsonify({'error': 'Not authorized to update this trait'}), 403

    data = request.get_json() or {}

    if 'breed_name' in data:
        trait.breed_name = data['breed_name']
    if 'trait_note' in data:
        trait.trait_note = data['trait_note']

    db.session.commit()
    return jsonify(trait.to_dict())


@traits_bp.route('/<trait_id>', methods=['DELETE'])
@login_required
def delete_trait(trait_id):
    trait = db.session.get(VtuberTrait, trait_id)
    if not trait:
        return jsonify({'error': 'Trait not found'}), 404
    if str(trait.user_id) != str(g.current_user_id):
        return jsonify({'error': 'Not authorized to delete this trait'}), 403

    db.session.delete(trait)
    db.session.commit()
    return jsonify({'message': 'Trait deleted'}), 200
