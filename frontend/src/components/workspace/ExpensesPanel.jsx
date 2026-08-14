import { useEffect, useState } from 'react';
import { Trash2, Receipt } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { getExpenses, addExpense, deleteExpense } from '../../services/workspaceService.js';
import { useAuth } from '../../hooks/useAuth.js';

export function ExpensesPanel({ activityId }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ description: '', amount: '' });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load() {
    getExpenses(activityId).then(setData);
  }

  useEffect(load, [activityId]);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await addExpense(activityId, { description: form.description, amount: Number(form.amount) });
      setForm({ description: '', amount: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add expense');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(expenseId) {
    await deleteExpense(activityId, expenseId);
    load();
  }

  if (!data) return <p className="text-sm text-ink-400">Loading expenses…</p>;

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-700 dark:text-ink-200">Add an expense</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              id="expense-desc"
              label="What was it for?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className="w-32">
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              min="0.01"
              label="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <Button type="submit" isLoading={isSubmitting}>
            Add
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <p className="mt-2 text-xs text-ink-400">You're recorded as the payer, split evenly across everyone in the room.</p>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-700 dark:text-ink-200">Balances</h3>
        <div className="flex flex-col gap-2">
          {data.balances.map((b) => (
            <div key={b.user.id} className="flex items-center justify-between text-sm">
              <span className="text-ink-600 dark:text-ink-300">
                {b.user.id === user.id ? 'You' : b.user.name}
              </span>
              <span className={b.netBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                {b.netBalance >= 0 ? '+' : ''}
                {b.netBalance.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {data.settlements.length > 0 && (
          <div className="mt-4 border-t border-ink-100 pt-4 dark:border-ink-700">
            <p className="mb-2 text-xs font-medium text-ink-500 dark:text-ink-400">Suggested settlements</p>
            {data.settlements.map((s, i) => (
              <p key={i} className="text-sm text-ink-600 dark:text-ink-300">
                {s.from.id === user.id ? 'You' : s.from.name} → {s.to.id === user.id ? 'you' : s.to.name}:{' '}
                <span className="font-medium">{s.amount.toFixed(2)}</span>
              </p>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-2">
        {data.expenses.length === 0 && <p className="text-sm text-ink-400">No expenses logged yet.</p>}
        {data.expenses.map((e) => (
          <Card key={e.id} className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-4 w-4 text-signal-400" />
              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{e.description}</p>
                <p className="text-xs text-ink-400">Paid by {e.paidBy?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-ink-800 dark:text-ink-100">
                {e.currency} {e.amount.toFixed(2)}
              </span>
              {(e.createdBy === user.id || data.isHost) && (
                <button onClick={() => handleDelete(e.id)} className="text-ink-300 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
