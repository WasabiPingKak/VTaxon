import SpeciesSearch from '../components/SpeciesSearch';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

export default function SearchPage() {
  const { user } = useAuth();

  async function handleSelect(species) {
    if (!user) {
      alert('Please sign in to add traits.');
      return;
    }
    try {
      await api.createTrait({
        taxon_id: species.taxon_id,
        display_name: species.common_name_en || species.scientific_name,
      });
      alert('Trait added!');
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <h2>Search Species</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Search for real-world species using the GBIF database.
        {user && ' Click "Add" to tag a species as your character trait.'}
      </p>
      <SpeciesSearch onSelect={user ? handleSelect : null} />
    </div>
  );
}
