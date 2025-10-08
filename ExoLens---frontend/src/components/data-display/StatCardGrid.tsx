import { StatCard } from './StatCard';
import type { StatCardProps } from './StatCard';
import './StatCardGrid.css';

interface StatCardGridProps {
  items: (StatCardProps & { id?: string })[];
  loading?: boolean;
}

export function StatCardGrid({ items, loading }: StatCardGridProps) {
  if (!items || items.length === 0) {
    return <div className="stat-grid empty">No data</div>;
  }
  return (
    <div className="stat-grid">
      {items.map((k, i) => (
        <StatCard key={k.id || i} {...k} loading={loading} />
      ))}
    </div>
  );
}
