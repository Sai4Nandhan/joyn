import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Receipt, BarChart3, ListChecks } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { ExpensesPanel } from '../../components/workspace/ExpensesPanel.jsx';
import { PollsPanel } from '../../components/workspace/PollsPanel.jsx';
import { ChecklistPanel } from '../../components/workspace/ChecklistPanel.jsx';

const TABS = [
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'polls', label: 'Polls', icon: BarChart3 },
  { id: 'checklist', label: 'Checklist', icon: ListChecks },
];

export default function TripWorkspace() {
  const { id } = useParams();
  const [tab, setTab] = useState('expenses');

  return (
    <Layout>
      <div className="max-w-3xl">
        <Link
          to={`/activities/${id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-400 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to activity
        </Link>

        <h1 className="text-2xl font-bold text-ink-800 mb-5">Trip Workspace</h1>

        <div className="mb-6 inline-flex gap-1 rounded-xl bg-ink-100 p-1">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium transition-all
                ${tab === tabId ? 'bg-white text-ink-800 shadow-card' : 'text-ink-400 hover:text-ink-600'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'expenses' && <ExpensesPanel activityId={id} />}
        {tab === 'polls' && <PollsPanel activityId={id} />}
        {tab === 'checklist' && <ChecklistPanel activityId={id} />}
      </div>
    </Layout>
  );
}
