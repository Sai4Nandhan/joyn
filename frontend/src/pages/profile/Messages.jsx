import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Search, User, ShieldCheck, Smile, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout.jsx';
import { EmojiPicker } from '../../components/ui/EmojiPicker.jsx';
import {
  listDirectConversationsRequest,
  listDirectMessagesRequest,
  sendDirectMessageRequest,
  markDirectMessagesReadRequest,
} from '../../services/dmService.js';
import { getUserProfile } from '../../services/userService.js';
import { getSocket } from '../../lib/socket.js';

import { getImageUrl } from '../../utils/imageUrl.js';

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserParam = searchParams.get('user');

  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Keep track of active peer details (needed for new conversations not in list yet)
  const [newPeer, setNewPeer] = useState(null);

  // 1. Fetch conversations
  const loadConversations = useCallback(async () => {
    try {
      const convs = await listDirectConversationsRequest();
      setConversations(convs || []);

      // If user parameter is present, handle it
      if (targetUserParam) {
        const found = convs.find((c) => c.id === targetUserParam);
        if (found) {
          setSelectedChatId(targetUserParam);
          setNewPeer(null);
        } else if (!newPeer || newPeer.id !== targetUserParam) {
          // Fetch public profile of the target user to show a new conversation block
          const profile = await getUserProfile(targetUserParam);
          setNewPeer({
            id: profile.id,
            name: profile.name,
            avatar: profile.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`,
            trustScore: profile.trustScore,
            isIdentityVerified: profile.isIdentityVerified,
          });
          setSelectedChatId(targetUserParam);
        }
      } else if (!selectedChatId && convs.length > 0) {
        setSelectedChatId(convs[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setIsLoading(false);
    }
  }, [targetUserParam, newPeer, selectedChatId]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000); // 10s fallback sync
    return () => clearInterval(interval);
  }, [loadConversations]);

  // 2. Fetch messages for active chat
  const loadMessages = useCallback(async () => {
    if (!selectedChatId) return;
    // Skip loading if it is the temporary new peer (no messages yet)
    if (newPeer && selectedChatId === newPeer.id) {
      setMessages([]);
      return;
    }
    try {
      const msgs = await listDirectMessagesRequest(selectedChatId);
      setMessages(msgs || []);
      // Mark read
      await markDirectMessagesReadRequest(selectedChatId);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }, [selectedChatId, newPeer]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time messages listener
  useEffect(() => {
    const socket = getSocket();

    function handleNewDM(message) {
      // Reload the conversations list to sync previews and unread badges
      loadConversations();

      // Check if message belongs to the current chat
      const messageSenderId = message.sender?._id || message.sender;
      if (selectedChatId && messageSenderId.toString() === selectedChatId.toString()) {
        setMessages((prev) => {
          const id = message._id || message.id;
          if (prev.some((m) => (m._id || m.id) === id)) {
            return prev;
          }
          return [...prev, message];
        });

        // Mark incoming messages as read instantly
        markDirectMessagesReadRequest(selectedChatId).catch((err) =>
          console.error('Failed to mark incoming message as read', err)
        );
      }
    }

    socket.on('dm:new', handleNewDM);

    return () => {
      socket.off('dm:new', handleNewDM);
    };
  }, [selectedChatId, loadConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || !selectedChatId) return;

    try {
      const msgContent = draft.trim();
      setDraft('');
      const sentMsg = await sendDirectMessageRequest(selectedChatId, msgContent);

      // If it was a new peer, remove it and let it load normally
      if (newPeer && selectedChatId === newPeer.id) {
        setNewPeer(null);
        setSearchParams({});
      }

      setMessages((prev) => [...prev, sentMsg]);
      loadConversations();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  }

  // Combine real conversations with the temporary new conversation
  const displayConversations = [...conversations];
  if (newPeer && !conversations.some((c) => c.id === newPeer.id)) {
    displayConversations.unshift({
      id: newPeer.id,
      name: newPeer.name,
      avatar: newPeer.avatar,
      trustScore: newPeer.trustScore,
      isIdentityVerified: newPeer.isIdentityVerified,
      lastMessage: 'New Conversation (unsent)',
      time: 'Now',
      unread: false,
    });
  }

  const activeChat = displayConversations.find((c) => c.id === selectedChatId);

  const filteredConversations = displayConversations.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex h-[calc(100vh-7.5rem)] rounded-2xl border border-ink-100 bg-white shadow-card overflow-hidden">
        {/* Chat List Sidebar */}
        <div className={`w-full md:w-80 border-r border-ink-100 flex flex-col bg-white ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-ink-100">
            <h2 className="text-lg font-bold text-ink-900 mb-3">Direct Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 text-xs text-ink-700 outline-none placeholder-ink-300 focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-ink-50">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="text-center py-10 text-xs text-ink-400">No conversations</p>
            ) : (
              filteredConversations.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-ink-50/50 ${
                    chat.id === selectedChatId ? 'bg-brand-50/40 border-l-4 border-brand-500' : ''
                  }`}
                >
                  <img
                    src={getImageUrl(chat.avatar, chat.name)}
                    alt={chat.name}
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0 bg-ink-50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-sm font-semibold text-ink-800 truncate">{chat.name}</span>
                      <span className="text-[10px] text-ink-300 flex-shrink-0">
                        {chat.time ? new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread && (
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-500 self-center flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Active Chat Conversation Pane */}
        {activeChat ? (
          <div className={`flex-1 flex flex-col bg-ink-50/30 ${selectedChatId ? 'flex' : 'hidden md:flex'}`}>
            {/* Header info */}
            <div className="h-16 border-b border-ink-100 bg-white px-4 sm:px-6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden p-1.5 rounded-lg text-ink-500 hover:bg-ink-100 flex-shrink-0"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <img
                  src={getImageUrl(activeChat.avatar, activeChat.name)}
                  alt={activeChat.name}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover bg-ink-50"
                />
                <div>
                  <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1">
                    {activeChat.name}
                    {activeChat.isIdentityVerified && <ShieldCheck className="h-4 w-4 text-accent-green" />}
                  </h3>
                  <p className="text-[10px] text-ink-400 font-semibold uppercase tracking-wider">
                    Trust Score {activeChat.trustScore}
                  </p>
                </div>
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col">
              {messages.map((m, index) => {
                const senderId = m.sender?._id || m.sender?.id || m.sender;
                const isMe = senderId ? (senderId.toString() !== activeChat.id.toString()) : true;
                return (
                  <div
                    key={m.id || index}
                    className={`flex flex-col max-w-[70%] ${
                      isMe ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isMe
                          ? 'bg-brand-500 text-white rounded-br-none'
                          : 'bg-white text-ink-700 border border-ink-100 rounded-bl-none'
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="text-[10px] text-ink-300 mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input message form */}
            <form onSubmit={handleSend} className="p-4 border-t border-ink-100 dark:border-purple-950/20 bg-white dark:bg-[#0D1026] flex items-center gap-2 relative">
              <EmojiPicker onSelectEmoji={(emoji) => setDraft((prev) => prev + emoji)} />
              <input
                type="text"
                placeholder={`Message ${activeChat.name}...`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 h-10 rounded-lg border border-ink-200 dark:border-purple-950/30 bg-white dark:bg-[#151936] dark:text-white px-4 text-sm text-ink-800 outline-none placeholder-ink-300 focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
              />
              <button
                type="submit"
                className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors flex-shrink-0 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-ink-400 bg-ink-50/30">
            <User className="h-10 w-10 text-ink-200 mb-2" />
            <p className="text-sm">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
