import React, { useEffect, useMemo, useState } from 'react';
import './TransitPage.css';
import { fetchExoplanets, saveExoplanetPrediction } from '../../services/exoplanetService';
import type { Exoplanet } from '../../types/exoplanet';

type Transit = {
  id: string;
  planet: string;
  date: string;
  // display-friendly fields
  depth: string;
  duration: string;
  snr: number;
  owner?: string | null;
  // full feature set (typed as numbers where appropriate)
  orbital_period?: number;
  transit_duration_hr?: number;
  transit_depth_ppm?: number;
  planet_radius_earth?: number;
  stellar_temp_k?: number;
  stellar_radius_solar?: number;
  stellar_mass_solar?: number;
  impact_parameter?: number;
  equilibrium_temp?: number;
  stellar_density?: number;
  duration_over_period?: number;
  depth_per_planet_radius?: number;
  signal_to_noise?: number;
};

// SAMPLE kept only as a last-resort fallback (network errors)
const SAMPLE: Transit[] = [];

const STORAGE_KEY = 'userPredictions_v1';

const TransitPage: React.FC = () => {
  const [active, setActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<'my' | 'all'>('all');
  const [rows, setRows] = useState<Transit[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Transit[];
      return stored.length ? stored : SAMPLE;
    } catch (e) {
      return SAMPLE;
    }
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Transit | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setActive(true), 50);
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

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const exos = await fetchExoplanets();
        if (!mounted) return;
        const mapped = exos.map(mapExoplanetToTransit);
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Transit[];
        const merged = mapped.concat(stored.filter(s => !mapped.find(m => m.id === s.id)));
        setRows(merged);
      } catch (err) {
        console.warn('Failed to load exoplanets, using local data', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  function mapExoplanetToTransit(e: Exoplanet): Transit {
    const planet = e.description || e.id;
    const date = e.createdAt ? new Date(e.createdAt).toISOString().slice(0, 10) : '—';
    let depth = '—';
    if (typeof e.radius_value === 'number' && typeof e.st_radius_value === 'number' && e.st_radius_value > 0) {
      const Rp = e.radius_value; 
      const Rs = e.st_radius_value * 109; 
      const frac = (Rp / Rs) ** 2;
      depth = `${(frac * 100).toFixed(3)}%`;
    }
    const duration = e.transit_duration_value ? `${e.transit_duration_value} ${e.transit_duration_unit ?? 'hr'}` : '—';
    const snr = (e.probability != null ? Math.max(1, Math.round((e.probability ?? 0) * 50)) : 0);
    return {
      id: e.id,
      planet,
      date,
      depth,
      duration,
      snr,
      owner: null,
      orbital_period: e.orbital_period_value ?? undefined,
      transit_duration_hr: e.transit_duration_value ?? undefined,
      transit_depth_ppm: undefined,
      planet_radius_earth: e.radius_value ?? undefined,
      stellar_temp_k: e.st_teff_value ?? undefined,
      stellar_radius_solar: e.st_radius_value ?? undefined,
      stellar_mass_solar: e.st_mass_value ?? undefined,
      impact_parameter: undefined,
      equilibrium_temp: undefined,
      stellar_density: undefined,
      duration_over_period: undefined,
      depth_per_planet_radius: undefined,
      signal_to_noise: e.probability ?? undefined,
    };
  }

  const visibleRows = useMemo(() => {
    if (tab === 'all') return rows;
    return rows.filter(r => r.owner && userId && r.owner === userId);
  }, [rows, tab, userId]);

  function persistStored(newRows: Transit[]) {
    const userSaved = newRows.filter(r => r.owner);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userSaved));
  }

  function handleSave(r: Transit) {
    if (!isLoggedIn || !userId) {
      window.alert('Log in to save predictions to your profile.');
      return;
    }

    const isApiItem = !r.id.startsWith('user-');
    (async () => {
      if (isApiItem) {
        try {
          await saveExoplanetPrediction(r.id);
        } catch (err) {
          console.warn('API save failed, saving locally', err);
        }
      }

      const owned: Transit = { ...r, owner: userId };
      setRows(prev => {
        const found = prev.find(x => x.id === owned.id);
        let next: Transit[];
        if (found) {
          next = prev.map(p => (p.id === owned.id ? owned : p));
        } else {
          const newId = String(owned.id ?? '').startsWith('user-') ? String(owned.id) : `user-${Date.now()}`;
          next = [{ ...owned, id: newId }, ...prev];
        }
        persistStored(next);
        return next;
      });
    })();
  }

  function handleDelete(r: Transit) {
    const isUserItem = !!r.owner || r.id.startsWith('user-');
    const confirmMsg = isUserItem
      ? 'Remover esta previsão do seu perfil? Esta ação não pode ser desfeita.'
      : 'Remover desta lista pública (temporário)?';
    if (!window.confirm(confirmMsg)) return;
    setRows(prev => {
      const next = prev.filter(p => p.id !== r.id);
      persistStored(next);
      return next;
    });
  }

  function openDetails(r: Transit) {
    setModalData(r);
    setModalOpen(true);
  }

  return (
    <div className={`transit-page ${active ? 'active' : ''}`}>
      <div className="transit-intro" aria-hidden>
        <h2>Observing Exoplanets</h2>
        <p className="muted">Minimal exoplanet listing — low-opacity background and subtle borders.</p>
      </div>

      <div className="transit-table-wrapper">
        {isLoggedIn && (
          <div className="tabs">
            <button className={`tab ${tab === 'my' ? 'selected' : ''}`} onClick={() => setTab('my')}>Minhas Predições</button>
            <button className={`tab ${tab === 'all' ? 'selected' : ''}`} onClick={() => setTab('all')}>Exoplanetas</button>
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
              <th style={{ width: 190 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((s) => (
              <tr key={s.id} className={s.owner ? 'owned' : ''}>
                <td className="planet">{s.planet}</td>
                <td>{s.date}</td>
                <td>{s.depth}</td>
                <td>{s.duration}</td>
                <td>{(s.snr ?? s.signal_to_noise ?? 0).toFixed(1)}</td>
                <td>
                  <div className="row-actions">
                    <button className="ghost" onClick={() => openDetails(s)}>Details</button>
                    <button className="ghost" onClick={() => handleSave(s)}>Save</button>
                    {(s.owner || String(s.id ?? '').startsWith('user-')) && (
                      <button className="danger" onClick={() => handleDelete(s)}>Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoggedIn && tab === 'my' && visibleRows.length === 0 && (
          <div className="hint">You don't have any saved predictions.</div>
        )}

        {!isLoggedIn && (
          <div className="hint">Log in to view and save your personal predictions.</div>
        )}
      </div>

      {modalOpen && modalData && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <header>
              <h3>Details — {modalData.planet}</h3>
              <button className="close" onClick={() => setModalOpen(false)}>✕</button>
            </header>
            <div className="modal-body">
              <dl>
                <dt>ID</dt><dd>{modalData.id}</dd>
                <dt>Planet</dt><dd>{modalData.planet}</dd>
                <dt>Date</dt><dd>{modalData.date}</dd>
                <dt>Depth</dt><dd>{modalData.depth}</dd>
                <dt>Duration</dt><dd>{modalData.duration}</dd>
                <dt>S/N</dt><dd>{(modalData.snr ?? modalData.signal_to_noise) ?? '—'}</dd>
                <dt>orbital_period</dt><dd>{modalData.orbital_period ?? '—'}</dd>
                <dt>transit_duration_hr</dt><dd>{modalData.transit_duration_hr ?? '—'}</dd>
                <dt>transit_depth_ppm</dt><dd>{modalData.transit_depth_ppm ?? '—'}</dd>
                <dt>planet_radius_earth</dt><dd>{modalData.planet_radius_earth ?? '—'}</dd>
                <dt>stellar_temp_k</dt><dd>{modalData.stellar_temp_k ?? '—'}</dd>
                <dt>stellar_radius_solar</dt><dd>{modalData.stellar_radius_solar ?? '—'}</dd>
                <dt>stellar_mass_solar</dt><dd>{modalData.stellar_mass_solar ?? '—'}</dd>
                <dt>impact_parameter</dt><dd>{modalData.impact_parameter ?? '—'}</dd>
                <dt>equilibrium_temp</dt><dd>{modalData.equilibrium_temp ?? '—'}</dd>
                <dt>stellar_density</dt><dd>{modalData.stellar_density ?? '—'}</dd>
                <dt>duration_over_period</dt><dd>{modalData.duration_over_period ?? '—'}</dd>
                <dt>depth_per_planet_radius</dt><dd>{modalData.depth_per_planet_radius ?? '—'}</dd>
                <dt>signal_to_noise</dt><dd>{modalData.signal_to_noise ?? '—'}</dd>
                <dt>owner</dt><dd>{modalData.owner ?? '—'}</dd>
              </dl>
            </div>
            <footer>
              <button onClick={() => { handleSave(modalData); setModalOpen(false); }} className="primary">Save</button>
              <button onClick={() => setModalOpen(false)} className="ghost">Close</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransitPage;
