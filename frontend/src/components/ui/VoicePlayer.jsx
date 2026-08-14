import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

export function VoicePlayer({ voiceUrl, duration, isMe }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration || duration || 1;
      setProgress((current / total) * 100);
    }
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '00:00';
    const mins = Math.floor(sec / 60);
    const remainingSec = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl min-w-[200px] sm:min-w-[240px] ${
      isMe
        ? 'bg-brand-600 text-white'
        : 'bg-white dark:bg-[#151936] text-ink-900 dark:text-white border border-ink-100 dark:border-purple-950/40 shadow-sm'
    }`}>
      <button
        type="button"
        onClick={togglePlay}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 ${
          isMe ? 'bg-white text-brand-600' : 'bg-brand-500 text-white'
        }`}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-2xs font-bold mb-1 opacity-90">
          <span className="flex items-center gap-1">
            <Volume2 className="h-3 w-3" /> Voice Note
          </span>
          <span>{formatSeconds(duration)}</span>
        </div>

        {/* Progress Bar */}
        <div className={`h-1.5 w-full rounded-full overflow-hidden ${
          isMe ? 'bg-white/30' : 'bg-ink-100 dark:bg-purple-950/60'
        }`}>
          <div
            style={{ width: `${progress}%` }}
            className={`h-full rounded-full transition-all ${
              isMe ? 'bg-white' : 'bg-brand-500'
            }`}
          />
        </div>
      </div>

      <audio
        ref={audioRef}
        src={voiceUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
        }}
        className="hidden"
      />
    </div>
  );
}
