import React, { useEffect, useMemo, useRef, useState } from 'react';
import './PlanetBuilderPanel.css';
import PlanetPreview3D from './PlanetPreview3D';
import { fetchExoplanets, saveExoplanetPrediction } from '../../services/exoplanetService';
import type { Exoplanet, ExoplanetClassification } from '../../types/exoplanet';

type FilterOption = 'ALL' | 'CONFIRMED' | 'CANDIDATE' | 'FALSE POSITIVE' | 'OTHER';

type AnalysisSnapshot = {
  verdict: string;
  explanation: string[];
  timestamp: string;
};

type InfoBadge = {
  id: string;
  label: string;
  value: string;
  hint: string;
  style: React.CSSProperties;
  highlight?: boolean;
};

const FILTERS: { label: string; value: FilterOption }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Candidates', value: 'CANDIDATE' },
  { label: 'False positives', value: 'FALSE POSITIVE' },
  { label: 'Other', value: 'OTHER' },
];

function classificationKey(classification?: ExoplanetClassification | null): string {
  return (classification ?? '').trim().toUpperCase();
}

function probabilityToPercent(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value <= 1) return Math.max(0, Math.min(value, 1)) * 100;
  if (value <= 100) return value;
  return 100;
}

function safeNumber(value: number | null | undefined, fallback = 0): number {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatValue(value: number | null | undefined, unit?: string | null, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '—';
  const rounded = Number(value.toFixed(digits));
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}

function classificationToAppearance(classification?: ExoplanetClassification | null) {
  const key = classificationKey(classification);
  if (key === 'CONFIRMED') {
    return { color: '#6fd5ff', composition: 'rocky' as const };
  }
  if (key === 'FALSE POSITIVE') {
    return { color: '#ffb08a', composition: 'icy' as const };
  }
  if (key === 'CANDIDATE') {
    return { color: '#d58bff', composition: 'gaseous' as const };
  }
  return { color: '#d88', composition: 'gaseous' as const };
}

function mapExoplanetToPlanet(exoplanet: Exoplanet) {
  const appearance = classificationToAppearance(exoplanet.classification);
  const radius = safeNumber(exoplanet.radius_value ?? null, 1);
  const mass = safeNumber(exoplanet.mass_value ?? null, 0);

  return {
    name: exoplanet.id || exoplanet.description || 'Exoplanet',
    radius: Math.max(0.25, radius || 1),
    mass: mass || undefined,
    color: appearance.color,
    composition: appearance.composition,
  };
}

function filterPlanets(planets: Exoplanet[], filter: FilterOption): Exoplanet[] {
  if (filter === 'ALL') return planets;
  if (filter === 'OTHER') {
    return planets.filter((planet) => {
      const key = classificationKey(planet.classification);
      return key !== 'CONFIRMED' && key !== 'CANDIDATE' && key !== 'FALSE POSITIVE';
    });
  }
  return planets.filter((planet) => classificationKey(planet.classification) === filter);
}

function buildAnalysis(exoplanet: Exoplanet): AnalysisSnapshot {
  const probabilityPercent = probabilityToPercent(exoplanet.probability) ?? 0;
  const classification = classificationKey(exoplanet.classification);
  const orbitalPeriod = formatValue(exoplanet.orbital_period_value ?? null, exoplanet.orbital_period_unit ?? 'days');
  const transitDuration = formatValue(exoplanet.transit_duration_value ?? null, exoplanet.transit_duration_unit ?? 'hours');
  const radius = formatValue(exoplanet.radius_value ?? null, exoplanet.radius_unit ?? 'Earth Radius');
  const starTemp = formatValue(exoplanet.st_teff_value ?? null, exoplanet.st_teffunit ?? 'K', 0);

  let verdict: string;
  if (classification === 'CONFIRMED' || probabilityPercent >= 80) {
    verdict = 'High confidence exoplanet';
  } else if (classification === 'FALSE POSITIVE' || probabilityPercent < 30) {
    verdict = 'Low likelihood of exoplanet';
  } else {
    verdict = 'Needs additional confirmation';
  }

  const explanation: string[] = [
    `Probability score from archive data: ${probabilityPercent.toFixed(1)}%.`,
    `Classification provided by NASA archive: ${classification || 'Not specified'}.`,
    `Orbital period of ${orbitalPeriod} suggests the cadence of repeated transits.`,
    `Transit duration of ${transitDuration} and radius ${radius} inform the dip depth seen in the light curve.`,
    `Host star effective temperature near ${starTemp} shapes the transit signal-to-noise ratio.`,
  ];

  return {
    verdict,
    explanation,
    timestamp: new Date().toISOString(),
  };
}

function buildInfoBadges(exoplanet: Exoplanet): InfoBadge[] {
  const probabilityPercent = probabilityToPercent(exoplanet.probability);
  return [
    {
      id: 'radius',
      label: 'Radius',
      value: formatValue(exoplanet.radius_value ?? null, exoplanet.radius_unit ?? 'Earth Radius'),
      hint: 'Larger planets create deeper transit dips.',
      style: { left: '8%', top: '16%' } as React.CSSProperties,
    },
    {
      id: 'orbital_period',
      label: 'Orbital period',
      value: formatValue(exoplanet.orbital_period_value ?? null, exoplanet.orbital_period_unit ?? 'days'),
      hint: 'Determines how frequently the transit repeats.',
      style: { right: '8%', top: '20%' } as React.CSSProperties,
    },
    {
      id: 'transit_duration',
      label: 'Transit duration',
      value: formatValue(exoplanet.transit_duration_value ?? null, exoplanet.transit_duration_unit ?? 'hours'),
      hint: 'Longer durations stretch the transit trough.',
      style: { left: '9%', bottom: '26%' } as React.CSSProperties,
    },
    {
      id: 'star_temperature',
      label: 'Host star temperature',
      value: formatValue(exoplanet.st_teff_value ?? null, exoplanet.st_teffunit ?? 'K', 0),
      hint: 'Hotter stars can add noise to the light curve.',
      style: { right: '10%', bottom: '22%' } as React.CSSProperties,
    },
    {
      id: 'probability',
      label: 'Archive probability',
      value: probabilityPercent != null ? `${probabilityPercent.toFixed(1)}%` : '—',
      hint: 'Score reported by NASA archive for this candidate.',
      style: { left: '50%', bottom: '-50px', transform: 'translateX(-50%)' } as React.CSSProperties,
      highlight: true,
    },
  ];
}

export default function PlanetBuilderPanel() {
  const [exoplanets, setExoplanets] = useState<Exoplanet[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisSnapshot | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    console.debug('[PlanetBuilderPanel] mounted, preview ref:', previewRef.current);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setFetchError(null);

    fetchExoplanets()
      .then((planets) => {
        if (!mounted) return;
        setExoplanets(planets);
      })
      .catch((error) => {
        if (!mounted) return;
        setFetchError(error instanceof Error ? error.message : 'Failed to load exoplanets');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPlanets = useMemo(() => filterPlanets(exoplanets, filter), [exoplanets, filter]);

  useEffect(() => {
    setCurrentIndex(0);
    setAnalysis(null);
  }, [filter, filteredPlanets.length]);

  const currentPlanet = filteredPlanets[currentIndex] ?? null;
  const planetAppearance = useMemo(() => (currentPlanet ? mapExoplanetToPlanet(currentPlanet) : null), [currentPlanet]);
  const infoBadges = useMemo(() => (currentPlanet ? buildInfoBadges(currentPlanet) : []), [currentPlanet]);

  useEffect(() => {
    setAnalysis(null);
    setSaveStatus(null);
  }, [currentPlanet?.id]);

  useEffect(() => {
    if (planetAppearance) {
      console.debug('[PlanetBuilderPanel] rendered PlanetPreview3D for', currentPlanet?.id, 'appearance', planetAppearance);
    }
  }, [planetAppearance, currentPlanet?.id]);

  const handlePrev = () => {
    if (!filteredPlanets.length) return;
    setCurrentIndex((prev) => (prev - 1 + filteredPlanets.length) % filteredPlanets.length);
  };

  const handleNext = () => {
    if (!filteredPlanets.length) return;
    setCurrentIndex((prev) => (prev + 1) % filteredPlanets.length);
  };

  const handleRunAnalysis = () => {
    if (!currentPlanet) return;
    setAnalysisLoading(true);
    // Simulate a short delay to mirror a model request and improve UX feedback
    window.setTimeout(() => {
      setAnalysis(buildAnalysis(currentPlanet));
      setAnalysisLoading(false);
    }, 350);
  };

  const handleSavePrediction = async () => {
    if (!currentPlanet) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      await saveExoplanetPrediction(currentPlanet.id);
      setSaveStatus({ type: 'success', message: 'Prediction saved successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save prediction.';
      setSaveStatus({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const classificationLabel = classificationKey(currentPlanet?.classification) || 'Unknown';
  const probabilityPercent = probabilityToPercent(currentPlanet?.probability);

  if (loading) {
    return (
      <div className="generator-panel">
        <div className="generator-right" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, color: '#cfe8f7', fontWeight: 600 }}>Loading exoplanets…</div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="generator-panel">
        <div className="generator-right" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, color: '#ff9f9f', fontWeight: 600 }}>Unable to load exoplanets</div>
          <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.7)' }}>{fetchError}</div>
        </div>
      </div>
    );
  }

  if (!filteredPlanets.length) {
    return (
      <div className="generator-panel">
        <div className="generator-right" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, color: '#cfe8f7', fontWeight: 600 }}>No exoplanets found for this filter.</div>
          <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.7)' }}>Try selecting a different classification.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="generator-panel">
      <div className="generator-right" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FILTERS.map((filterOption) => {
                const isActive = filterOption.value === filter;
                return (
                  <button
                    key={filterOption.value}
                    onClick={() => setFilter(filterOption.value)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: '1px solid rgba(123, 228, 255, 0.18)',
                      background: isActive ? 'linear-gradient(92deg, rgba(11, 152, 201, 0.85), rgba(123, 228, 255, 0.85))' : 'rgba(8, 20, 38, 0.55)',
                      color: isActive ? '#041622' : '#f1fbff',
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      cursor: 'pointer',
                    }}
                  >
                    {filterOption.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleRunAnalysis}
                disabled={analysisLoading}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(123,228,255,0.2)',
                  background: analysisLoading ? 'rgba(8, 20, 38, 0.35)' : 'rgba(8, 20, 38, 0.65)',
                  color: '#f1fbff',
                  fontWeight: 600,
                  cursor: analysisLoading ? 'wait' : 'pointer',
                }}
              >
                {analysisLoading ? 'Running analysis…' : 'Run AI analysis'}
              </button>
              <button
                onClick={handleSavePrediction}
                disabled={saving}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(92deg, rgba(11,152,201,0.95), rgba(123,228,255,0.95))',
                  color: '#03121c',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  cursor: saving ? 'wait' : 'pointer',
                  boxShadow: '0 6px 18px rgba(11, 152, 201, 0.25)',
                }}
              >
                {saving ? 'Saving…' : 'Save prediction'}
              </button>
            </div>
          </header>

          <section
            ref={previewRef}
            className="preview-shell preview-fixed"
            style={{
              width: '100%',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {planetAppearance && (
              <div style={{ position: 'relative', width: '100%', height: 520, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <PlanetPreview3D
                  color={planetAppearance.color}
                  composition={planetAppearance.composition}
                  radius={planetAppearance.radius * 1.6}
                />

                <button
                  type="button"
                  aria-label="Show previous exoplanet"
                  onClick={handlePrev}
                  style={{
                    position: 'absolute',
                    left: 18,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(4, 12, 24, 0.65)',
                    color: '#f5faff',
                    fontSize: 28,
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(2,10,26,0.45)',
                  }}
                >
                  ‹
                </button>

                <button
                  type="button"
                  aria-label="Show next exoplanet"
                  onClick={handleNext}
                  style={{
                    position: 'absolute',
                    right: 18,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(4, 12, 24, 0.65)',
                    color: '#f5faff',
                    fontSize: 28,
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(2,10,26,0.45)',
                  }}
                >
                  ›
                </button>

                <div className="preview-overlay" aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {infoBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`info-badge${badge.highlight ? ' highlight' : ''}`}
                      style={{
                        position: 'absolute',
                        maxWidth: badge.highlight ? 220 : 180,
                        padding: badge.highlight ? '12px 16px' : '10px 14px',
                        borderRadius: 12,
                        background: badge.highlight
                          ? undefined
                          : 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.25))',
                        border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow: '0 8px 24px rgba(2,8,23,0.35)',
                        color: '#f5fbff',
                        pointerEvents: 'auto',
                        fontSize: 13,
                        lineHeight: 1.4,
                        ...badge.style,
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{badge.label}: {badge.value}</div>
                      <div style={{ fontSize: 12, opacity: 0.82 }}>{badge.hint}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.25))',
              borderRadius: 14,
              padding: 18,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 12px 32px rgba(2,8,23,0.35)',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f5fbff', marginBottom: 12 }}>Archive summary</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ color: 'rgba(207,232,247,0.92)', fontWeight: 600 }}>{currentPlanet?.id}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{currentPlanet?.description}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(11,187,213,0.15)',
                    border: '1px solid rgba(123,228,255,0.35)',
                    color: '#7be4ff',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                  }}>
                    {classificationLabel}
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.05)',
                    color: '#f5fbff',
                    fontSize: 12,
                  }}>
                    Probability: {probabilityPercent != null ? `${probabilityPercent.toFixed(1)}%` : '—'}
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.05)',
                    color: '#f5fbff',
                    fontSize: 12,
                  }}>
                    {currentPlanet?.existingData ? 'Existing dataset' : 'New ingestion'}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 8 }}>
                  Last updated {currentPlanet ? new Date(currentPlanet.createdAt).toLocaleString() : '—'}
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.25))',
              borderRadius: 14,
              padding: 18,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 12px 32px rgba(2,8,23,0.35)',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f5fbff', marginBottom: 12 }}>Planet metrics</div>
              <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, color: 'rgba(255,255,255,0.82)', fontSize: 13 }}>
                <dt>Mass</dt>
                <dd style={{ margin: 0 }}>{formatValue(currentPlanet?.mass_value ?? null, currentPlanet?.mass_unit ?? 'Jupiter Mass')}</dd>
                <dt>Radius</dt>
                <dd style={{ margin: 0 }}>{formatValue(currentPlanet?.radius_value ?? null, currentPlanet?.radius_unit ?? 'Earth Radius')}</dd>
                <dt>Transit duration</dt>
                <dd style={{ margin: 0 }}>{formatValue(currentPlanet?.transit_duration_value ?? null, currentPlanet?.transit_duration_unit ?? 'hours')}</dd>
                <dt>Orbit period</dt>
                <dd style={{ margin: 0 }}>{formatValue(currentPlanet?.orbital_period_value ?? null, currentPlanet?.orbital_period_unit ?? 'days')}</dd>
                <dt>Star mass</dt>
                <dd style={{ margin: 0 }}>{formatValue(currentPlanet?.st_mass_value ?? null, currentPlanet?.st_massunit ?? 'Solar Mass')}</dd>
                <dt>Star radius</dt>
                <dd style={{ margin: 0 }}>{formatValue(currentPlanet?.st_radius_value ?? null, currentPlanet?.st_radiusunit ?? 'Solar Radius')}</dd>
                <dt>Star temperature</dt>
                <dd style={{ margin: 0 }}>{formatValue(currentPlanet?.st_teff_value ?? null, currentPlanet?.st_teffunit ?? 'K', 0)}</dd>
              </dl>
            </div>

            <div style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.25))',
              borderRadius: 14,
              padding: 18,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 12px 32px rgba(2,8,23,0.35)',
              gridColumn: 'span 2',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f5fbff' }}>AI reasoning</div>
                {analysis && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                    Last run {new Date(analysis.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
              {analysis ? (
                <div style={{ display: 'grid', gap: 10, color: 'rgba(255,255,255,0.82)', fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: '#7be4ff' }}>{analysis.verdict}</div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                    {analysis.explanation.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                  Click “Run AI analysis” to generate a model summary explaining why this body is or is not considered an exoplanet candidate.
                </div>
              )}
              {saveStatus && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: saveStatus.type === 'success' ? 'rgba(52, 199, 89, 0.18)' : 'rgba(255, 95, 95, 0.2)',
                    border: saveStatus.type === 'success' ? '1px solid rgba(52,199,89,0.35)' : '1px solid rgba(255,95,95,0.35)',
                    color: saveStatus.type === 'success' ? '#c7f9d2' : '#ffd6d6',
                    fontSize: 13,
                  }}
                >
                  {saveStatus.message}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}