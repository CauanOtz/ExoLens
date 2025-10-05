import './ActivityList.css';
import type { ActivityItem } from '../../types/dashboard';

interface ActivityListProps {
  items: ActivityItem[];
  loading?: boolean;
}

export function ActivityList({ items, loading }: ActivityListProps) {
  if (loading) return <div className="activity-list loading">Loading activity...</div>;
  if (!items || items.length === 0) return <div className="activity-list empty">No recent activity</div>;
  return (
    <ul className="activity-list">
      {items.map(item => (
        <li key={item.id} className={`activity-item type-${item.type}`}>
          <div className="activity-message">{item.message}</div>
          <time className="activity-time">{new Date(item.createdAt).toLocaleTimeString()}</time>
        </li>
      ))}
    </ul>
  );
}
