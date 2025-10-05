import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MiniPlanet } from '../three/MiniPlanet';
import './Sidebar.css';


const items: { to: string; label: string;  }[] = [
  { to: '/dashboard', label: 'Mars' },
  { to: '/dashboard/activity', label: 'Earth' },
  { to: '/settings', label: 'Jupiter' },
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
            <span className="planet-label">{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
