import type { ReactNode } from 'react';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthModal } from '../components/auth/AuthModal';
// Removed SolarSystemShowcase import because the button is being replaced by My predictions
import SunModel from '../components/three/SunModel';
import { AboutSection } from '../pages/Settings/AboutSection';
import TransitPage from '../pages/Transit/TransitPage';
import './DashboardLayout.css';
import ToastContainer from '../components/ui/ToastContainer';
const PlanetBuilderPanel = React.lazy(() => import('../components/three/PlanetBuilderPanel'));
import { listMyPredictions, deletePrediction } from '../services/exoplanetService';
import type { ViewPrediction } from '../types/prediction';

interface DashboardLayoutProps { children: ReactNode }

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'login' | 'signup'>('login');
  const [authUser, setAuthUser] = useState<any | null>(null);
  const openAuthModal = (view: 'login' | 'signup') => { setModalView(view); setIsModalOpen(true); };
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const [sunPhase, setSunPhase] = useState<'dashboard' | 'transit' | 'generator' | 'settings'>('dashboard');
  const [routePulseKey, setRoutePulseKey] = useState(0);
  const [sunMenuOpen, setSunMenuOpen] = useState(false);
  const [clickFlash, setClickFlash] = useState(false);
  const [transitOpen, setTransitOpen] = useState(false);
  const [transitActive, setTransitActive] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [myPredsOpen, setMyPredsOpen] = useState(false);
  const [myPredsLoading, setMyPredsLoading] = useState(false);
  const [myPreds, setMyPreds] = useState<ViewPrediction[]>([]);
  const [myPredsError, setMyPredsError] = useState<string | null>(null);
  const [selectedPred, setSelectedPred] = useState<ViewPrediction | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onOpen = () => setGeneratorOpen(true);
    // when generator is closed via global event we want the sun to animate back
    // to the dashboard position before removing the generator overlay. We reuse
    // the same staged sequence used by the left-panel close button so the sun
    // animates from its current position back to center.
    const onClose = () => {
      setLeftOpen(false);
      setIsClosing(true);
      setSunPhase('dashboard');
      closeTimeoutRef.current = window.setTimeout(() => {
        setIsClosing(false);
        setGeneratorOpen(false);
      }, 360);
    };
    window.addEventListener('open-generator', onOpen as EventListener);
    window.addEventListener('close-generator', onClose as EventListener);
    // listen for auth changes from the AuthModal or other parts of the app
    const onAuth = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && typeof detail === 'object') setAuthUser(detail.user ?? null);
      else setAuthUser(null);
    };
    window.addEventListener('auth-changed', onAuth as EventListener);

    // initialize auth state from localStorage token if present
    const token = localStorage.getItem('auth_token');
    if (token) setAuthUser({});
    return () => {
      window.removeEventListener('open-generator', onOpen as EventListener);
      window.removeEventListener('close-generator', onClose as EventListener);
      window.removeEventListener('auth-changed', onAuth as EventListener);
    };
  }, []);

  useEffect(() => { if (sunMenuOpen) setSunMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (generatorOpen) {
      window.setTimeout(() => setLeftOpen(true), 40);
    } else {
      setLeftOpen(false);
    }
  }, [generatorOpen]);

  // Derive sun phase from current route path
  useEffect(() => {
    const p = location.pathname;
    let phase: typeof sunPhase = 'dashboard';
  if (p.startsWith('/transit')) phase = 'transit';
    else if (p.startsWith('/generator')) phase = 'generator';
    else if (p.startsWith('/settings')) phase = 'settings';
    setSunPhase(phase);
    // trigger a small pulse animation key change
    setRoutePulseKey(prev => prev + 1);
  }, [location.pathname]);

  // If user opens generator via legacy custom event ensure route reflects it
  // NOTE: removed automatic navigation to /generator to keep generator in-layout
  // and avoid route changes. The generator is purely in-layout and controlled
  // by `generatorOpen` state.

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // keyboard shortcut for testing: press 'm' to toggle the sun menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') setSunMenuOpen(s => !s);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Ensure About overlay closes when leaving dashboard phase
  useEffect(() => {
    if (sunPhase !== 'dashboard' && aboutOpen) setAboutOpen(false);
  }, [sunPhase]);

  // Open transit panel (in-layout) with a linear, smooth reveal
  const openTransit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    // close other panels
    setSunMenuOpen(false);
    setGeneratorOpen(false);
    setLeftOpen(false);
    setTransitOpen(true);
    // small tick to allow initial paint then activate transitions
    window.setTimeout(() => setTransitActive(true), 40);
  };

  // Open generator panel in-layout
  const openGenerator = (e?: React.MouseEvent) => {
    e?.preventDefault();
    // close other panels
    setSunMenuOpen(false);
    setTransitOpen(false);
    setTransitActive(false);
    setGeneratorOpen(true);
    setSunPhase('generator');
    // open left options after a tick to allow CSS transitions
    window.setTimeout(() => setLeftOpen(true), 40);
  };

  // Staged close: move sun back to dashboard phase so CSS can animate it, then
  // remove the generator overlay after the transition completes.
  const stageCloseGenerator = () => {
    setLeftOpen(false);
    setIsClosing(true);
    setSunPhase('dashboard');
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsClosing(false);
      setGeneratorOpen(false);
      window.dispatchEvent(new CustomEvent('close-generator'));
    }, 360);
  };
  // note: closing handled inline where used (avoid unused fn)

  // Refresh when a prediction is saved via global events
  useEffect(() => {
    const onSaved = () => { if (myPredsOpen) void loadMyPreds(); };
    window.addEventListener('prediction:saved', onSaved as EventListener);
    return () => window.removeEventListener('prediction:saved', onSaved as EventListener);
  }, [myPredsOpen]);

  // Open My predictions when other parts of the app request it
  useEffect(() => {
    const onOpen = () => { openMyPreds(); };
    window.addEventListener('my-predictions:open', onOpen as EventListener);
    return () => window.removeEventListener('my-predictions:open', onOpen as EventListener);
  }, [authUser]);

  async function loadMyPreds() {
    setMyPredsLoading(true);
    setMyPredsError(null);
    try {
      const list = await listMyPredictions();
      setMyPreds(list);
    } catch (e: any) {
      setMyPredsError(e?.message ?? 'Failed to load predictions');
    } finally {
      setMyPredsLoading(false);
    }
  }

  function openMyPreds() {
    if (!authUser) {
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: 'Please log in to view your predictions.' } }));
      openAuthModal('login');
      return;
    }
    setMyPredsOpen(true);
    void loadMyPreds();
  }

  async function removePrediction(id: string) {
    try {
      await deletePrediction(id);
      setMyPreds(prev => prev.filter(p => p.id !== id));
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Prediction deleted' } }));
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: e?.message ?? 'Delete failed' } }));
    }
  }

  return (
    <div className={`dashboard-layout sun-phase-${sunPhase} ${generatorOpen ? 'generator-open' : ''} ${isClosing ? 'generator-closing' : ''} ${sunMenuOpen ? 'sun-menu-open' : ''} ${transitOpen ? 'transit-open' : ''} ${transitActive ? 'transit-active' : ''}`}>
      <header className="dashboard-header">
        <div className="header-left">
          <img
            src={new URL('../assets/NOISE/NoiseLogo.png', import.meta.url).href}
            alt="NOISE Logo"
            className="header-logo"
            role="button"
            tabIndex={0}
            onClick={() => {
              // navigate to home/dashboard and reset layout panels
              navigate('/');
              setGeneratorOpen(false);
              setLeftOpen(false);
              setTransitOpen(false);
              setTransitActive(false);
              setSunMenuOpen(false);
              setSunPhase('dashboard');
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/'); } }}
          />
        </div>

        <div className="header-center">
          <div className="planet-context-chip">
            <button
              className="planet-context-action"
              onClick={() => { openTransit(); setSunPhase('transit'); }}
              aria-label="Exoplanets"
              title="Exoplanets"
            >
              <span>Exoplanets Table</span>
            </button>
            <button
              className="planet-context-action"
              onClick={() => { openGenerator(); setSunPhase('generator'); }}
              aria-label="Generator"
              title="Generator"
            >
              <span>Exoplanets 3D</span>
            </button>
            {/* Replace Solar System button with My predictions, keeping styling */}
            <button
              className="planet-context-action"
              onClick={() => { openMyPreds(); }}
              aria-label="My predictions"
              title="My predictions"
            >
              <span>My predictions</span>
            </button>
          </div>
        </div>

        <div className="header-right">
          <nav className="auth-links">
            {authUser ? (
              <button className="auth-button" onClick={() => {
                // logout: clear token and notify listeners
                localStorage.removeItem('auth_token');
                setAuthUser(null);
                window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null } }));
                window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: 'Logged out' } }));
              }}>
                Exit
              </button>
            ) : (
              <>
                <button className="auth-link" onClick={() => openAuthModal('login')}>
                  Log-in
                </button>
                <button className="auth-button" onClick={() => openAuthModal('signup')}>
                  Sign-in
                </button>
              </>
            )}
          </nav>
        </div>
        {/* Removed the separate right-side My predictions button */}
      </header>
      <div className="space-bg" aria-hidden="true">
        <div className="stars-small" aria-hidden="true" />
        <div className="stars-large" aria-hidden="true" />
        <div className="space-particles" aria-hidden="true" />
      </div>
  <div key={routePulseKey} className="hero-overlay route-pulse" aria-hidden={transitActive}>
  <div className="background-word" data-text="ExoLens">ExoLens</div>
    <h1 className="hero-title">ExoLens</h1>
      </div>
      <div
        className={`sun-container-3d ${sunMenuOpen ? 'shift-right' : ''}`}
        aria-hidden="false"
        onClick={(e) => {
          if ((e.target as HTMLElement).classList.contains('sun-hit-target')) return; // button already handles
          if (generatorOpen) {
          // stage a smooth close so the sun animates back to center
          stageCloseGenerator();
          }
            console.log('[DashboardLayout] toggling sunMenu from container click ->', !sunMenuOpen);
            setSunMenuOpen(o => !o);
        }}
      >
        <button
          type="button"
          className="sun-hit-target"
          aria-label={sunMenuOpen ? 'Fechar menu de seções' : 'Abrir menu de seções'}
          title={sunMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={(e) => {
            e.stopPropagation();
            console.log('[DashboardLayout] sun-hit-target clicked ->', !sunMenuOpen);
            if (generatorOpen) {
                // stage close so sun returns to dashboard before overlay is removed
                stageCloseGenerator();
            }
            setSunMenuOpen(o => !o);
            setClickFlash(true);
            // shorter flash to match faster UI transitions
            window.setTimeout(() => setClickFlash(false), 360);
          }}
        />
        {clickFlash && <div className="sun-click-flash" aria-hidden />}
  <SunModel autoRotate={true} autoRotateSpeed={0.045} />

      </div>
      {/* In-layout Transit panel (slides in without route change) */}
      <div className={`transit-panel ${transitOpen ? 'open' : ''} ${transitActive ? 'active' : ''}`} aria-hidden={!transitOpen}>
        <div className="transit-panel-inner">
          <button className="transit-close" onClick={() => { setTransitActive(false); setSunPhase('dashboard'); setTimeout(() => setTransitOpen(false), 320); }} aria-label="Close Transits">×</button>
          <TransitPage />
        </div>
      </div>
      {/* Left options that slide in when generator opens */}
      <div className={`left-options ${leftOpen ? 'open' : ''}`} aria-hidden={!generatorOpen}>
        <button
          className="back-star"
          aria-label="Voltar"
          title="Voltar"
            onClick={() => {
            setLeftOpen(false);
            setIsClosing(true);
            setSunPhase('dashboard');
            // shorten the close delay to match new CSS close transitions
            closeTimeoutRef.current = window.setTimeout(() => {
              setIsClosing(false);
              setGeneratorOpen(false);
              window.dispatchEvent(new CustomEvent('close-generator'));
            }, 360);
          }}
        >
          {/* simple inline star SVG */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 2.5l2.6 5.3 5.8.8-4.2 3.9 1 5.7L12 16.9 6.8 18.2l1-5.7L3.6 8.6l5.8-.8L12 2.5z" fill="currentColor" />
          </svg>
        </button>

        <nav className="left-options-nav">
          <a className="option-btn" href="/transit" onClick={(e) => { e.preventDefault(); openTransit(e); }}>
            <svg className="option-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            View Transit
          </a>
          <a className="option-btn" href="/generator" onClick={(e) => { e.preventDefault(); openGenerator(e); }}>
            <svg className="option-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3 21l18-9L3 3v6l12 3-12 3v6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Generate Your Exoplanet
          </a>
        </nav>
      </div>
      {/* Generator full-screen panel (left menu + 3D preview) */}
      {generatorOpen && (
        <div className="generator-overlay" aria-hidden={!generatorOpen}>
          <Suspense fallback={<div className="generator-left" aria-hidden="true" /> }>
            <PlanetBuilderPanel />
          </Suspense>
        </div>
      )}
      <div className="dashboard-main">
        <main className="dashboard-content">{children}</main>
      </div>
      <AuthModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialView={modalView}
      />
      <ToastContainer />
      {/* Floating About button (bottom-left) - only on dashboard */}
      {sunPhase === 'dashboard' && (
        <button
          aria-label="Sobre ExoLens"
          title="Sobre ExoLens"
          onClick={() => setAboutOpen(true)}
          className="about-fab"
        >
          About
        </button>
      )}

      {aboutOpen && <AboutSection onClose={() => setAboutOpen(false)} />}
      {/* generator-screen removed: we now use left-options + animated sun for the entry flow */}
      {myPredsOpen && (
        <div role="dialog" aria-label="My predictions" className="modal-overlay" onClick={() => setMyPredsOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 840 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#e9f7ff' }}>My predictions</h3>
              <button onClick={() => setMyPredsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9fd8ff', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginTop: 12 }}>
              {myPredsLoading && <div style={{ color: '#cfe8f7' }}>Loading…</div>}
              {myPredsError && <div style={{ color: '#ffb3b3' }}>{myPredsError}</div>}
              {!myPredsLoading && !myPredsError && (
                <div style={{ display: 'grid', gap: 10 }}>
                  {myPreds.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.75)' }}>
                      You have no saved predictions yet. Run an analysis and click "Save prediction" to store it.
                    </div>
                  ) : (
                    myPreds.map(p => (
                      <div key={p.id} style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        padding: 12,
                        background: 'rgba(255,255,255,0.03)',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 8,
                      }}>
                        <div>
                          <div style={{ color: '#e6f7ff', fontWeight: 700 }}>{p.id}</div>
                          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{p.description}</div>
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>
                            Class: {p.classification} · Prob: {p.probability != null ? (p.probability * 100).toFixed(1) + '%' : '—'}
                            {p.kepid != null ? ` · KEPID: ${p.kepid}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedPred(p)}
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(123,228,255,0.2)', background: 'rgba(8,20,38,0.65)', color: '#e9f7ff', cursor: 'pointer' }}
                          >
                            View details
                          </button>
                          <button
                            onClick={() => removePrediction(p.id)}
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,105,105,0.25)', background: 'rgba(60,12,12,0.45)', color: '#ffd6d6', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedPred && (
        <div role="dialog" aria-label="Prediction details" className="modal-overlay" onClick={() => setSelectedPred(null)}>
          <div className="modal-card" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#e9f7ff' }}>Prediction details</h3>
              <button onClick={() => setSelectedPred(null)} style={{ background: 'transparent', border: 'none', color: '#9fd8ff', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginTop: 12, color: '#dff3ff', fontSize: 13 }}>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 8 }}>
{JSON.stringify(selectedPred, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
