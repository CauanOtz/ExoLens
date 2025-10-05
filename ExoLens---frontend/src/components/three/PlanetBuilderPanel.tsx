import React, { useCallback, useState } from 'react';
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
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      try {
        if (f.name.toLowerCase().endsWith('.json')) {
          const data = JSON.parse(text);
          setPlanet({ name: data.name || 'Imported', mass: Number(data.mass) || undefined, radius: Number(data.radius) || undefined, color: data.color || '#d88', composition: (data.composition as any) || undefined });
        } else if (f.name.toLowerCase().endsWith('.csv')) {
          const parsed = parseCSV(text);
          if (!parsed) return setError('CSV inválido');
          setPlanet(parsed);
        } else {
          setError('Tipo de arquivo não suportado. Use JSON ou CSV.');
        }
      } catch (err) {
        setError('Erro ao ler arquivo');
      }
    };
    reader.readAsText(f);
  }, []);

  return (
    <div className="generator-panel">
      <div className="generator-left">
        <div className="generator-left-header">
          <h3 style={{ margin: 0 }}>Gerador de Planeta</h3>
          <button onClick={onClose} aria-label="Fechar" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 22 }}>×</button>
        </div>
        <div className="drop-area" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <p style={{ margin: 0 }}>Arraste um arquivo JSON ou CSV aqui</p>
          {error && <div className="drop-error" style={{ marginTop: 8 }}>{error}</div>}
        </div>
        <div className="generator-fields" style={{ display: 'grid', gap: 12, padding: '12px 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#ddd', marginBottom: 6 }}>Nome</label>
            <input value={planet.name} onChange={e => setPlanet(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.18)', color: '#fff' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#ddd', marginBottom: 6 }}>Massa</label>
              <input type="number" value={planet.mass ?? 1} onChange={e => setPlanet(p => ({ ...p, mass: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.18)', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#ddd', marginBottom: 6 }}>Raio</label>
              <input type="number" step="0.1" value={planet.radius ?? 1} onChange={e => setPlanet(p => ({ ...p, radius: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.18)', color: '#fff' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#ddd', marginBottom: 6 }}>Cor</label>
            <input value={planet.color} onChange={e => setPlanet(p => ({ ...p, color: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.18)', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#ddd', marginBottom: 6 }}>Composição</label>
            <select value={planet.composition || 'rocky'} onChange={e => setPlanet(p => ({ ...p, composition: e.target.value as any }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.18)', color: '#fff' }}>
              <option value="rocky">Rochoso</option>
              <option value="gaseous">Gasoso</option>
              <option value="icy">Gelado</option>
            </select>
          </div>
        </div>
      </div>
      <div className="generator-right">
        <div className="preview-shell">
          <PlanetPreview3D
            color={planet.color}
            composition={planet.composition}
            radius={(planet.radius && Math.max(0.2, planet.radius)) || 1}
            planetData={{
              signal_params: {
                orbital_period: { value: 326.03, error: 0.32, unit: 'days' },
                transit_duration: { value: 5.4, error: 0.1, unit: 'hours' },
                transit_depth: { value: 0.015, error: 0.001 },
                impact_parameter: { value: 0.5, error: 0.05 },
              },
              candidate_params: {
                mass: { value: planet.mass ?? 1, error: 0, unit: 'earth_mass' },
                radius: { value: planet.radius ?? 1, error: 0, unit: 'earth_radius' },
              },
              star_params: {
                mass: { value: 0.98, error: 0.02, unit: 'solar_mass' },
                radius: { value: 1.02, error: 0.03, unit: 'solar_radius' },
                effective_temperature: { value: 5700, error: 50, unit: 'kelvin' },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
