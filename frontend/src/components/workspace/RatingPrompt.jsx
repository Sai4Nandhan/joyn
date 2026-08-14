import { useEffect, useState } from 'react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { StarRating } from '../ui/StarRating.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { listPendingRatings, submitRating } from '../../services/ratingService.js';

export function RatingPrompt({ activityId }) {
  const [pending, setPending] = useState(null);
  const [active, setActive] = useState(null); // user currently being rated
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [reliable, setReliable] = useState(true);
  const [onTime, setOnTime] = useState(true);
  const [respectful, setRespectful] = useState(true);
  const [goodCommunication, setGoodCommunication] = useState(true);
  const [matchedExpectations, setMatchedExpectations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load() {
    listPendingRatings(activityId).then(setPending);
  }

  useEffect(load, [activityId]);

  function resetForm() {
    setActive(null);
    setStars(0);
    setComment('');
    setReliable(true);
    setOnTime(true);
    setRespectful(true);
    setGoodCommunication(true);
    setMatchedExpectations(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stars) return;
    setIsSubmitting(true);
    try {
      await submitRating(activityId, {
        rateeId: active.id,
        stars,
        comment,
        behavioralFeedback: {
          reliable,
          onTime,
          respectful,
          goodCommunication,
          matchedExpectations,
        },
      });
      setPending((prev) => prev.filter((u) => u.id !== active.id));
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!pending || pending.length === 0) return null;

  return (
    <Card className="mt-6 p-5">
      <h3 className="mb-3 text-sm font-semibold text-ink-700 dark:text-ink-200">
        How was it with these people?
      </h3>

      {!active ? (
        <div className="flex flex-wrap gap-2">
          {pending.map((u) => (
            <button
              key={u.id}
              onClick={() => setActive(u)}
              className="flex items-center gap-2 rounded-full border border-ink-200 px-3 py-1.5 text-sm hover:border-signal-400 dark:border-ink-600"
            >
              <img
                src={u.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                alt={u.name}
                className="h-5 w-5 rounded-full"
              />
              Rate {u.name}
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-sm text-ink-600 dark:text-ink-300">Rating {active.name}</p>
          <StarRating value={stars} onChange={setStars} />
          
          <div className="space-y-2.5 border-t border-b border-ink-100 py-3.5 my-1 dark:border-ink-700">
            <p className="text-2xs font-bold text-ink-400 uppercase tracking-wider">Behavioural Evaluation</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-ink-600 dark:text-slate-350">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={reliable} onChange={(e) => setReliable(e.target.checked)} className="rounded border-ink-300 text-brand-500 focus:ring-brand-400" />
                Reliable & committed
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={onTime} onChange={(e) => setOnTime(e.target.checked)} className="rounded border-ink-300 text-brand-500 focus:ring-brand-400" />
                Punctual / Showed up on time
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={respectful} onChange={(e) => setRespectful(e.target.checked)} className="rounded border-ink-300 text-brand-500 focus:ring-brand-400" />
                Respectful & cooperative
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={goodCommunication} onChange={(e) => setGoodCommunication(e.target.checked)} className="rounded border-ink-300 text-brand-500 focus:ring-brand-400" />
                Clear & polite communication
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none col-span-1 sm:col-span-2">
                <input type="checkbox" checked={matchedExpectations} onChange={(e) => setMatchedExpectations(e.target.checked)} className="rounded border-ink-300 text-brand-500 focus:ring-brand-400" />
                Matched expectations / Well-organized host
              </label>
            </div>
          </div>

          <Textarea
            id="rating-comment"
            label="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3">
            <Button type="button" variant="ghost" className="flex-1" onClick={resetForm}>
              Back
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={!stars} className="flex-1">
              Submit rating
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
