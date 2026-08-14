import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { getChecklist, addChecklistItem, updateChecklistItem, deleteChecklistItem } from '../../services/workspaceService.js';

export function ChecklistPanel({ activityId }) {
  const [items, setItems] = useState(null);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load() {
    getChecklist(activityId).then(setItems);
  }

  useEffect(load, [activityId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await addChecklistItem(activityId, { title: title.trim() });
      setTitle('');
      load();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggle(item) {
    const updated = await updateChecklistItem(activityId, item.id, { isDone: !item.isDone });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function remove(itemId) {
    await deleteChecklistItem(activityId, itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  if (!items) return <p className="text-sm text-ink-400">Loading checklist…</p>;

  const done = items.filter((i) => i.isDone).length;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <div className="flex-1">
          <Input id="checklist-title" placeholder="Add an item…" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <Button type="submit" isLoading={isSubmitting} className="!px-3.5">
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {items.length > 0 && (
        <p className="text-xs text-ink-400">
          {done} of {items.length} done
        </p>
      )}

      <div className="flex flex-col gap-2">
        {items.length === 0 && <p className="text-sm text-ink-400">Nothing on the checklist yet.</p>}
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between gap-3 p-3">
            <label className="flex flex-1 items-center gap-3">
              <input type="checkbox" checked={item.isDone} onChange={() => toggle(item)} className="h-4 w-4" />
              <span className={`text-sm ${item.isDone ? 'text-ink-400 line-through' : 'text-ink-800 dark:text-ink-100'}`}>
                {item.title}
              </span>
            </label>
            <button onClick={() => remove(item.id)} className="text-ink-300 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
