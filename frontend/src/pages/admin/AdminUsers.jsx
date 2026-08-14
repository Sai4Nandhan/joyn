import { useEffect, useState } from 'react';
import { Search, ShieldCheck, Ban, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { listAdminUsers, updateAdminUser, deleteAdminUser } from '../../services/adminService.js';
import { useAuth } from '../../hooks/useAuth.js';

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState(null);

  function load() {
    listAdminUsers({ search: search || undefined }).then((data) => setUsers(data.users));
  }

  useEffect(load, [search]);

  async function toggleSuspend(u) {
    const updated = await updateAdminUser(u.id, { isSuspended: !u.isSuspended });
    setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  }

  async function toggleVerified(u) {
    const updated = await updateAdminUser(u.id, { isIdentityVerified: !u.isIdentityVerified });
    setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  }

  async function remove(u) {
    await deleteAdminUser(u.id);
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
        <Input id="user-search" placeholder="Search by name or email…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {!users ? (
        <p className="text-sm text-ink-400">Loading users…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{u.name}</p>
                  {u.isIdentityVerified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                  {u.isSuspended && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Suspended</span>
                  )}
                </div>
                <p className="text-xs text-ink-400">
                  {u.email} · Trust {u.trustScore}
                </p>
              </div>

              {u.id !== currentUser.id && (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => toggleVerified(u)} className="!px-3 text-xs">
                    {u.isIdentityVerified ? 'Unverify' : 'Verify'}
                  </Button>
                  <Button variant="secondary" onClick={() => toggleSuspend(u)} className="!px-3 text-xs">
                    <Ban className="h-3.5 w-3.5" />
                    {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </Button>
                  <button onClick={() => remove(u)} className="text-ink-300 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </Card>
          ))}
          {users.length === 0 && <p className="text-sm text-ink-400">No users found.</p>}
        </div>
      )}
    </div>
  );
}
