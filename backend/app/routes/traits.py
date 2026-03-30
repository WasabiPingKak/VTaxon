from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..cache import invalidate_fictional_tree_cache, invalidate_tree_cache
from ..extensions import db
from ..models import Breed, FictionalSpecies, SpeciesCache, VtuberTrait
from ..services.gbif import get_species

traits_bp = Blueprint("traits", __name__)

ALLOWED_RANKS = {
    "SUBPHYLUM",
    "CLASS",
    "SUBCLASS",
    "INFRACLASS",
    "SUPERORDER",
    "ORDER",
    "SUBORDER",
    "INFRAORDER",
    "SUPERFAMILY",
    "FAMILY",
    "SUBFAMILY",
    "TRIBE",
    "SUBTRIBE",
    "GENUS",
    "SUBGENUS",
    "SPECIES",
    "SUBSPECIES",
    "VARIETY",
    "FORM",
}
BLOCKED_HIGH_RANKS = {"KINGDOM", "PHYLUM", "SUPERCLASS"}


def _canonical_name(scientific_name):
    """Extract canonical name (genus + lowercase epithets), stripping author."""
    parts = scientific_name.split()
    canon = [parts[0]]
    for p in parts[1:]:
        if p[0].islower():
            canon.append(p)
        else:
            break
    return " ".join(canon)


def _breed_matches_taxon(breed, taxon_id):
    """Check if a breed belongs to this taxon, tolerating GBIF key changes."""
    if breed.taxon_id == taxon_id:
        return True
    # Fallback: compare canonical scientific names
    sp = db.session.get(SpeciesCache, taxon_id)
    breed_sp = db.session.get(SpeciesCache, breed.taxon_id)
    if sp and breed_sp:
        return _canonical_name(sp.scientific_name) == _canonical_name(breed_sp.scientific_name)
    return False


@traits_bp.route("", methods=["POST"])
@login_required
def create_trait():
    """建立角色物種特徵。
    ---
    tags:
      - Traits
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            taxon_id:
              type: integer
              description: 現實物種 ID（與 fictional_species_id 二擇一）
            fictional_species_id:
              type: integer
              description: 虛構物種 ID（與 taxon_id 二擇一）
            breed_id:
              type: integer
            breed_name:
              type: string
            trait_note:
              type: string
    responses:
      201:
        description: 特徵已建立
      400:
        description: 驗證錯誤或分類階層不允許
      404:
        description: 物種或品種不存在
      409:
        description: 重複或祖先衝突
    """
    data = request.get_json() or {}

    taxon_id = data.get("taxon_id")
    fictional_species_id = data.get("fictional_species_id")

    if not taxon_id and not fictional_species_id:
        return jsonify({"error": "taxon_id or fictional_species_id required"}), 400

    replaced_info = None

    # Validate referenced species exist
    if taxon_id:
        species = db.session.get(SpeciesCache, taxon_id)
        if not species:
            # Try to fetch and cache from GBIF
            result = get_species(taxon_id)
            if not result:
                return jsonify({"error": "Species not found in GBIF"}), 404
            species = db.session.get(SpeciesCache, taxon_id)

        # Rank restriction: block Kingdom/Phylum/Class and other high ranks
        rank = (species.taxon_rank or "").upper() if species else ""
        if rank and (rank in BLOCKED_HIGH_RANKS or rank not in ALLOWED_RANKS):
            return jsonify(
                {
                    "error": f"不支援此分類階層：{rank}。請選擇目(Order)到亞種(Subspecies)之間的階層。",
                    "code": "rank_not_allowed",
                }
            ), 400

        new_path = species.taxon_path if species else None

        # Ancestor-descendant conflict detection using taxon_path prefix
        if new_path:
            existing_traits = (
                VtuberTrait.query.filter_by(
                    user_id=g.current_user_id,
                )
                .filter(
                    VtuberTrait.taxon_id.isnot(None),
                )
                .all()
            )

            for et in existing_traits:
                if et.taxon_id == taxon_id:
                    # Exact duplicate
                    return jsonify({"error": "你已經有這個物種的特徵了"}), 409

                existing_sp = et.species
                if not existing_sp or not existing_sp.taxon_path:
                    continue

                ex_path = existing_sp.taxon_path

                # New is descendant of existing (more specific) → replace existing
                if new_path.startswith(ex_path + "|"):
                    replaced_info = {
                        "replaced_trait_id": et.id,
                        "replaced_display_name": et.computed_display_name(),
                    }
                    db.session.delete(et)
                    break

                # New is ancestor of existing (less specific) → block
                if ex_path.startswith(new_path + "|"):
                    return jsonify(
                        {
                            "error": f"無法新增：你已經有「{et.computed_display_name()}」，範圍比這個更小更準確",
                            "code": "ancestor_blocked",
                            "existing_display_name": et.computed_display_name(),
                        }
                    ), 409

    if fictional_species_id:
        fictional = db.session.get(FictionalSpecies, fictional_species_id)
        if not fictional:
            return jsonify({"error": "Fictional species not found"}), 404

        new_path = fictional.category_path

        # Path conflict detection (same logic as real species)
        if new_path:
            existing_fictional_traits = (
                VtuberTrait.query.filter_by(
                    user_id=g.current_user_id,
                )
                .filter(
                    VtuberTrait.fictional_species_id.isnot(None),
                )
                .all()
            )

            for et in existing_fictional_traits:
                if et.fictional_species_id == fictional_species_id:
                    return jsonify({"error": "你已經有這個虛構物種的特徵了"}), 409

                ex_fictional = et.fictional
                if not ex_fictional or not ex_fictional.category_path:
                    continue
                ex_path = ex_fictional.category_path

                # New is descendant (more specific) → replace existing
                if new_path.startswith(ex_path + "|"):
                    replaced_info = {
                        "replaced_trait_id": et.id,
                        "replaced_display_name": ex_fictional.name_zh or ex_fictional.name,
                    }
                    db.session.delete(et)
                    break

                # New is ancestor (less specific) → block
                if ex_path.startswith(new_path + "|"):
                    return jsonify(
                        {
                            "error": f"無法新增：你已經有「{ex_fictional.name_zh or ex_fictional.name}」，範圍比這個更小更準確",
                            "code": "ancestor_blocked",
                            "existing_display_name": ex_fictional.name_zh or ex_fictional.name,
                        }
                    ), 409

    # Validate breed_id if provided
    breed_id = data.get("breed_id")
    if breed_id:
        breed = db.session.get(Breed, breed_id)
        if not breed:
            return jsonify({"error": "Breed not found"}), 404
        if taxon_id and not _breed_matches_taxon(breed, taxon_id):
            return jsonify({"error": "Breed does not belong to this species"}), 400

    trait = VtuberTrait(
        user_id=g.current_user_id,
        taxon_id=taxon_id,
        fictional_species_id=fictional_species_id,
        breed_id=breed_id,
        breed_name=data.get("breed_name") if not breed_id else None,
        trait_note=data.get("trait_note"),
    )
    db.session.add(trait)
    db.session.commit()
    invalidate_tree_cache()
    if fictional_species_id:
        invalidate_fictional_tree_cache()

    result = trait.to_dict()
    if replaced_info:
        result["replaced"] = replaced_info

    return jsonify(result), 201


@traits_bp.route("", methods=["GET"])
def list_traits():
    """列出指定使用者的物種特徵。
    ---
    tags:
      - Traits
    parameters:
      - name: user_id
        in: query
        type: string
        required: true
    responses:
      200:
        description: 特徵清單
        schema:
          type: object
          properties:
            traits:
              type: array
              items:
                type: object
      400:
        description: 缺少 user_id
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400

    traits = VtuberTrait.query.filter_by(user_id=user_id).all()
    return jsonify({"traits": [t.to_dict() for t in traits]})


@traits_bp.route("/<trait_id>", methods=["PATCH"])
@login_required
def update_trait(trait_id):
    """更新物種特徵（品種、備註）。
    ---
    tags:
      - Traits
    security:
      - BearerAuth: []
    parameters:
      - name: trait_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            breed_id:
              type: integer
            breed_name:
              type: string
            trait_note:
              type: string
    responses:
      200:
        description: 更新後的特徵
      403:
        description: 無權限
      404:
        description: 特徵不存在
    """
    trait = db.session.get(VtuberTrait, trait_id)
    if not trait:
        return jsonify({"error": "Trait not found"}), 404
    if str(trait.user_id) != str(g.current_user_id):
        return jsonify({"error": "Not authorized to update this trait"}), 403

    data = request.get_json() or {}

    if "breed_id" in data:
        breed_id = data["breed_id"]
        if breed_id is not None:
            breed = db.session.get(Breed, breed_id)
            if not breed:
                return jsonify({"error": "Breed not found"}), 404
            if trait.taxon_id and not _breed_matches_taxon(breed, trait.taxon_id):
                return jsonify({"error": "Breed does not belong to this species"}), 400
        trait.breed_id = breed_id
        trait.breed_name = None  # clear legacy field when using breed_id
    elif "breed_name" in data:
        trait.breed_name = data["breed_name"]
    if "trait_note" in data:
        trait.trait_note = data["trait_note"]

    db.session.commit()
    invalidate_tree_cache()
    if trait.fictional_species_id:
        invalidate_fictional_tree_cache()
    return jsonify(trait.to_dict())


@traits_bp.route("/<trait_id>", methods=["DELETE"])
@login_required
def delete_trait(trait_id):
    """刪除物種特徵。
    ---
    tags:
      - Traits
    security:
      - BearerAuth: []
    parameters:
      - name: trait_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: 特徵已刪除
      403:
        description: 無權限
      404:
        description: 特徵不存在
    """
    trait = db.session.get(VtuberTrait, trait_id)
    if not trait:
        return jsonify({"error": "Trait not found"}), 404
    if str(trait.user_id) != str(g.current_user_id):
        return jsonify({"error": "Not authorized to delete this trait"}), 403

    had_fictional = trait.fictional_species_id is not None

    # Clear live primary if this trait was the primary
    from ..models import User

    user = db.session.get(User, g.current_user_id)
    if user:
        if str(user.live_primary_real_trait_id) == str(trait_id):
            user.live_primary_real_trait_id = None
        if str(user.live_primary_fictional_trait_id) == str(trait_id):
            user.live_primary_fictional_trait_id = None

    db.session.delete(trait)
    db.session.commit()
    invalidate_tree_cache()
    if had_fictional:
        invalidate_fictional_tree_cache()
    return jsonify({"message": "Trait deleted"}), 200
