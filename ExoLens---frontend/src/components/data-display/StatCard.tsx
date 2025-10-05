import './StatCard.css';

export interface StatCardProps {
  label: string;
  value: number | string;
  delta?: number;
  loading?: boolean;
}

export function StatCard({ label, value, delta, loading }: StatCardProps) {
  if (loading) {
    return <div className="stat-card loading">Loading...</div>;
  }
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {typeof delta === 'number' && (
        <div className={`stat-delta ${delta >= 0 ? 'up' : 'down'}`}>{delta >= 0 ? '+' : ''}{delta}%</div>
      )}
    </div>
  );
}
