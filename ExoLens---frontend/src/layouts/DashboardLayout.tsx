import type { ReactNode } from 'react';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthModal } from '../components/auth/AuthModal';
import SunModel from '../components/three/SunModel';
import { AboutSection } from '../pages/Settings/AboutSection';
import TransitPage from '../pages/Transit/TransitPage';
import './DashboardLayout.css';
// lazy-load heavy generator panel to avoid parsing/initializing Three.js until needed
const PlanetBuilderPanel = React.lazy(() => import('../components/three/PlanetBuilderPanel'));

interface DashboardLayoutProps { children: ReactNode }

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'login' | 'signup'>('login');
  const openAuthModal = (view: 'login' | 'signup') => { setModalView(view); setIsModalOpen(true); };
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [isAboutVisible, setAboutVisible] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const [sunPhase, setSunPhase] = useState<'dashboard' | 'transit' | 'generator' | 'settings'>('dashboard');
  const [routePulseKey, setRoutePulseKey] = useState(0);
  const [sunMenuOpen, setSunMenuOpen] = useState(false);
  const [clickFlash, setClickFlash] = useState(false);
  const [transitOpen, setTransitOpen] = useState(false);
  const [transitActive, setTransitActive] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onOpen = () => setGeneratorOpen(true);
    const onClose = () => setGeneratorOpen(false);
    window.addEventListener('open-generator', onOpen as EventListener);
    window.addEventListener('close-generator', onClose as EventListener);
    return () => {
      window.removeEventListener('open-generator', onOpen as EventListener);
      window.removeEventListener('close-generator', onClose as EventListener);
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

  // note: closing handled inline where used (avoid unused fn)

  return (
    <div className={`dashboard-layout sun-phase-${sunPhase} ${generatorOpen ? 'generator-open' : ''} ${isClosing ? 'generator-closing' : ''} ${sunMenuOpen ? 'sun-menu-open' : ''} ${transitOpen ? 'transit-open' : ''} ${transitActive ? 'transit-active' : ''}`}>
      <header className="dashboard-header">
        <img src={new URL('../assets/NOISE/NoiseLogo.png', import.meta.url).href} alt="NOISE Logo" className="header-logo" />
      </header>
       <nav className="auth-links">
        <button className="auth-link" onClick={() => openAuthModal('login')}>
          Log-in
        </button>
        <button className="auth-button" onClick={() => openAuthModal('signup')}>
          Sign-in
        </button>
      </nav>
      <div className="space-bg" aria-hidden="true">
        <div className="stars-small" aria-hidden="true" />
        <div className="stars-large" aria-hidden="true" />
        <div className="space-particles" aria-hidden="true" />
      </div>
  <div key={routePulseKey} className="hero-overlay route-pulse" aria-hidden={transitActive}>
        <h1 className="hero-title">ExoLens</h1>
        <p className="hero-subtitle">Leitor e gerador de exoplanetas — explore e crie mundos com base na composição planetária.</p>
        <div className="planet-context-chip">
          {sunPhase === 'dashboard' && <span>Visão Geral Solar</span>}
          {sunPhase === 'transit' && <span>Observando Trânsitos</span>}
          {sunPhase === 'generator' && <span>Gerando Exoplaneta</span>}
          {sunPhase === 'settings' && <span>Ajustes do Sistema</span>}
        </div>
      </div>
      <div
        className={`sun-container-3d ${sunMenuOpen ? 'shift-right' : ''}`}
        aria-hidden="false"
        onClick={(e) => {
          // Fallback: if click not captured by button (e.g. pointer-events issue), toggle here
          if ((e.target as HTMLElement).classList.contains('sun-hit-target')) return; // button already handles
          if (generatorOpen) {
            setGeneratorOpen(false);
            setLeftOpen(false);
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
              setGeneratorOpen(false);
              setLeftOpen(false);
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
      <div className={`sun-sections-menu ${sunMenuOpen ? 'open' : ''}`} aria-hidden={!sunMenuOpen}>
        <div className="sun-sections-inner">
          <div className="sun-menu-header">
            <span className="sun-menu-title">Seções</span>
            <button className="sun-menu-close" onClick={() => setSunMenuOpen(false)} aria-label="Fechar menu">×</button>
          </div>
          <nav className="sun-menu-nav">
              <a href="/dashboard" className="sun-menu-link">Dashboard</a>
              <a href="/transit" className="sun-menu-link" onClick={(e) => openTransit(e)}>Trânsitos</a>
              <a href="/generator" className="sun-menu-link" onClick={(e) => { e.preventDefault(); openGenerator(e); }}>Gerador</a>
              <a  href="/settings" className="sun-menu-link" onClick={(e) => { e.preventDefault(); setAboutVisible(true); }}>Configuração</a>
          </nav>
          {isAboutVisible && <AboutSection onClose={() => setAboutVisible(false)} />}
        </div>
      </div>
      {/* In-layout Transit panel (slides in without route change) */}
      <div className={`transit-panel ${transitOpen ? 'open' : ''} ${transitActive ? 'active' : ''}`} aria-hidden={!transitOpen}>
        <div className="transit-panel-inner">
          <button className="transit-close" onClick={() => { setTransitActive(false); setTimeout(() => setTransitOpen(false), 320); }} aria-label="Fechar Trânsitos">×</button>
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
            <PlanetBuilderPanel onClose={() => { setTransitOpen(false); setGeneratorOpen(false); setLeftOpen(false); setSunPhase('dashboard'); }} />
          </Suspense>
        </div>
      )}
      {/* Debug overlay: visible control to toggle sun menu and show state (temporary) */}
      <div className="debug-overlay" aria-hidden="false">
        <div className="debug-inner">
          <div>Sun menu: <strong>{sunMenuOpen ? 'OPEN' : 'closed'}</strong></div>
          {/* Small helper button to open the sun menu (useful on mobile/debug) */}
          <button
            className="mini-sun-open"
            onClick={() => setSunMenuOpen(true)}
            title="Abrir menu solar"
            aria-label="Abrir menu solar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
      <div className="dashboard-main">
        <main className="dashboard-content">{children}</main>
      </div>
      <AuthModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialView={modalView}
      />
      {/* generator-screen removed: we now use left-options + animated sun for the entry flow */}
    </div>
  );
}

export default DashboardLayout;
