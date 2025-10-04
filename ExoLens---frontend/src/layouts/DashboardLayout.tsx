import type { ReactNode } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import SunModel from '../components/three/SunModel';
import './DashboardLayout.css';

interface DashboardLayoutProps { children: ReactNode }

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <div className="space-bg" aria-hidden="true"></div>
      <div className="sun-container-3d" aria-hidden="true">
        <SunModel modelUrl={new URL('../assets/sun/scene.gltf', import.meta.url).href} />
      </div>
      <Sidebar />
      <div className="dashboard-main">
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
