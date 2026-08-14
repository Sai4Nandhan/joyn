import { useEffect, useState } from 'react';
import { Search, Ban, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { listAdminActivities, updateAdminActivityStatus, deleteAdminActivity } from '../../services/adminService.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

export function AdminActivities() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [activities, setActivities] = useState(null);

  function load() {
    listAdminActivities({ search: search || undefined, status: status || undefined }).then((data) =>
      setActivities(data.activities)
    );
  }

  useEffect(load, [search, status]);

  async function cancel(a) {
    const updated = await updateAdminActivityStatus(a.id, 'cancelled');
    setActivities((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  }

  async function remove(a) {
    await deleteAdminActivity(a.id);
    setActivities((prev) => prev.filter((x) => x.id !== a.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <Input id="activity-search" placeholder="Search by title…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select id="status-filter" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>

      {!activities ? (
        <p className="text-sm text-ink-400">Loading activities…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {activities.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{a.title}</p>
                <p className="text-xs text-ink-400">
                  {a.category} · {a.status} · host {a.host?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {a.status !== 'cancelled' && (
                  <button
                    onClick={() => cancel(a)}
                    className="flex items-center gap-1 rounded-md bg-ink-100 px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-200 dark:bg-ink-700 dark:text-ink-300"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                )}
                <button onClick={() => remove(a)} className="text-ink-300 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
          {activities.length === 0 && <p className="text-sm text-ink-400">No activities found.</p>}
        </div>
      )}
    </div>
  );
}
