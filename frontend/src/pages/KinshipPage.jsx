import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function KinshipPage() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [includeHuman, setIncludeHuman] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId, includeHuman]);

  async function loadData() {
    setLoading(true);
    try {
      const [kinship, user] = await Promise.all([
        api.getKinship(userId, includeHuman),
        api.getUser(userId),
      ]);
      setData(kinship);
      setTargetUser(user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px', color: 'rgba(255,255,255,0.5)' }}>正在載入親緣資料…</p>;
  if (!data || !targetUser) return <p style={{ textAlign: 'center', marginTop: '40px', color: 'rgba(255,255,255,0.5)' }}>找不到該使用者。</p>;

  const hasResults = (data.real?.length > 0) || (data.fictional?.length > 0);

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <h2>{targetUser.display_name} 的親緣關係</h2>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
        <input type="checkbox" checked={includeHuman} onChange={(e) => setIncludeHuman(e.target.checked)} />
        包含人類（Homo sapiens）的比較結果
      </label>

      {!hasResults && (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>尚無親緣資料。此使用者需要先新增物種特徵。</p>
      )}

      {data.real?.map((group, i) => (
        <TraitGroup key={`real-${i}`} label="現實物種" group={group} />
      ))}

      {data.fictional?.map((group, i) => (
        <TraitGroup key={`fic-${i}`} label="奇幻生物" group={group} />
      ))}
    </div>
  );
}

function TraitGroup({ label, group }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ borderBottom: '2px solid #38bdf8', paddingBottom: '8px' }}>
        {label}：{group.trait.display_name}
      </h3>

      {group.rankings.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>找不到此特徵的相符角色。</p>
      ) : (
        <div>
          {group.rankings.map((r, idx) => (
            <div key={idx} style={{
              padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <Link to={`/kinship/${r.user?.id}`} style={{ textDecoration: 'none', color: '#e2e8f0' }}>
                  <strong>{r.user?.display_name || '未知'}</strong>
                </Link>
                <span style={{ marginLeft: '10px', color: 'rgba(255,255,255,0.45)' }}>
                  {r.trait.display_name}
                </span>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: '12px',
                background: r.distance <= 2 ? '#34d399' : r.distance <= 4 ? '#fbbf24' : '#f87171',
                color: '#0d1526', fontSize: '0.85em', fontWeight: 600,
              }}>
                距離：{r.distance}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
