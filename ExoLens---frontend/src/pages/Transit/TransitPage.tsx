import React, { useEffect, useMemo, useState } from 'react';
import './TransitPage.css';
import { fetchExoplanets, saveExoplanetPrediction, registerPrediction } from '../../services/exoplanetService';
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
    // react to login/logout events so the page updates without reload
    const onAuth = (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail;
      const user = detail?.user;
      const token = detail?.token;
      if (user && (user.id || user.userId)) {
        const id = user.id ?? user.userId;
        setIsLoggedIn(true);
        setUserId(id);
        setTab('my');
      } else if (token && typeof token === 'string') {
        // token-only login: try to read userId from localStorage if present
        const stored = localStorage.getItem('userId');
        if (stored) { setIsLoggedIn(true); setUserId(stored); setTab('my'); }
      } else {
        setIsLoggedIn(false);
        setUserId(null);
        setTab('all');
      }
    };
    window.addEventListener('auth-changed', onAuth as EventListener);
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
    // listen for CSV prediction events coming from PlanetBuilderPanel
    const onCsvPrediction = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail || !detail.result) return;
      const r = detail.result as any;
      // Map prediction response into a Transit-like object for preview
      const id = `user-csv-${Date.now()}`;
      const planet = (r.inputData?.description) || 'CSV prediction';
      const date = new Date().toISOString().slice(0,10);
      const depth = r.inputData?.signalParams?.transit_depth_value ? `${r.inputData.signalParams.transit_depth_value} ppm` : '—';
      const duration = r.inputData?.signalParams?.transit_duration_value ? `${r.inputData.signalParams.transit_duration_value} hr` : '—';
      const snr = r.inputData?.signalParams?.signal_to_noise ?? (r.finalProbability ? Math.round(r.finalProbability * 100) : 0);

      const transitRow: Transit = {
        id,
        planet,
        date,
        depth,
        duration,
        snr,
        owner: null,
        orbital_period: r.inputData?.signalParams?.orbital_period_value ?? undefined,
        transit_duration_hr: r.inputData?.signalParams?.transit_duration_value ?? undefined,
        transit_depth_ppm: r.inputData?.signalParams?.transit_depth_value ?? undefined,
        planet_radius_earth: r.inputData?.candidateParams?.radius_value ?? undefined,
        stellar_temp_k: r.inputData?.starParams?.effective_temperature_value ?? undefined,
        stellar_radius_solar: r.inputData?.starParams?.radius_value ?? undefined,
        stellar_mass_solar: r.inputData?.starParams?.mass_value ?? undefined,
        impact_parameter: r.inputData?.signalParams?.impact_parameter_value ?? undefined,
        equilibrium_temp: r.inputData?.candidateParams?.equilibrium_temp ?? undefined,
        stellar_density: undefined,
        duration_over_period: undefined,
        depth_per_planet_radius: undefined,
        signal_to_noise: r.inputData?.signalParams?.signal_to_noise ?? undefined,
      };

      // attach raw AI result so we can persist it when user saves
      (transitRow as any).aiExplain = { finalProbability: r.finalProbability, featureContributions: r.featureContributions };
      (transitRow as any).inputSnapshot = r.inputData;

      setRows(prev => {
        const next = [transitRow, ...prev];
        return next;
      });
      // open details for quick inspection
      setModalData(transitRow);
      setModalOpen(true);
    };
    window.addEventListener('prediction:csv', onCsvPrediction as EventListener);
    return () => { mounted = false; window.removeEventListener('prediction:csv', onCsvPrediction as EventListener); };
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
      // If this row represents an AI-prediction (has aiExplain/inputSnapshot), send full payload to register endpoint
      const aiExplain = (r as any).aiExplain;
      const inputSnapshot = (r as any).inputSnapshot;
      if (aiExplain && inputSnapshot) {
        // build RegisterPredicitionDTO-compatible payload
        const payload = {
          description: inputSnapshot.description ?? `Prediction from UI ${r.planet}`,
          probability: aiExplain.finalProbability ?? 0,
          classification: 'CANDIDATE',
          createdAt: new Date().toISOString(),
          starParams: {
            effective_temperature_value: inputSnapshot.starParams?.effective_temperature_value ?? null,
            effective_temperature_unit: inputSnapshot.starParams?.effective_temperature_unit ?? null,
            radius_value: inputSnapshot.starParams?.radius_value ?? null,
            radius_unit: inputSnapshot.starParams?.radius_unit ?? null,
            mass_value: inputSnapshot.starParams?.mass_value ?? null,
            mass_unit: inputSnapshot.starParams?.mass_unit ?? null,
            effective_temperature_error: null, mass_error: null, radius_error: null,
          },
          candidateParams: {
            radius_value: inputSnapshot.candidateParams?.radius_value ?? null,
            radius_unit: inputSnapshot.candidateParams?.radius_unit ?? null,
            equilibrium_temp: inputSnapshot.candidateParams?.equilibrium_temp ?? null,
            mass_value: null, mass_error: null, radius_error: null, mass_unit: null,
          },
          signalParams: {
            orbital_period_value: inputSnapshot.signalParams?.orbital_period_value ?? null,
            orbital_period_unit: inputSnapshot.signalParams?.orbital_period_unit ?? null,
            transit_duration_value: inputSnapshot.signalParams?.transit_duration_value ?? null,
            transit_duration_unit: inputSnapshot.signalParams?.transit_duration_unit ?? null,
            transit_depth_value: inputSnapshot.signalParams?.transit_depth_value ?? null,
            impact_parameter_value: inputSnapshot.signalParams?.impact_parameter_value ?? null,
            signal_to_noise: inputSnapshot.signalParams?.signal_to_noise ?? null,
            impact_parameter_error: null, orbital_period_error: null, transit_duration_error: null, transit_depth_error: null,
          },
          userId,
          aiExplain: aiExplain,
          inputSnapshot: inputSnapshot,
        };

        try {
          const created = await registerPrediction(payload);
          // mark as owned and replace in UI with server id if provided
          const owned: Transit = { ...r, owner: userId, id: created?.id ?? `user-${Date.now()}` };
          setRows(prev => {
            const found = prev.find(x => x.id === r.id);
            let next: Transit[];
            if (found) {
              next = prev.map(p => (p.id === r.id ? owned : p));
            } else {
              next = [{ ...owned }, ...prev];
            }
            persistStored(next);
            return next;
          });
          return;
        } catch (err) {
          console.warn('Register prediction failed, falling back to local save', err);
          window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Server save failed, saved locally instead' } }));
        }
      }

      // Fallback: existing behavior — call saveExoplanetPrediction for API items, otherwise save locally
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
            <button className={`tab ${tab === 'my' ? 'selected' : ''}`} onClick={() => setTab('my')}>My Predictions</button>
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
              <th style={{ width: 190 }}>Actions</th>
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
