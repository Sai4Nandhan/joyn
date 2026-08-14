import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Send, Trash2, AlertCircle } from 'lucide-react';

export function VoiceRecorder({ onSendVoice, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported on this device/browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);

        // Stop all audio track streams
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Microphone permission denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    if (onCancel) onCancel();
  };

  const handleTogglePlayPreview = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSendVoice(audioBlob, recordingTime);
      cancelRecording();
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-ink-50 dark:bg-purple-950/40 border border-brand-200 dark:border-purple-900/40 w-full animate-fadeIn">
      {error ? (
        <div className="flex items-center justify-between w-full text-xs text-red-500 px-2">
          <span className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {error}
          </span>
          <button type="button" onClick={() => setError(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      ) : !isRecording && !audioBlob ? (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Mic className="h-4 w-4" />
          <span>Record Voice Message</span>
        </button>
      ) : isRecording ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs font-bold text-red-500 animate-pulse">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span>Recording {formatSeconds(recordingTime)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-150 dark:hover:bg-purple-900/40 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Stop</span>
            </button>
          </div>
        </div>
      ) : (
        /* Preview State */
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlayPreview}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <span className="text-xs font-bold text-ink-800 dark:text-white">
              Voice Note ({formatSeconds(recordingTime)})
            </span>
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-1.5 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-purple-900/40 transition-colors"
              title="Delete recording"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Voice Note</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
