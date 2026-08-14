import { MapPin, Calendar, Users, IndianRupee, ShieldCheck } from 'lucide-react';

export function ActivityPreviewCard({ form, locationData, user }) {
  const title = form.title || 'Untitled Activity';
  const category = form.category || 'social';

  // Format schedule date nicely
  let formattedDate = 'Set start time';
  if (form.startAt) {
    try {
      const d = new Date(form.startAt);
      formattedDate = d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      // Ignore
    }
  }

  const placeName = locationData?.placeName || form.placeName || 'Location not selected';
  const capacityMax = form.capacityMax || 10;
  const isFree = form.isFree;
  const costAmount = form.costAmount;

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
      {/* Category Gradient Hero */}
      <div className="relative h-32 w-full bg-gradient-to-tr from-violet-600 via-pink-600 to-amber-500 p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-slate-950/60 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white border border-white/10">
            {category}
          </span>
          <span className="rounded-full bg-emerald-500/90 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white shadow-sm">
            Live Preview
          </span>
        </div>

        <h3 className="text-lg font-black text-white line-clamp-1 drop-shadow-md">
          {title}
        </h3>
      </div>

      {/* Content Body */}
      <div className="p-5 space-y-4">
        {/* Host Info */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-500 to-rose-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            {user?.name?.[0] || 'H'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {user?.name || 'Activity Host'}
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Trust Score: {user?.trustScore || 50} / 100
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Calendar className="h-4 w-4 text-violet-500 flex-shrink-0" />
            <span className="line-clamp-1 font-medium">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <MapPin className="h-4 w-4 text-rose-500 flex-shrink-0" />
            <span className="line-clamp-1 font-medium">{placeName}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Users className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span className="font-medium">1 / {capacityMax} joined</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <IndianRupee className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span className="font-medium">
              {isFree ? 'Free Activity' : `₹${costAmount || 0} estimated`}
            </span>
          </div>
        </div>

        {/* Description Snippet */}
        {form.description && (
          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed border-t border-slate-100 dark:border-slate-800">
            {form.description}
          </div>
        )}
      </div>
    </div>
  );
}
