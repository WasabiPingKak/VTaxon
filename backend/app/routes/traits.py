from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..extensions import db
from ..models import FictionalSpecies, SpeciesCache, VtuberTrait
from ..services.gbif import get_species

traits_bp = Blueprint('traits', __name__)


@traits_bp.route('', methods=['POST'])
@login_required
def create_trait():
    data = request.get_json() or {}

    taxon_id = data.get('taxon_id')
    fictional_species_id = data.get('fictional_species_id')
    display_name = data.get('display_name', '').strip()

    if not taxon_id and not fictional_species_id:
        return jsonify({'error': 'taxon_id or fictional_species_id required'}), 400
    if not display_name:
        return jsonify({'error': 'display_name is required'}), 400

    # Validate referenced species exist
    if taxon_id:
        species = db.session.get(SpeciesCache, taxon_id)
        if not species:
            # Try to fetch and cache from GBIF
            result = get_species(taxon_id)
            if not result:
                return jsonify({'error': 'Species not found in GBIF'}), 404

        # Check duplicate
        existing = VtuberTrait.query.filter_by(
            user_id=g.current_user_id, taxon_id=taxon_id).first()
        if existing:
            return jsonify({'error': 'You already have this species trait'}), 409

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
        display_name=display_name,
        trait_note=data.get('trait_note'),
    )
    db.session.add(trait)
    db.session.commit()

    return jsonify(trait.to_dict()), 201


@traits_bp.route('', methods=['GET'])
def list_traits():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id query parameter required'}), 400

    traits = VtuberTrait.query.filter_by(user_id=user_id).all()
    return jsonify({'traits': [t.to_dict() for t in traits]})


@traits_bp.route('/<trait_id>', methods=['DELETE'])
@login_required
def delete_trait(trait_id):
    trait = db.session.get(VtuberTrait, trait_id)
    if not trait:
        return jsonify({'error': 'Trait not found'}), 404
    if trait.user_id != g.current_user_id:
        return jsonify({'error': 'Not authorized to delete this trait'}), 403

    db.session.delete(trait)
    db.session.commit()
    return jsonify({'message': 'Trait deleted'}), 200
