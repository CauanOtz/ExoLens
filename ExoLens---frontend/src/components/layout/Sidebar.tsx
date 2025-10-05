import { useEffect, useState } from 'react';
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
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const onClose = () => setOpening(false);
    window.addEventListener('close-generator', onClose as EventListener);
    return () => window.removeEventListener('close-generator', onClose as EventListener);
  }, []);

  return (
    <div className="sidebar">
      <nav className="planet-nav">
        {items.map((it, index) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }: { isActive: boolean }) => `planet-btn ${isActive ? 'active' : ''} ${opening ? 'slide-right' : ''}`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={(e) => {
              // when clicking the first item (Mars) open generator instead of navigating
              if (index === 0) {
                e.preventDefault();
                setOpening(true);
                window.dispatchEvent(new CustomEvent('open-generator'));
              }
            }}
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
