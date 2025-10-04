import type { ReactNode } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { RealisticSun } from '../components/three/RealisticSun';
import './DashboardLayout.css';

interface DashboardLayoutProps { children: ReactNode }

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <div className="space-bg" aria-hidden="true"></div>
      <div className="sun-container-3d" aria-hidden="true">
        <RealisticSun />
      </div>
      <Sidebar />
      <div className="dashboard-main">
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
