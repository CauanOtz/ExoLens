import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MiniPlanet } from '../three/MiniPlanet';
import './Sidebar.css';

type PlanetType = 'mars' | 'earth' | 'jupiter';

const items: { to: string; label: string; planetType: PlanetType }[] = [
  { to: '/dashboard', label: 'Mars', planetType: 'mars' },
  { to: '/dashboard/activity', label: 'Earth', planetType: 'earth' },
  { to: '/settings', label: 'Jupiter', planetType: 'jupiter' },
];

export function Sidebar() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="sidebar">
      <nav className="planet-nav">
        {items.map((it, index) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }: { isActive: boolean }) => `planet-btn ${isActive ? 'active' : ''}`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            aria-label={it.label}
          >
            <span className="planet-sphere small">
              <MiniPlanet 
                type={it.planetType} 
                size={52} 
                isHovered={hoveredIndex === index}
              />
            </span>
            <span className="planet-label">{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
