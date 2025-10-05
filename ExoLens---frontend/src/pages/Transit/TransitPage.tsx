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
        <h2>Observando Trânsitos</h2>
        <p className="muted">Análise de trânsitos detectados — visualize profundidade, duração e S/N.</p>
      </div>

      <div className="transit-table-wrapper">
        {/* Tabs when logged in: Meus trânsitos / Trânsitos gerais */}
        {isLoggedIn && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setTab('my')} style={{ padding: '6px 10px', borderRadius: 8, background: tab === 'my' ? '#0fb' : 'transparent', color: tab === 'my' ? '#001' : '#fff', border: '1px solid rgba(255,255,255,0.04)' }}>Meus trânsitos</button>
            <button onClick={() => setTab('all')} style={{ padding: '6px 10px', borderRadius: 8, background: tab === 'all' ? '#0fb' : 'transparent', color: tab === 'all' ? '#001' : '#fff', border: '1px solid rgba(255,255,255,0.04)' }}>Trânsitos</button>
          </div>
        )}

        <table className="transit-table" role="table">
          <thead>
            <tr>
              <th>Planeta</th>
              <th>Data</th>
              <th>Profundidade</th>
              <th>Duração</th>
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
                    <button onClick={() => alert(`Ver trânsito ${s.planet} (${s.date})`)}>Ver</button>
                    <button onClick={() => alert(`Salvar trânsito ${s.id}`)}>Salvar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* If logged in but no transits found, show a helpful message */}
        {isLoggedIn && tab === 'my' && SAMPLE.filter(s => s.owner && userId && s.owner === userId).length === 0 && (
          <div style={{ marginTop: 12, color: '#ddd' }}>Você ainda não tem trânsitos salvos. Faça upload ou crie um novo para vê-los aqui.</div>
        )}

        {/* If not logged in, show a hint to login to see "Meus trânsitos" */}
        {!isLoggedIn && (
          <div style={{ marginTop: 12, color: '#ddd' }}>Faça login para ver seus trânsitos pessoais. Atualmente você está visualizando trânsitos públicos.</div>
        )}
      </div>
    </div>
  );
};

export default TransitPage;
