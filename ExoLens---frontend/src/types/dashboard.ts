export interface DashboardKPI {
  id: string;
  label: string;
  value: number | string;
  delta?: number;
}

export interface ActivityItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  createdAt: string; // ISO date
}
