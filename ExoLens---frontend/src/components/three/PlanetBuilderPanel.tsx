import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import PlanetPreview3D from './PlanetPreview3D';

type PlanetData = {
  name?: string;
  mass?: number;
  radius?: number;
  color?: string;
  composition?: 'rocky' | 'gaseous' | 'icy';
};

function parseCSV(content: string): PlanetData | null {
  // very small CSV parser: assume header and single row with keys mass,radius,color
  const lines = content.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const vals = lines[1].split(',').map(v => v.trim());
  const out: any = {};
  headers.forEach((h, i) => { out[h] = vals[i]; });
  return { mass: out.mass ? Number(out.mass) : undefined, radius: out.radius ? Number(out.radius) : undefined, color: out.color, composition: (out.composition as any) };
}

export default function PlanetBuilderPanel({ onClose }: { onClose: () => void }) {
  const [planet, setPlanet] = useState<PlanetData>({ name: 'New World', mass: 1, radius: 1.0, color: '#d88', composition: 'rocky' });
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setError(null);
    const f = e.dataTransfer.files[0];
    if (!f) return setError('Nenhum arquivo encontrado');
    readFileAndProcess(f);
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const readFileAndProcess = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      try {
        if (f.name.toLowerCase().endsWith('.json')) {
          const data = JSON.parse(text);
          setPlanet({ name: data.name || 'Nome', mass: Number(data.mass) || undefined, radius: Number(data.radius) || undefined, color: data.color || '#d88', composition: (data.composition as any) || undefined });
        } else if (f.name.toLowerCase().endsWith('.csv')) {
          const parsed = parseCSV(text);
          if (!parsed) return setError('CSV inválido');
          setPlanet(parsed);
        } else {
          setError('Tipo de arquivo não suportado. Use JSON ou CSV.');
          return;
        }
  // Immediately show preview after successful import
  setPreviewReady(true);
  setIsGenerating(false);
      } catch (err) {
        setError('Erro ao ler arquivo');
      }
    };
    reader.readAsText(f);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return setError('Nenhum arquivo selecionado');
    setError(null);
    readFileAndProcess(f);
  };

  // Download a small JSON template the user can edit and re-upload
  const downloadTemplate = () => {
    const sample = { name: 'ExoPlanet-1', mass: 1, radius: 1, color: '#d88', composition: 'rocky' };
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'planet-template.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleSendClick = () => {
    // open the file picker
    inputRef.current?.click();
  };

  const ai = useMemo(() => {
    let prob = 0.05;
    if (planet.composition === 'rocky') prob += 0.18;
    if (planet.composition === 'gaseous') prob -= 0.02;
    if (planet.composition === 'icy') prob += 0.04;
    if (planet.mass) prob += Math.max(-0.05, Math.min(0.12, (planet.mass - 1) * 0.02));
    if (planet.radius) prob += Math.max(-0.05, Math.min(0.12, (1 - planet.radius) * 0.03));
    prob = Math.max(0, Math.min(0.99, prob));

    const dipDepth = Math.max(0.0005, Math.min(0.05, Math.pow((planet.radius ?? 1) / 10, 2)));
    const duration = Math.max(0.03, Math.min(0.25, (planet.radius ?? 1) * 0.02 + 0.05));

  const conclusion = prob > 0.66 ? 'Alta probabilidade de exoplaneta' : prob > 0.4 ? 'Moderada probabilidade de exoplaneta' : prob > 0.18 ? 'Baixa probabilidade de exoplaneta' : 'Probabilidade de exoplaneta muito baixa';


    return { probability: prob, conclusion, dipDepth, duration };
  }, [planet]);

  const lightCurve = useMemo(() => {
    // generate a synthetic light curve with a Gaussian-like transit dip
    const samples = 160;
    const arr: number[] = [];
    const center = 0.5;
    const sd = ai.duration / 2; // spread
    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1);
      const baseline = 1;
      const gauss = Math.exp(-0.5 * Math.pow((t - center) / sd, 2));
      const dip = ai.dipDepth * gauss;
      // add tiny observational noise
      const noise = (Math.random() - 0.5) * 0.0008;
      arr.push(Math.max(0, baseline - dip + noise));
    }
    return arr;
  }, [ai.dipDepth, ai.duration]);

  // Responsive badge positioning: measure preview-shell and compute positions around the planet
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [badgePositions, setBadgePositions] = useState<{ left: number; top: number; width?: number }[]>([
    { left: 48, top: 28, width: undefined },
    { left: 520 / 2 - 80, top: 20, width: 160 },
    { left: 520 - 48 - 160, top: 28, width: undefined },
  ]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      const w = rect.width || 520;
      const h = rect.height || 420;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.6; // radius around planet to place badges

      // angles for three badges (spread wider across the top)
      const angles = [-150, -90, -30].map(a => (a * Math.PI) / 180);
      const defaultWidth = 180;
      const positions = angles.map((ang, i) => {
        const bw = i === 1 ? defaultWidth : 160; // center badge wider
        const x = cx + r * Math.cos(ang) - bw / 2;
        const y = cy + r * Math.sin(ang) - 36; // lift badges a bit more
        return { left: Math.max(8, Math.round(x)), top: Math.max(8, Math.round(y)), width: bw };
      });
      setBadgePositions(positions);
    };

    // initial compute + responsive observer
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, []);

  // Generation state: initially only text; when a file is imported we show the 3D preview and charts
  const [previewReady, setPreviewReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLightCurveModal, setShowLightCurveModal] = useState(false);
  const [previewZoomed, setPreviewZoomed] = useState(false);

  // generation is now triggered by file import; keep ability to mark generating if needed

  const renderLightCurvePath = (data: number[], w = 520, h = 96) => {
    if (!data || data.length === 0) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const scaleY = (v: number) => {
      if (max === min) return h / 2;
      return h - ((v - min) / (max - min)) * h;
    };
    const scaleX = (i: number) => (i / (data.length - 1)) * w;
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i).toFixed(2)} ${scaleY(v).toFixed(2)}`).join(' ');
  };

  // (mini traces removed — only main light curve is displayed)

  return (
    <div className="generator-panel">
      <div className="generator-right" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {previewReady ? (
                  <button
                    onClick={() => {
                      // go back to the upload/drop screen
                      setPreviewReady(false);
                      setError(null);
                      setIsGenerating(false);
                      setPreviewZoomed(false);
                    }}
                    aria-label="Voltar para upload"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                  >
                    Selecionar outro arquivo
                  </button>
                ) : null}
                {previewReady ? (
                  <button
                    onClick={() => {
                      // open subtle light curve modal and enlarge preview
                      setShowLightCurveModal(true);
                      setPreviewZoomed(true);
                    }}
                    aria-label="Ver gráfico de luz"
                    style={{ marginLeft: 10, background: 'linear-gradient(90deg,#0b98c9,#7be4ff)', border: 'none', color: '#04202a', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                  >
                    Ver gráfico de luz
                  </button>
                ) : null}
              </div>
              <div>
                <button onClick={onClose} aria-label="Fechar" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 22 }}>×</button>
              </div>
            </div>
          {/* top explanatory text removed — replaced by animated connection badges */}
          {previewReady && (
            <div style={{ textAlign: 'center', marginTop: 6, marginBottom: 6 }}>
              <div style={{ color: '#cfe8f7', fontWeight: 800, fontSize: 18 }}>{planet.name ?? 'Planeta sem nome'}</div>
            </div>
          )}
          <div className="preview-shell" ref={previewRef} style={{ width: '100%', height: 640, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* If preview isn't ready show a central drag & drop / click input */}
            {!previewReady && (
              <div style={{ textAlign: 'center' }}>
                <input ref={inputRef} type="file" accept=".json,.csv,application/json,text/csv" onChange={onFileInput} style={{ display: 'none' }} />
                <div className="drop-area" onDragOver={(e) => e.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current?.click()} style={{ cursor: 'pointer', maxWidth: 680, margin: '0 auto', padding: 28, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)' }}>
                  <div style={{ color: '#ddd', marginBottom: 8, fontWeight: 700 }}>Arraste e solte seu arquivo aqui ou clique para selecionar</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12 }}>
                  <button onClick={downloadTemplate} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Download model</button>
                  <button onClick={handleSendClick} style={{ background: 'linear-gradient(90deg,#0b98c9,#7be4ff)', border: 'none', color: '#04202a', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Enviar</button>
                </div>
                {error && <div className="drop-error" style={{ marginTop: 8 }}>{error}</div>}
              </div>
            )}
            
            {previewReady && (
              <>
                <div style={{ position: 'relative', width: '100%', height: previewZoomed ? 680 : 480, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'height 300ms ease' }}>
                  <PlanetPreview3D color={planet.color} composition={planet.composition} radius={((planet.radius && Math.max(0.2, planet.radius)) || 1) * (previewZoomed ? 2.4 : 1.6)} />
                  {/* floating info badges (no connector lines) */}
                  <div className="preview-overlay" aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {badgePositions[0] && (
                    <div className="info-badge" style={{ position: 'absolute', left: "25%", top: 140, width: 160, pointerEvents: 'auto', transition: 'left 240ms, top 240ms, transform 180ms' }}>
                      <div style={{ fontWeight: 700 }}>Raio: {planet.radius ?? '—'}</div>
                      <div style={{ fontSize: 12 }}>O raio afeta diretamente a profundidade (dip ≈ {(ai.dipDepth * 100).toFixed(2)}%).</div>
                    </div>
                  )}
                  {badgePositions[1] && (
                    <div className="info-badge" style={{ position: 'absolute', left: "20%",bottom: 40, width: 180, pointerEvents: 'auto', transition: 'left 240ms, top 240ms, transform 180ms' }}>
                      <div style={{ fontWeight: 700 }}>Composição: {planet.composition}</div>
                      <div style={{ fontSize: 12 }}>A composição altera textura/espectro e ajuda a interpretar a curva observada.</div>
                    </div>
                  )}
                  {badgePositions[2] && (
                    <div className="info-badge" style={{ position: 'absolute', bottom: 40, right: "20%", width: 160, pointerEvents: 'auto', transition: 'left 240ms, top 240ms, transform 180ms', transform: 'translateY(-50%)' }}>
                      <div style={{ fontWeight: 700 }}>Massa: {planet.mass ?? '—'}</div>
                      <div style={{ fontSize: 12 }}>A curvatura/forma da queda indica influência da massa na duração do trânsito.</div>
                    </div>
                  )}
                  {/* Probabilidade de vida / exoplaneta abaixo do planeta (centralizada) */}
                  <div aria-live="polite" style={{ position: 'absolute', left: '50%', bottom: -60, transform: 'translateX(-50%)', zIndex: 40, pointerEvents: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(180deg, rgba(11,187,213,0.06), rgba(0,0,0,0.24))', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(11,187,213,0.10)', boxShadow: '0 8px 30px rgba(2,8,23,0.45)' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{Math.round(ai.probability * 100)}%</div>
                      <div style={{ fontSize: 12, color: '#cfe8f7', marginTop: 4, fontWeight: 700 }}>Probabilidade de exoplaneta</div>
                    </div>
                  </div>
                  </div>
                </div>
              </>
            )}

            {/* loading overlay while generating */}
            {isGenerating && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', color: '#fff', borderRadius: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Gerando planeta 3D...</div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>Isso pode levar alguns segundos</div>
                </div>
              </div>
            )}
          </div>
          <div style={{ width: '100%', maxWidth: 'min(1040px, 100%)', margin: '0 auto', padding: '0 12px', boxSizing: 'border-box' }}>

            {/* Light curve modal */}
            {showLightCurveModal && (
              <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,15,0.60)', zIndex: 1000 }}>
                <div style={{ width: 'min(1000px, 96%)', background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', borderRadius: 12, padding: 18, boxShadow: '0 12px 60px rgba(2,6,23,0.6)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, color: '#fff' }}>Gráfico de luz — {planet.name ?? 'Planeta'}</div>
                    <div>
                      <button onClick={() => { setShowLightCurveModal(false); setPreviewZoomed(false); }} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20 }}>×</button>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 12, border: '1px solid rgba(255,255,255,0.04)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}>
                    <svg width={'100%'} height={340} viewBox={`0 0 1040 340`} preserveAspectRatio="none">
                      <rect x={0} y={0} width={1040} height={340} fill="rgba(0,0,0,0)" />
                      <path d={renderLightCurvePath(lightCurve, 1040, 340)} stroke="#7be4ff" strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}