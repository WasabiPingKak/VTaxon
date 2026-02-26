import SpeciesSearch from '../components/SpeciesSearch';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

export default function SearchPage() {
  const { user } = useAuth();

  async function handleSelect(species) {
    if (!user) {
      alert('請先登入才能新增特徵');
      return;
    }
    try {
      await api.createTrait({
        taxon_id: species.taxon_id,
        display_name: species.common_name_zh || species.common_name_en || species.scientific_name,
      });
      alert('已新增特徵！');
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <h2>搜尋物種</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        使用 GBIF 資料庫搜尋現實世界物種。
        {user && '點擊「新增」將物種標記為你的角色特徵。'}
      </p>
      <SpeciesSearch onSelect={user ? handleSelect : null} />
    </div>
  );
}
