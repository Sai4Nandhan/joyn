import { useEffect, useState } from 'react';
import { Users, Calendar, ShieldAlert, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { getAdminStats } from '../../services/adminService.js';

const CARDS = [
  { key: 'totalUsers', label: 'Total users', icon: Users },
  { key: 'suspendedUsers', label: 'Suspended', icon: ShieldAlert },
  { key: 'totalActivities', label: 'Total activities', icon: Calendar },
  { key: 'pendingJoinRequests', label: 'Pending requests', icon: Clock },
];

export function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getAdminStats().then(setStats);
  }, []);

  if (!stats) return <p className="text-sm text-ink-400">Loading stats…</p>;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon }) => (
        <Card key={key} className="p-5">
          <Icon className="mb-2 h-4 w-4 text-signal-400" />
          <p className="font-display text-xl font-semibold text-ink-800 dark:text-white">{stats[key]}</p>
          <p className="text-xs text-ink-400">{label}</p>
        </Card>
      ))}
    </div>
  );
}
