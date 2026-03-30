"""Business logic for VTuber trait CRUD — validation, conflict detection, persistence."""

from ..cache import invalidate_fictional_tree_cache, invalidate_tree_cache
from ..extensions import db
from ..models import Breed, FictionalSpecies, SpeciesCache, User, VtuberTrait
from .gbif import get_species

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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


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
    sp = db.session.get(SpeciesCache, taxon_id)
    breed_sp = db.session.get(SpeciesCache, breed.taxon_id)
    if sp and breed_sp:
        return _canonical_name(sp.scientific_name) == _canonical_name(breed_sp.scientific_name)
    return False


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


def create_trait(user_id, data):
    """Validate and create a trait. Returns (result_dict, http_status)."""
    taxon_id = data.get("taxon_id")
    fictional_species_id = data.get("fictional_species_id")

    if not taxon_id and not fictional_species_id:
        return {"error": "taxon_id or fictional_species_id required"}, 400

    replaced_info = None

    # --- Real species validation ---
    if taxon_id:
        result = _validate_real_species(taxon_id, user_id)
        if result is None:
            return {"error": "Species not found in GBIF"}, 404
        err, replaced = result
        if err:
            return err
        replaced_info = replaced

    # --- Fictional species validation ---
    if fictional_species_id:
        result = _validate_fictional_species(fictional_species_id, user_id)
        if result is None:
            return {"error": "Fictional species not found"}, 404
        err, replaced = result
        if err:
            return err
        if replaced:
            replaced_info = replaced

    # --- Breed validation ---
    breed_id = data.get("breed_id")
    if breed_id:
        err = _validate_breed(breed_id, taxon_id)
        if err:
            return err

    # --- Persist ---
    trait = VtuberTrait(
        user_id=user_id,
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

    return result, 201


def _validate_real_species(taxon_id, user_id):
    """Validate a real species: existence, rank, ancestor/descendant conflicts.

    Returns None if species not found.
    Returns (error_tuple_or_None, replaced_info_or_None) otherwise.
    """
    species = db.session.get(SpeciesCache, taxon_id)
    if not species:
        gbif_result = get_species(taxon_id)
        if not gbif_result:
            return None
        species = db.session.get(SpeciesCache, taxon_id)

    # Rank restriction
    rank = (species.taxon_rank or "").upper() if species else ""
    if rank and (rank in BLOCKED_HIGH_RANKS or rank not in ALLOWED_RANKS):
        return (
            {
                "error": f"不支援此分類階層：{rank}。請選擇目(Order)到亞種(Subspecies)之間的階層。",
                "code": "rank_not_allowed",
            },
            400,
        ), None

    new_path = species.taxon_path if species else None
    if not new_path:
        return None, None

    # Ancestor-descendant conflict detection
    existing_traits = VtuberTrait.query.filter_by(user_id=user_id).filter(VtuberTrait.taxon_id.isnot(None)).all()

    replaced_info = None
    for et in existing_traits:
        if et.taxon_id == taxon_id:
            return ({"error": "你已經有這個物種的特徵了"}, 409), None

        existing_sp = et.species
        if not existing_sp or not existing_sp.taxon_path:
            continue
        ex_path = existing_sp.taxon_path

        # New is descendant (more specific) → replace existing
        if new_path.startswith(ex_path + "|"):
            replaced_info = {
                "replaced_trait_id": et.id,
                "replaced_display_name": et.computed_display_name(),
            }
            db.session.delete(et)
            break

        # New is ancestor (less specific) → block
        if ex_path.startswith(new_path + "|"):
            return (
                {
                    "error": f"無法新增：你已經有「{et.computed_display_name()}」，範圍比這個更小更準確",
                    "code": "ancestor_blocked",
                    "existing_display_name": et.computed_display_name(),
                },
                409,
            ), None

    return None, replaced_info


def _validate_fictional_species(fictional_species_id, user_id):
    """Validate a fictional species: existence, path conflicts.

    Returns None if species not found.
    Returns (error_tuple_or_None, replaced_info_or_None) otherwise.
    """
    fictional = db.session.get(FictionalSpecies, fictional_species_id)
    if not fictional:
        return None

    new_path = fictional.category_path
    if not new_path:
        return None, None

    existing_traits = (
        VtuberTrait.query.filter_by(user_id=user_id).filter(VtuberTrait.fictional_species_id.isnot(None)).all()
    )

    replaced_info = None
    for et in existing_traits:
        if et.fictional_species_id == fictional_species_id:
            return ({"error": "你已經有這個虛構物種的特徵了"}, 409), None

        ex_fictional = et.fictional
        if not ex_fictional or not ex_fictional.category_path:
            continue
        ex_path = ex_fictional.category_path

        if new_path.startswith(ex_path + "|"):
            replaced_info = {
                "replaced_trait_id": et.id,
                "replaced_display_name": ex_fictional.name_zh or ex_fictional.name,
            }
            db.session.delete(et)
            break

        if ex_path.startswith(new_path + "|"):
            return (
                {
                    "error": f"無法新增：你已經有「{ex_fictional.name_zh or ex_fictional.name}」，範圍比這個更小更準確",
                    "code": "ancestor_blocked",
                    "existing_display_name": ex_fictional.name_zh or ex_fictional.name,
                },
                409,
            ), None

    return None, replaced_info


def _validate_breed(breed_id, taxon_id):
    """Validate breed existence and taxon match. Returns error tuple or None."""
    breed = db.session.get(Breed, breed_id)
    if not breed:
        return {"error": "Breed not found"}, 404
    if taxon_id and not _breed_matches_taxon(breed, taxon_id):
        return {"error": "Breed does not belong to this species"}, 400
    return None


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


def update_trait(trait_id, user_id, data):
    """Validate and update a trait. Returns (result_dict, http_status)."""
    trait = db.session.get(VtuberTrait, trait_id)
    if not trait:
        return {"error": "Trait not found"}, 404
    if str(trait.user_id) != str(user_id):
        return {"error": "Not authorized to update this trait"}, 403

    if "breed_id" in data:
        breed_id = data["breed_id"]
        if breed_id is not None:
            err = _validate_breed(breed_id, trait.taxon_id)
            if err:
                return err
        trait.breed_id = breed_id
        trait.breed_name = None
    elif "breed_name" in data:
        trait.breed_name = data["breed_name"]
    if "trait_note" in data:
        trait.trait_note = data["trait_note"]

    db.session.commit()
    invalidate_tree_cache()
    if trait.fictional_species_id:
        invalidate_fictional_tree_cache()
    return trait.to_dict(), 200


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


def delete_trait(trait_id, user_id):
    """Delete a trait. Returns (result_dict, http_status)."""
    trait = db.session.get(VtuberTrait, trait_id)
    if not trait:
        return {"error": "Trait not found"}, 404
    if str(trait.user_id) != str(user_id):
        return {"error": "Not authorized to delete this trait"}, 403

    had_fictional = trait.fictional_species_id is not None

    user = db.session.get(User, user_id)
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
    return {"message": "Trait deleted"}, 200
