import { useState } from 'react';
import { LayoutDashboard, Users, Calendar, Shield, ShieldAlert } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { AdminOverview } from './AdminOverview.jsx';
import { AdminUsers } from './AdminUsers.jsx';
import { AdminActivities } from './AdminActivities.jsx';
import { ShieldCheck } from 'lucide-react';
import AdminReports from './AdminReports.jsx';
import { AdminVerifications } from './AdminVerifications.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'verifications', label: 'Verifications', icon: ShieldCheck },
  { id: 'activities', label: 'Activities', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: ShieldAlert },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');

  return (
    <Layout>
      <div className="max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-800">Admin Dashboard</h1>
            <p className="text-sm text-ink-400">Manage users, identity verifications, activities, and platform settings</p>
          </div>
        </div>

        <div className="mb-6 inline-flex gap-1 rounded-xl bg-ink-100 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium transition-all
                ${tab === id ? 'bg-white text-ink-800 shadow-card' : 'text-ink-400 hover:text-ink-600'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <AdminOverview />}
        {tab === 'users' && <AdminUsers />}
        {tab === 'verifications' && <AdminVerifications />}
        {tab === 'activities' && <AdminActivities />}
        {tab === 'reports' && <AdminReports />}
      </div>
    </Layout>
  );
}

