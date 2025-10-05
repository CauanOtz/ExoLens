import { useEffect, useState } from 'react';
import { getActivity, getKPIs } from '../services/dashboardService';
import type { ActivityItem, DashboardKPI } from '../types/dashboard';

interface DashboardDataState {
  kpis: DashboardKPI[];
  activity: ActivityItem[];
  loading: boolean;
}

export function useDashboardData(): DashboardDataState {
  const [kpis, setKpis] = useState<DashboardKPI[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [kpiRes, actRes] = await Promise.all([
        getKPIs(),
        getActivity(),
      ]);
      if (mounted) {
        setKpis(kpiRes);
        setActivity(actRes);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { kpis, activity, loading };
}
