import { useEffect, useState } from 'react';
import './TransitPage.css';

type Transit = { id: string; planet: string; date: string; depth: string; duration: string; snr: number; owner?: string };

// sample data; some items include an owner to demonstrate "Meus trânsitos"
const SAMPLE: Transit[] = [
  { id: 't1', planet: 'Kepler-62f', date: '2025-09-02', depth: '0.12%', duration: '3h 42m', snr: 12.3, owner: 'me' },
  { id: 't2', planet: 'TRAPPIST-1b', date: '2025-08-28', depth: '0.32%', duration: '1h 12m', snr: 23.1 },
  { id: 't3', planet: 'HD 209458 b', date: '2025-07-12', depth: '1.64%', duration: '2h 05m', snr: 45.9, owner: 'me' },
  { id: 't4', planet: 'GJ 1214 b', date: '2025-06-30', depth: '0.98%', duration: '1h 52m', snr: 18.7 },
];

const TransitPage: React.FC = () => {
  const [active, setActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<'my' | 'all'>('all');

  useEffect(() => {
    // trigger the animation on mount — slight delay to allow DOM paint
    const t = window.setTimeout(() => setActive(true), 50);
    // determine login from localStorage/session (fallback heuristic)
    const u = localStorage.getItem('userId') || localStorage.getItem('user') || localStorage.getItem('authUser') || sessionStorage.getItem('userId');
    if (u) {
      setIsLoggedIn(true);
      setUserId(u);
      setTab('my');
    } else {
      setIsLoggedIn(false);
      setUserId(null);
      setTab('all');
    }
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={`transit-page ${active ? 'active' : ''}`}>
      <div className="transit-intro" aria-hidden>
        <h2>Observing Transits</h2>
        <p className="muted">Analysis of detected transits — view depth, duration and S/N.</p>
      </div>

      <div className="transit-table-wrapper">
  {/* Tabs when logged in: My transits / All transits */}
        {isLoggedIn && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setTab('my')} style={{ padding: '6px 10px', borderRadius: 8, background: tab === 'my' ? 'rgba(255, 255, 255, 1)' : 'transparent', color: tab === 'my' ? '#001' : '#fff', border: '1px solid rgba(255,255,255,0.04)' }}>My transits</button>
            <button onClick={() => setTab('all')} style={{ padding: '6px 10px', borderRadius: 8, background: tab === 'all' ? 'rgba(255, 255, 255, 1)' : 'transparent', color: tab === 'all' ? '#001' : '#fff', border: '1px solid rgba(255,255,255,0.04)' }}>Transits</button>
          </div>
        )}

        <table className="transit-table" role="table">
          <thead>
            <tr>
              <th>Planet</th>
              <th>Date</th>
              <th>Depth</th>
              <th>Duration</th>
              <th>S/N</th>
              <th style={{ width: 160 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(tab === 'all' ? SAMPLE : SAMPLE.filter(s => s.owner && userId && s.owner === userId)).map((s) => (
              <tr key={s.id}>
                <td>{s.planet}</td>
                <td>{s.date}</td>
                <td>{s.depth}</td>
                <td>{s.duration}</td>
                <td>{s.snr.toFixed(1)}</td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => alert(`View transit ${s.planet} (${s.date})`)}>View</button>
                    <button onClick={() => alert(`Save transit ${s.id}`)}>Save</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* If logged in but no transits found, show a helpful message */}
        {isLoggedIn && tab === 'my' && SAMPLE.filter(s => s.owner && userId && s.owner === userId).length === 0 && (
          <div style={{ marginTop: 12, color: '#ddd' }}>You don't have any saved transits yet. Upload or create a new one to see them here.</div>
        )}

        {/* If not logged in, show a hint to login to see "Meus trânsitos" */}
        {!isLoggedIn && (
          <div style={{ marginTop: 12, color: '#ddd' }}>Log in to see your personal transits. You're currently viewing public transits.</div>
        )}
      </div>
    </div>
  );
};

export default TransitPage;
