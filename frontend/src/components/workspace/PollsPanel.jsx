import { useEffect, useState } from 'react';
import { Plus, X, Lock } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { getPolls, createPoll, voteOnPoll, closePoll } from '../../services/workspaceService.js';

import { useAuth } from '../../hooks/useAuth.js';

function PollCard({ poll, activityId, onChange, isHost, user }) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);

  async function handleVote(optionId) {
    if (poll.isClosed) return;
    const current = poll.options.filter((o) => o.votedByMe).map((o) => o.id);
    const next = poll.allowMultiple
      ? current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      : [optionId];

    if (next.length === 0) return; // require at least one choice
    const updated = await voteOnPoll(activityId, poll.id, next);
    onChange(updated);
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-100">{poll.question}</h3>
        {poll.isClosed && (
          <span className="flex items-center gap-1 text-xs text-ink-400">
            <Lock className="h-3 w-3" /> Closed
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {poll.options.map((opt) => {
          const pct = totalVotes ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={poll.isClosed}
              className={`relative overflow-hidden rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default
                ${opt.votedByMe ? 'border-signal-400' : 'border-ink-200 dark:border-ink-600'}`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-signal-50 dark:bg-signal-900/20"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between">
                <span className="text-ink-700 dark:text-ink-200">{opt.text}</span>
                <span className="text-xs text-ink-400">
                  {opt.voteCount} · {pct}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {!poll.isClosed && (isHost || poll.createdBy === user?.id) && (
        <button
          onClick={async () => onChange(await closePoll(activityId, poll.id))}
          className="mt-3 text-xs text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
        >
          Close poll
        </button>
      )}
    </Card>
  );
}

export function PollsPanel({ activityId }) {
  const { user } = useAuth();
  const [polls, setPolls] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState(null);

  function load() {
    getPolls(activityId).then((data) => {
      setPolls(data.polls);
      setIsHost(data.isHost);
    });
  }

  useEffect(load, [activityId]);

  function updateOption(i, value) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
      await createPoll(activityId, { question, options: cleanOptions });
      setQuestion('');
      setOptions(['', '']);
      setIsCreating(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create poll');
    }
  }

  function handlePollChange(updated) {
    setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  if (!polls) return <p className="text-sm text-ink-400">Loading polls…</p>;

  return (
    <div className="flex flex-col gap-4">
      {!isCreating ? (
        <Button variant="secondary" onClick={() => setIsCreating(true)} className="self-start">
          <Plus className="h-4 w-4" />
          New poll
        </Button>
      ) : (
        <Card className="p-5">
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input id="poll-question" label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  id={`poll-option-${i}`}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  required={i < 2}
                  className="flex-1"
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}>
                    <X className="h-4 w-4 text-ink-400" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button
                type="button"
                onClick={() => setOptions((prev) => [...prev, ''])}
                className="self-start text-xs text-signal-500 hover:text-signal-600"
              >
                + Add option
              </button>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create poll
              </Button>
            </div>
          </form>
        </Card>
      )}

      {polls.length === 0 && <p className="text-sm text-ink-400">No polls yet.</p>}
      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          activityId={activityId}
          isHost={isHost}
          user={user}
          onChange={handlePollChange}
        />
      ))}
    </div>
  );
}
