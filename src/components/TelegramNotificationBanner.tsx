import React, { useEffect, useState } from 'react';
import { X, ExternalLink, BellOff, Volume2 } from 'lucide-react';
import { ChatAvatar } from './ChatAvatar';

export interface TelegramNotificationItem {
  id: string;
  chat_id: string | number;
  msg_id?: string | number;
  title: string;
  sender_name?: string;
  sender_avatar?: string;
  chat_avatar?: string;
  text: string;
  type?: string;
  chat_type?: string;
  is_group?: boolean;
  is_channel?: boolean;
  date?: number;
  action_label?: string;
  action_type?: 'chat' | 'story' | 'settings';
  story_index?: number;
}

interface TelegramNotificationBannerProps {
  notification: TelegramNotificationItem | null;
  onOpenChat: (chatId: string | number, msgId?: string | number) => void;
  onOpenStory?: (storyIndex?: number) => void;
  onMuteChat?: (chatId: string | number) => void;
  onDismiss: () => void;
  lang?: 'ar' | 'en';
}

export const TelegramNotificationBanner: React.FC<TelegramNotificationBannerProps> = ({
  notification,
  onOpenChat,
  onOpenStory,
  onMuteChat,
  onDismiss,
  lang = 'ar',
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      // Give slightly more time (7 seconds) for story expiration alerts
      const displayDuration = notification.action_type === 'story' ? 7000 : 5000;
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, displayDuration);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [notification, onDismiss]);

  if (!notification || !visible) return null;

  const isRtl = lang === 'ar';
  const isStoryNotif = notification.action_type === 'story';

  const handleMainAction = () => {
    if (isStoryNotif && onOpenStory) {
      onOpenStory(notification.story_index ?? 0);
    } else {
      onOpenChat(notification.chat_id, notification.msg_id);
    }
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md transition-all duration-300 ease-out transform"
      style={{
        animation: 'slideDownNotif 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        className={`bg-slate-900/95 backdrop-blur-md border rounded-2xl shadow-2xl p-3.5 text-slate-100 flex flex-col gap-2.5 relative overflow-hidden ${
          isStoryNotif ? 'border-amber-500/50 ring-1 ring-amber-500/30' : 'border-sky-500/30'
        }`}
        style={{
          boxShadow: isStoryNotif
            ? '0 12px 35px -5px rgba(245, 158, 11, 0.3), 0 8px 16px -6px rgba(0, 0, 0, 0.7)'
            : '0 12px 35px -5px rgba(14, 165, 233, 0.25), 0 8px 16px -6px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Animated Accent Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            isStoryNotif
              ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500'
              : 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500'
          }`}
          style={{
            animation: `shrinkBar ${isStoryNotif ? '7s' : '5s'} linear forwards`,
          }}
        />

        <div
          className="flex items-start gap-3 cursor-pointer"
          onClick={handleMainAction}
        >
          {/* Real Avatar */}
          {isStoryNotif && notification.sender_avatar ? (
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 shrink-0">
              <img
                src={notification.sender_avatar}
                alt={notification.title}
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-900"
              />
              <span className="absolute -bottom-1 -right-1 text-xs">⏳</span>
            </div>
          ) : (
            <ChatAvatar
              id={notification.chat_id}
              title={notification.title || notification.sender_name || 'تليجرام'}
              avatar={notification.chat_avatar || notification.sender_avatar}
              photo={notification.chat_avatar || notification.sender_avatar}
              type={notification.chat_type || (notification.is_channel ? 'channel' : notification.is_group ? 'group' : 'private')}
              size="md"
            />
          )}

          {/* Body Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <div className={`font-semibold text-sm truncate flex items-center gap-1.5 ${isStoryNotif ? 'text-amber-400' : 'text-sky-300'}`}>
                {notification.title}
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                <Volume2 className={`w-3 h-3 ${isStoryNotif ? 'text-amber-400' : 'text-sky-400'}`} />
                {lang === 'ar' ? 'الآن' : 'Now'}
              </span>
            </div>

            {/* Sender and Message Preview */}
            <div className="text-xs text-slate-200 mt-0.5 line-clamp-2 leading-relaxed">
              {notification.is_group && notification.sender_name && (
                <span className="font-medium text-amber-300/90 ml-1">
                  {notification.sender_name}:
                </span>
              )}
              <span>{notification.text || (lang === 'ar' ? 'رسالة جديدة' : 'New message')}</span>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition shrink-0"
            title={lang === 'ar' ? 'إغلاق' : 'Dismiss'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
          {!isStoryNotif && onMuteChat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMuteChat(notification.chat_id);
                setVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="px-2.5 py-1 text-[11px] rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition flex items-center gap-1"
            >
              <BellOff className="w-3 h-3" />
              <span>{lang === 'ar' ? 'كتم التنبيهات' : 'Mute'}</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMainAction();
            }}
            className={`px-3.5 py-1 text-[11px] font-medium rounded-lg text-slate-950 transition flex items-center gap-1 shadow-sm ${
              isStoryNotif
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 font-bold'
                : 'bg-sky-500 hover:bg-sky-400'
            }`}
          >
            <ExternalLink className="w-3 h-3" />
            <span>
              {notification.action_label ||
                (isStoryNotif
                  ? lang === 'ar'
                    ? 'مشاهدة وتجديد القصة'
                    : 'View & Renew Story'
                  : lang === 'ar'
                  ? 'الذهاب للرسالة'
                  : 'Jump to Message')}
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideDownNotif {
          from {
            opacity: 0;
            transform: translateY(-24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shrinkBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
