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

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading kinship data...</p>;
  if (!data || !targetUser) return <p style={{ textAlign: 'center', marginTop: '40px' }}>User not found.</p>;

  const hasResults = (data.real?.length > 0) || (data.fictional?.length > 0);

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <h2>Kinship Results for {targetUser.display_name}</h2>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', cursor: 'pointer' }}>
        <input type="checkbox" checked={includeHuman} onChange={(e) => setIncludeHuman(e.target.checked)} />
        Include Homo sapiens comparisons
      </label>

      {!hasResults && (
        <p style={{ color: '#999' }}>No kinship data available. This user needs species traits first.</p>
      )}

      {data.real?.map((group, i) => (
        <TraitGroup key={`real-${i}`} label="Real Species" group={group} />
      ))}

      {data.fictional?.map((group, i) => (
        <TraitGroup key={`fic-${i}`} label="Fictional Species" group={group} />
      ))}
    </div>
  );
}

function TraitGroup({ label, group }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ borderBottom: '2px solid #4a90d9', paddingBottom: '8px' }}>
        {label}: {group.trait.display_name}
      </h3>

      {group.rankings.length === 0 ? (
        <p style={{ color: '#999' }}>No matching characters found for this trait.</p>
      ) : (
        <div>
          {group.rankings.map((r, idx) => (
            <div key={idx} style={{
              padding: '10px 14px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <Link to={`/kinship/${r.user?.id}`} style={{ textDecoration: 'none', color: '#333' }}>
                  <strong>{r.user?.display_name || 'Unknown'}</strong>
                </Link>
                <span style={{ marginLeft: '10px', color: '#888' }}>
                  {r.trait.display_name}
                </span>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: '12px',
                background: r.distance <= 2 ? '#27ae60' : r.distance <= 4 ? '#f39c12' : '#e74c3c',
                color: '#fff', fontSize: '0.85em',
              }}>
                Distance: {r.distance}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
