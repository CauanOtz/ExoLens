import { useState } from 'react';
import EarthModel from './EarthModel';
import JupiterModel from './JupiterModel';
import SunModel from './SunModel';
import MarsModel from './MarsModel';
import MercuryModel from './MercuryModel';
import NeptuneModel from './NeptuneModel';
import SaturnModel from './SaturnModel';

type Preset = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'neptune' | 'sun';

export default function SolarSystemShowcase({ onSelect, size = 140 }: { onSelect?: (preset: Preset) => void; size?: number }) {
  const planets: Array<{ key: Preset; label: string }> = [
    { key: 'mercury', label: 'Mercúrio' },
    { key: 'venus', label: 'Vênus' },
    { key: 'earth', label: 'Terra' },
    { key: 'mars', label: 'Marte' },
    { key: 'jupiter', label: 'Júpiter' },
    { key: 'saturn', label: 'Saturno' },
    { key: 'neptune', label: 'Netuno' },
    { key: 'sun', label: 'Sol' },
  ];

  const [active, setActive] = useState<number>(2);

  return (
    <div className="solar-showcase-inner" style={{ padding: 8 }}>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '8px 4px' }}>
        {planets.map((p, i) => (
          <button
            key={p.key}
            onClick={() => {
              setActive(i);
              onSelect?.(p.key);
            }}
            aria-pressed={i === active}
            style={{
              minWidth: size,
              height: size + 36,
              padding: 8,
              borderRadius: 10,
              background: i === active ? 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' : 'transparent',
              border: '1px solid rgba(255,255,255,0.04)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
            }}
          >
            <div style={{ height: size, width: '100%', position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.04)' }}>
              {p.key === 'earth' && <EarthModel modelPath={undefined} distance={12} height={`${size}px`} controls={true} />}
              {p.key === 'jupiter' && <JupiterModel distance={12} height={`${size}px`} controls={true} />}
              {p.key === 'sun' && <SunModel height={`${size}px`} controls={true} />}
              {p.key === 'mars' && <MarsModel distance={12} height={`${size}px`} controls={true} />}
              {p.key === 'mercury' && <MercuryModel distance={12} height={`${size}px`} controls={true} />}
              {p.key === 'neptune' && <NeptuneModel distance={12} height={`${size}px`} controls={true} />}
              {p.key === 'saturn' && <SaturnModel distance={12} height={`${size}px`} controls={true} />}
              {/* Venus uses EarthModel as a placeholder for now */}
              {p.key === 'venus' && <EarthModel modelPath={undefined} distance={12} height={`${size}px`} controls={true} />}
            </div>
            <div style={{ marginTop: 8, textAlign: 'center', fontWeight: 700 }}>{p.label}</div>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 'min(520px, 88vw)', height: 'min(420px, 54vh)', borderRadius: 12, overflow: 'hidden', background: 'rgba(0,0,0,0.02)' }}>
          {/* large centered preview for the active planet */}
          {planets[active].key === 'earth' && <EarthModel modelPath={undefined} distance={28} height={'100%'} controls={true} />}
          {planets[active].key === 'jupiter' && <JupiterModel distance={28} height={'100%'} controls={true} />}
          {planets[active].key === 'sun' && <SunModel height={'100%'} controls={true} />}
          {planets[active].key === 'mars' && <MarsModel distance={28} height={'100%'} controls={true} />}
          {planets[active].key === 'mercury' && <MercuryModel distance={28} height={'100%'} controls={true} />}
          {planets[active].key === 'neptune' && <NeptuneModel distance={28} height={'100%'} controls={true} />}
          {planets[active].key === 'saturn' && <SaturnModel distance={28} height={'100%'} controls={true} />}
          {planets[active].key === 'venus' && <EarthModel modelPath={undefined} distance={28} height={'100%'} controls={true} />}
        </div>
      </div>
    </div>
  );
}
