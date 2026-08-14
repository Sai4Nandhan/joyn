import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, X, Search } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'popular',
    name: '🔥 Quick Reactions',
    emojis: ['👍', '❤️', '🔥', '😂', '🎉', '👏', '🙌', '💯', '🚀', '⭐', '⚽', '🏏', '☕', '🍺', '🎶', '📍', '🏆', '🥳', '✨', '🤩', '🤝', '🎯'],
  },
  {
    id: 'faces',
    name: '😀 Faces & Feelings',
    emojis: [
      '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗',
      '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐',
      '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲',
      '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱',
      '🥵', '🥶', '😳', '🤪', '😵', '😡', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🤠', '🥳',
    ],
  },
  {
    id: 'activities',
    name: '⚽ Sports & Activities',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🏏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏',
      '🎯', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂',
      '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴',
    ],
  },
  {
    id: 'food',
    name: '☕ Food & Drinks',
    emojis: [
      '☕', '🍵', '🧃', '🥤', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🧊', '🍕', '🍔',
      '🍟', '🌭', '🍿', '🥓', '🥚', '🍳', '🧇', '🥞', '🍞', '🥐', '🥖', '🥨', '🥯', '🧀', '🥗', '🥣',
      '🥪', '🌮', '🌯', '🥙', '🧆', '🥘', '🍲', '🍝', '🍜', '🍲', '🍣', '🍱', '🍛', '🍙', '🍚', '🍘',
    ],
  },
];

export function EmojiPicker({ onSelectEmoji }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('popular');
  const [search, setSearch] = useState('');
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentCatObj = EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];
  
  const displayedEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((emoji) => emoji.includes(search.trim()))
    : currentCatObj.emojis;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 hover:text-brand-500 hover:bg-brand-50/50 dark:hover:bg-purple-950/40 transition-all cursor-pointer"
        title="Add emoji"
      >
        <Smile className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-12 left-0 z-50 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#0E1126] border border-ink-100 dark:border-purple-950/40 shadow-2xl p-3"
          >
            {/* Header / Tabs */}
            <div className="flex items-center justify-between border-b border-ink-100 dark:border-purple-950/20 pb-2 mb-2">
              <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                {EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activeCategory === cat.id && !search
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-ink-500 dark:text-slate-400 hover:bg-ink-100 dark:hover:bg-purple-950/40'
                    }`}
                  >
                    {cat.name.split(' ')[0]} {cat.name.split(' ')[1]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-ink-400 hover:text-ink-700 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-purple-950/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-1 scrollbar-thin">
              {displayedEmojis.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  type="button"
                  onClick={() => {
                    onSelectEmoji(emoji);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-xl hover:bg-brand-500/10 hover:scale-125 transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
