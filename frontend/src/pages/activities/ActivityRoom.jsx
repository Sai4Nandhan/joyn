import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Send, ArrowLeft, Bell, BellOff, ArrowDown, Mic, MicOff, Users } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { getRoomMessages, getRoomMembers } from '../../services/roomService.js';
import { connectSocket } from '../../lib/socket.js';
import { EmojiPicker } from '../../components/ui/EmojiPicker.jsx';
import { VoiceRecorder } from '../../components/ui/VoiceRecorder.jsx';
import { VoicePlayer } from '../../components/ui/VoicePlayer.jsx';
import { api } from '../../lib/axios.js';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ActivityRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [draft, setDraft] = useState('');
  const [asAnnouncement, setAsAnnouncement] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const scrollRef = useRef(null);
  const socketRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Fetch initial room data & setup socket connection
  useEffect(() => {
    let cancelled = false;
    const socket = connectSocket();
    socketRef.current = socket;

    async function setup() {
      try {
        const [history, { host }, muteRes] = await Promise.all([
          getRoomMessages(id),
          getRoomMembers(id),
          api.get(`/activities/${id}/room/mute`).catch(() => ({ data: { data: { isMuted: false } } })),
        ]);
        if (cancelled) return;

        setMessages(history);
        setIsHost(host?._id === user.id || host?.id === user.id);
        setIsMuted(Boolean(muteRes?.data?.data?.isMuted));

        socket.emit('room:join', { activityId: id }, (ack) => {
          if (cancelled) return;
          if (!ack?.ok) setError(ack?.error || 'Could not join this room');
          setIsReady(true);
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load this room');
          setIsReady(true);
        }
      }
    }

    function handleMessage(message) {
      setMessages((prev) => [...prev, message]);
      if (isNearBottomRef.current) {
        setTimeout(scrollToBottom, 50);
      } else {
        setNewMessagesCount((prev) => prev + 1);
      }
    }

    socket.on('room:message', handleMessage);
    setup();

    return () => {
      cancelled = true;
      socket.emit('room:leave', { activityId: id });
      socket.off('room:message', handleMessage);
    };
  }, [id, user.id]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 120;
    isNearBottomRef.current = nearBottom;

    if (nearBottom) {
      setNewMessagesCount(0);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      setNewMessagesCount(0);
      isNearBottomRef.current = true;
    }
  };

  useEffect(() => {
    if (messages.length > 0 && isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleToggleMute = async () => {
    try {
      const res = await api.post(`/activities/${id}/room/mute`);
      if (res?.data?.data) {
        setIsMuted(res.data.data.isMuted);
      }
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    const content = draft.trim();
    if (!content) return;

    socketRef.current.emit(
      'room:message',
      { activityId: id, content, type: asAnnouncement ? 'announcement' : 'message' },
      (ack) => {
        if (!ack?.ok) setError(ack?.error || 'Message failed to send');
      }
    );
    setDraft('');
  };

  const handleSendVoice = async (audioBlob, duration) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `voice_${Date.now()}.webm`);
      formData.append('duration', duration);

      const res = await api.post(`/activities/${id}/room/voice`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.data?.data?.message) {
        const newMsg = res.data.data.message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setShowVoiceRecorder(false);
      }
    } catch (err) {
      console.error('Error uploading voice message:', err);
      setError(err.response?.data?.message || 'Failed to send voice message');
    }
  };

  if (error && !isReady) {
    return (
      <Layout>
        <div className="py-10 text-center text-sm text-red-500">
          <p>{error}</p>
          <Link to="/" className="mt-4 inline-block text-brand-500 font-bold underline">
            Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-7rem)] max-w-4xl flex-col mx-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-ink-100 dark:border-purple-950/30 pb-3 mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              to={`/activities/${id}`}
              className="p-1.5 rounded-lg text-ink-400 hover:text-brand-500 hover:bg-ink-100 dark:hover:bg-purple-950/40 transition-colors"
              title="Back to activity"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-ink-900 dark:text-white font-display leading-tight">
                Activity Room Workspace
              </h1>
              <p className="text-xs text-ink-500 dark:text-slate-400">
                Real-time group chat & voice notes for activity members
              </p>
            </div>
          </div>

          {/* Mute Room Toggle Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isMuted
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-ink-100 dark:bg-purple-950/40 text-ink-700 dark:text-slate-200 border-ink-200 dark:border-purple-900/40'
            }`}
          >
            {isMuted ? <BellOff className="h-4 w-4 text-amber-500" /> : <Bell className="h-4 w-4 text-brand-500" />}
            <span>{isMuted ? 'Muted 🔕' : 'Mute Room'}</span>
          </button>
        </div>

        {/* Chat Messages Scroll Container */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto rounded-2xl border border-ink-100 dark:border-purple-950/30 bg-white dark:bg-[#0E1126] p-4 shadow-sm space-y-4"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 mb-3">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-ink-900 dark:text-white">You're in the room 🎉</h3>
                <p className="text-xs text-ink-500 dark:text-slate-400 mt-1">
                  Start the conversation with your group members.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = (m.sender?._id || m.sender?.id || m.sender) === user.id;
                const isAnnouncement = m.type === 'announcement';
                const isVoice = m.type === 'voice';

                return (
                  <motion.div
                    key={m.id || m._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${
                      isAnnouncement ? 'w-full' : ''
                    }`}
                  >
                    {/* Announcement Banner */}
                    {isAnnouncement ? (
                      <div className="w-full rounded-xl bg-brand-500/10 border border-brand-500/20 p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-brand-600 dark:text-brand-400 mb-1">
                          <Megaphone className="h-4 w-4" /> ANNOUNCEMENT FROM HOST ({m.sender?.name})
                        </div>
                        <p className="text-xs text-ink-800 dark:text-white font-medium">{m.content}</p>
                        <span className="text-[10px] text-ink-400 dark:text-slate-500 mt-1 block">{formatTime(m.createdAt)}</span>
                      </div>
                    ) : (
                      <div className="max-w-[85%] sm:max-w-[75%]">
                        <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs font-bold text-ink-700 dark:text-slate-300">
                            {isMe ? 'You' : m.sender?.name || 'Member'}
                          </span>
                          <span className="text-[10px] text-ink-400 dark:text-slate-500">{formatTime(m.createdAt)}</span>
                        </div>

                        {isVoice ? (
                          <VoicePlayer voiceUrl={m.voiceUrl} duration={m.duration} isMe={isMe} />
                        ) : (
                          <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed font-medium shadow-sm ${
                            isMe
                              ? 'bg-brand-500 text-white rounded-tr-none'
                              : 'bg-ink-50 dark:bg-[#151936] text-ink-900 dark:text-white border border-ink-100 dark:border-purple-950/40 rounded-tl-none'
                          }`}>
                            {m.content}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* New Messages Floating Pill */}
          <AnimatePresence>
            {newMessagesCount > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                type="button"
                onClick={scrollToBottom}
                className="absolute bottom-4 right-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500 text-white font-bold text-xs shadow-lg cursor-pointer hover:bg-brand-600 transition-all"
              >
                <ArrowDown className="h-3.5 w-3.5" />
                <span>{newMessagesCount} new message{newMessagesCount > 1 ? 's' : ''}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {error && <p className="mt-2 text-xs text-red-500 font-bold">{error}</p>}

        {/* Message Input & Voice Recorder Toolbar */}
        <div className="mt-3 shrink-0">
          {showVoiceRecorder ? (
            <VoiceRecorder
              onSendVoice={handleSendVoice}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-2 relative">
              <EmojiPicker onSelectEmoji={(emoji) => setDraft((prev) => prev + emoji)} />
              
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-purple-950/40 transition-all cursor-pointer shrink-0"
                title="Record voice message"
              >
                <Mic className="h-5 w-5" />
              </button>

              <div className="flex-1">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                  placeholder="Write a message…"
                  className="w-full h-11 rounded-xl border border-ink-200 dark:border-purple-950/30 bg-white dark:bg-[#151936] dark:text-white px-4 text-xs font-medium text-ink-800 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <button
                type="submit"
                disabled={!draft.trim()}
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-white transition-all shrink-0 cursor-pointer ${
                  draft.trim() ? 'bg-brand-500 hover:bg-brand-600 shadow-md' : 'bg-ink-200 dark:bg-purple-950/50 cursor-not-allowed opacity-50'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}

          {isHost && !showVoiceRecorder && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-400 dark:text-slate-400 pl-1">
              <input
                type="checkbox"
                id="asAnnouncement"
                checked={asAnnouncement}
                onChange={(e) => setAsAnnouncement(e.target.checked)}
                className="rounded border-ink-300 text-brand-500 focus:ring-brand-400 cursor-pointer"
              />
              <label htmlFor="asAnnouncement" className="cursor-pointer font-medium">
                Send as official host announcement
              </label>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
