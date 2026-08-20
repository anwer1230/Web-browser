import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Send,
  Plus,
  Sparkles,
  Camera,
  Play,
  Pause,
  Share2,
  MoreVertical,
  Clock,
  Timer,
  Flame,
} from 'lucide-react';
import { TelegramStory } from '../types';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: TelegramStory[];
  initialIndex?: number;
  onAddStory?: (newStory: TelegramStory) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  onClose,
  stories,
  initialIndex = 0,
  onAddStory,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Story Creation States
  const [newCaption, setNewCaption] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [storyDurationHours, setStoryDurationHours] = useState<number>(24); // 6, 12, 24, 48 hours or test preset

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const currentStory = stories[currentIndex] || stories[0];

  useEffect(() => {
    if (!isOpen || !currentStory || isPaused || showCreateModal) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2; // 5 seconds duration
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentIndex, isPaused, stories, showCreateModal]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const toggleLike = (storyId: string) => {
    setLiked((prev) => {
      const isCurrentlyLiked = prev[storyId];
      const nextLiked = !isCurrentlyLiked;

      setLikesCount((prevCounts) => {
        const base = prevCounts[storyId] ?? (currentStory?.reactions_count || 12);
        return {
          ...prevCounts,
          [storyId]: nextLiked ? base + 1 : base - 1,
        };
      });

      return { ...prev, [storyId]: nextLiked };
    });
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    alert(`تم إرسال الرد المباشر لقصة ${currentStory?.user_name}: "${replyText}"`);
    setReplyText('');
  };

  const handlePublishNewStory = () => {
    if (!newMediaUrl.trim()) return;
    const now = Date.now();
    const durationMs = storyDurationHours * 3600 * 1000;
    const expiresAt = new Date(now + durationMs).toISOString();
    const createdAt = new Date(now).toISOString();

    const created: TelegramStory = {
      id: `story_${now}`,
      user_id: 'me',
      user_name: 'حسابي الشغّال (أنا)',
      user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      media_url: newMediaUrl,
      media_type: 'photo',
      caption: newCaption || 'قصة جديدة عبر تليجرام رسمياً 🌟',
      created_at: createdAt,
      expires_at: expiresAt,
      date: 'الآن',
      views_count: 1,
      reactions_count: 0,
      is_viewed: false,
    };
    if (onAddStory) onAddStory(created);
    setShowCreateModal(false);
    setNewCaption('');
    setNewMediaUrl('');
    alert('🎉 تم نشر قصتك الجديدة بنجاح على حسابك!');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center select-none text-white dir-rtl animate-fadeIn">
      {/* Background Dim Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Main Story Container */}
      <div className="relative w-full max-w-sm sm:max-w-md h-[92vh] max-h-[820px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between z-10 my-auto">
        
        {/* Top Story Progress Bars */}
        <div className="absolute top-0 left-0 right-0 p-3 pt-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 space-y-2">
          <div className="flex gap-1.5 items-center">
            {stories.map((s, i) => (
              <div key={s.id} className="flex-1 bg-white/30 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-100 ease-linear"
                  style={{
                    width:
                      i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Info Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  currentStory?.user_avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                }
                alt={currentStory?.user_name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-400"
              />
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>{currentStory?.user_name}</span>
                  <span className="bg-sky-500/30 text-sky-300 text-[9px] px-1.5 py-0.5 rounded-full font-mono">
                    قصة تليجرام
                  </span>
                  {currentStory?.expires_at && (
                    <span className="bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.5 rounded-full font-mono flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {(() => {
                        const diffMs = new Date(currentStory.expires_at).getTime() - Date.now();
                        if (diffMs <= 0) return 'منتهية';
                        const mins = Math.floor(diffMs / 60000);
                        if (mins < 60) return `متبقي ${mins} د`;
                        const hrs = Math.floor(mins / 60);
                        return `متبقي ${hrs} س`;
                      })()}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-300 font-mono opacity-80">
                  {currentStory?.date}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sky-300 transition-colors"
                title="نشر قصة جديدة"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                title={isPaused ? 'استئناف' : 'إيقاف مؤقت'}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-slate-300 hover:text-white"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Story Media Viewer Body */}
        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
          <img
            src={currentStory?.media_url}
            alt={currentStory?.caption || 'Story media'}
            className="w-full h-full object-cover"
          />

          {/* Navigation Click Hotspots */}
          <button
            onClick={handlePrev}
            className="absolute right-0 top-0 bottom-0 w-1/3 bg-transparent hover:bg-white/5 transition-colors flex items-center justify-start pr-2 opacity-0 hover:opacity-100"
          >
            <ChevronRight className="w-8 h-8 text-white/80" />
          </button>

          <button
            onClick={handleNext}
            className="absolute left-0 top-0 bottom-0 w-1/3 bg-transparent hover:bg-white/5 transition-colors flex items-center justify-end pl-2 opacity-0 hover:opacity-100"
          >
            <ChevronLeft className="w-8 h-8 text-white/80" />
          </button>
        </div>

        {/* Story Caption & Interactive Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/70 to-transparent z-20 space-y-3">
          {currentStory?.caption && (
            <p className="text-xs font-semibold text-slate-100 leading-relaxed drop-shadow bg-black/30 p-2 rounded-xl backdrop-blur-xs">
              {currentStory.caption}
            </p>
          )}

          {/* Quick Stats & Reaction Bar */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-3 text-slate-300 text-[11px] font-mono">
              <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/10">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>{currentStory?.views_count || 42} مشاهدة</span>
              </span>
              <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/10">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>
                  {likesCount[currentStory?.id] ?? (currentStory?.reactions_count || 12)} إعجاب
                </span>
              </span>
            </div>

            <button
              onClick={() => currentStory && toggleLike(currentStory.id)}
              className={`p-2 rounded-full border transition-transform active:scale-125 ${
                liked[currentStory?.id]
                  ? 'bg-rose-500 border-rose-400 text-white'
                  : 'bg-black/40 border-white/20 text-white hover:bg-white/20'
              }`}
              title="إعجاب بالقصة"
            >
              <Heart
                className={`w-4 h-4 ${liked[currentStory?.id] ? 'fill-current' : ''}`}
              />
            </button>
          </div>

          {/* Reply Message Input Bar */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`إرسال رسالة رد لـ ${currentStory?.user_name}...`}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-full px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
            />
            <button
              onClick={handleSendReply}
              className="p-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-full transition-colors shrink-0"
              title="إرسال الرد"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal to Publish New Story */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="font-bold text-sm text-sky-400 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>نشر قصة تليجرام جديدة (New Story)</span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  رابط صورة القصة (Image URL):
                </label>
                <input
                  type="text"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  نص تعليق القصة (Caption):
                </label>
                <textarea
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="اكتب تعليقك على القصة هنا..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Story Expiration Duration */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>مدة بقاء القصة قبل الحذف (Auto-Expire):</span>
                  <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {storyDurationHours} ساعة
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { hours: 6, label: '6 ساعات' },
                    { hours: 12, label: '12 ساعة' },
                    { hours: 24, label: '24 ساعة' },
                    { hours: 48, label: '48 ساعة' },
                  ].map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setStoryDurationHours(opt.hours)}
                      className={`p-1.5 rounded-lg border text-center font-bold text-[11px] transition-colors ${
                        storyDurationHours === opt.hours
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>سيتم إرسال إشعار تلقائي لك قبل 30 دقيقة من انتهاء صلاحية القصة.</span>
                </div>
              </div>

              {/* Quick Image Presets */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">أو اختر من المعاينات السريعة:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
                    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
                    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80',
                  ].map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      onClick={() => setNewMediaUrl(url)}
                      alt="Preset"
                      className="h-16 w-full rounded-xl object-cover cursor-pointer hover:opacity-80 border border-slate-700"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handlePublishNewStory}
                className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>نشر القصة الآن</span>
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
