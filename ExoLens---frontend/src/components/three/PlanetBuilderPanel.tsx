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
          <h3>Gerador de Planeta</h3>
          <button onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="drop-area" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <p>Arraste um arquivo JSON ou CSV aqui</p>
          {error && <div className="drop-error">{error}</div>}
        </div>
        <div className="generator-fields">
          <label>Nome<input value={planet.name} onChange={e => setPlanet(p => ({ ...p, name: e.target.value }))} /></label>
          <label>Massa<input type="number" value={planet.mass ?? 1} onChange={e => setPlanet(p => ({ ...p, mass: Number(e.target.value) }))} /></label>
          <label>Raio<input type="number" step="0.1" value={planet.radius ?? 1} onChange={e => setPlanet(p => ({ ...p, radius: Number(e.target.value) }))} /></label>
            <label>Cor<input value={planet.color} onChange={e => setPlanet(p => ({ ...p, color: e.target.value }))} /></label>
            <label>Composição
              <select value={planet.composition || 'rocky'} onChange={e => setPlanet(p => ({ ...p, composition: e.target.value as any }))}>
                <option value="rocky">Rochoso</option>
                <option value="gaseous">Gasoso</option>
                <option value="icy">Gelado</option>
              </select>
            </label>
        </div>
      </div>
      <div className="generator-right">
        <div className="preview-shell">
          <PlanetPreview3D color={planet.color} composition={planet.composition} radius={(planet.radius && Math.max(0.2, planet.radius)) || 1} />
        </div>
      </div>
    </div>
  );
}
