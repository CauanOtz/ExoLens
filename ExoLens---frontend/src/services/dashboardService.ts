import type { ActivityItem, DashboardKPI } from '../types/dashboard';

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function getKPIs(): Promise<DashboardKPI[]> {
  await delay(400);
  return [
    { id: 'users', label: 'Users', value: 1280, delta: 5.4 },
    { id: 'sessions', label: 'Sessions', value: 5420, delta: 2.1 },
    { id: 'errors', label: 'Errors', value: 34, delta: -1.2 },
    { id: 'conversion', label: 'Conversion %', value: 3.9, delta: 0.4 },
  ];
}

export async function getActivity(): Promise<ActivityItem[]> {
  await delay(600);
  const now = Date.now();
  return [
    { id: 'a1', type: 'info', message: 'User John signed in', createdAt: new Date(now - 1000 * 60 * 2).toISOString() },
    { id: 'a2', type: 'warning', message: 'High latency detected', createdAt: new Date(now - 1000 * 60 * 5).toISOString() },
    { id: 'a3', type: 'success', message: 'Deployment completed', createdAt: new Date(now - 1000 * 60 * 15).toISOString() },
  ];
}
