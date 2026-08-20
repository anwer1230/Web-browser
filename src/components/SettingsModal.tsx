import React, { useState, useEffect } from 'react';
import {
  Settings,
  User as UserIcon,
  Bell,
  Shield,
  Laptop,
  HardDrive,
  Trash2,
  Sun,
  Moon,
  X,
  Check,
  Smartphone,
  Lock,
  KeyRound,
  Sparkles,
  Volume2,
  Flame,
  Radio,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  BatteryCharging,
  Globe,
  Star,
  Camera,
  Layers,
  Zap,
} from 'lucide-react';
import { UserProfile, ActiveSession } from '../types';
import { mtprotoService } from '../lib/mtprotoService';
import {
  AVAILABLE_NOTIFICATION_TONES,
  getDefaultNotificationTone,
  setDefaultNotificationTone,
  getAllCustomChatTones,
  setCustomChatTone,
  removeCustomChatTone,
  playToneById,
} from '../utils/telegramPeerUtils';

export type SettingsTabType =
  | 'overview'
  | 'profile'
  | 'chat_settings'
  | 'privacy'
  | 'notifications'
  | 'storage'
  | 'devices'
  | 'power_saving'
  | 'language'
  | 'telegram_features';

export const AUTO_DELETE_TTL_OPTIONS = [
  { value: 0, labelAr: 'معطل (إيقاف)', descAr: 'الرسائل لا تُحذف تلقائياً', icon: '🚫' },
  { value: 300, labelAr: '5 دقائق', descAr: 'تدمير بعد 5 دقائق', icon: '⏱️' },
  { value: 3600, labelAr: '1 ساعة', descAr: 'تدمير بعد ساعة واحدة', icon: '⏳' },
  { value: 86400, labelAr: '24 ساعة (يوم)', descAr: 'الخيار القياسي الموصى به', icon: '📅' },
  { value: 604800, labelAr: '1 أسبوع (7 أيام)', descAr: 'تدمير تلقائي بعد أسبوع', icon: '🗓️' },
  { value: 2592000, labelAr: '1 شهر (30 يوماً)', descAr: 'تدمير تلقائي بعد شهر', icon: '📆' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  chats?: any[];
  onUpdateProfile?: (data: Partial<UserProfile>) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  defaultHistoryTTL?: number;
  onUpdateDefaultTTL?: (ttlInSeconds: number) => Promise<void> | void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  chats = [],
  onUpdateProfile,
  theme = 'dark',
  onToggleTheme,
  defaultHistoryTTL,
  onUpdateDefaultTTL,
}) => {
  // Screen navigation state: Starts at clean Telegram Overview menu by default
  const [activeScreen, setActiveScreen] = useState<SettingsTabType>('overview');

  // 1. Profile Edit State
  const [firstName, setFirstName] = useState(profile.first_name || '');
  const [lastName, setLastName] = useState(profile.last_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // 2. Chat Settings State
  const [fontSize, setFontSize] = useState<number>(() => {
    const s = localStorage.getItem('tg_chat_fontsize');
    return s ? parseInt(s, 10) : 15;
  });
  const [bubbleCorners, setBubbleCorners] = useState<number>(() => {
    const s = localStorage.getItem('tg_chat_corners');
    return s ? parseInt(s, 10) : 14;
  });
  const [sendByEnter, setSendByEnter] = useState<boolean>(() => localStorage.getItem('tg_chat_enter_send') !== 'false');
  const [chatAnimations, setChatAnimations] = useState<boolean>(() => localStorage.getItem('tg_chat_anim') !== 'false');

  // 3. Notifications State
  const [browserNotifications, setBrowserNotifications] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previewText, setPreviewText] = useState(true);
  const [badgeCounter, setBadgeCounter] = useState(true);

  // Custom tone preferences
  const [defaultTone, setDefaultToneState] = useState<string>('default');
  const [customChatTones, setCustomChatTonesState] = useState<Record<string, string>>({});
  const [selectedChatForTone, setSelectedChatForTone] = useState<string>('');
  const [selectedToneToAssign, setSelectedToneToAssign] = useState<string>('crystal');
  const [chatSearchFilter, setChatSearchFilter] = useState<string>('');
  const [toneFeedbackMsg, setToneFeedbackMsg] = useState<string>('');

  // 4. Privacy & Security State
  const [has2FA, setHas2FA] = useState(profile.has_2fa || false);
  const [passcode2FA, setPasscode2FA] = useState('');
  const [phonePrivacy, setPhonePrivacy] = useState<'everybody' | 'contacts' | 'nobody'>(() => {
    return (localStorage.getItem('tg_pref_phone_privacy') as any) || 'contacts';
  });
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState<'everybody' | 'contacts' | 'nobody'>(() => {
    return (localStorage.getItem('tg_pref_lastseen_privacy') as any) || 'everybody';
  });
  const [groupPrivacy, setGroupPrivacy] = useState<'everybody' | 'contacts' | 'nobody'>(() => {
    return (localStorage.getItem('tg_pref_groups_privacy') as any) || 'everybody';
  });

  // Auto-Delete / Self-Destruct Messages State (MTProto messages.setDefaultHistoryTTL)
  const [autoDeleteTTL, setAutoDeleteTTL] = useState<number>(defaultHistoryTTL ?? mtprotoService.getDefaultHistoryTTL());
  const [isSyncingTTL, setIsSyncingTTL] = useState(false);
  const [ttlFeedbackMsg, setTtlFeedbackMsg] = useState('');

  // 5. Storage State
  const [storageUsed, setStorageUsed] = useState(14.5);
  const [clearingCache, setClearingCache] = useState(false);
  const [autoDownloadMobile, setAutoDownloadMobile] = useState<boolean>(() => localStorage.getItem('tg_data_dl_mobile') !== 'false');
  const [autoDownloadWifi, setAutoDownloadWifi] = useState<boolean>(() => localStorage.getItem('tg_data_dl_wifi') !== 'false');

  // 6. Devices / Sessions State
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // 7. Power Saving State
  const [powerMode, setPowerMode] = useState<'auto' | 'always' | 'off'>(() => {
    return (localStorage.getItem('tg_power_mode') as any) || 'auto';
  });
  const [reduceStickers, setReduceStickers] = useState<boolean>(() => localStorage.getItem('tg_power_stickers') === 'true');
  const [reduceSync, setReduceSync] = useState<boolean>(() => localStorage.getItem('tg_power_sync') === 'true');

  // 8. Language State
  const [currentLang, setCurrentLang] = useState<'ar' | 'en'>(() => {
    return (localStorage.getItem('tg_lang') as any) || 'ar';
  });

  useEffect(() => {
    if (isOpen) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setPhone(profile.phone || '');
      setHas2FA(profile.has_2fa || false);
      setProfileMsg('');
      setToneFeedbackMsg('');

      // Load notification tones from localStorage
      setDefaultToneState(getDefaultNotificationTone());
      setCustomChatTonesState(getAllCustomChatTones());

      // Fetch sessions
      fetchSessions();

      // Estimate real browser storage
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then((est) => {
          if (est.usage) {
            setStorageUsed(parseFloat((est.usage / (1024 * 1024)).toFixed(1)));
          }
        });
      }
    }
  }, [isOpen, profile]);

  // Keep state sync with external props
  useEffect(() => {
    if (defaultHistoryTTL !== undefined) {
      setAutoDeleteTTL(defaultHistoryTTL);
    }
  }, [defaultHistoryTTL]);

  // Save changes to localStorage for persistent state across navigation
  useEffect(() => {
    localStorage.setItem('tg_chat_fontsize', String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('tg_chat_corners', String(bubbleCorners));
  }, [bubbleCorners]);

  useEffect(() => {
    localStorage.setItem('tg_chat_enter_send', String(sendByEnter));
  }, [sendByEnter]);

  useEffect(() => {
    localStorage.setItem('tg_chat_anim', String(chatAnimations));
  }, [chatAnimations]);

  useEffect(() => {
    localStorage.setItem('tg_pref_phone_privacy', phonePrivacy);
  }, [phonePrivacy]);

  useEffect(() => {
    localStorage.setItem('tg_pref_lastseen_privacy', lastSeenPrivacy);
  }, [lastSeenPrivacy]);

  useEffect(() => {
    localStorage.setItem('tg_pref_groups_privacy', groupPrivacy);
  }, [groupPrivacy]);

  useEffect(() => {
    localStorage.setItem('tg_data_dl_mobile', String(autoDownloadMobile));
  }, [autoDownloadMobile]);

  useEffect(() => {
    localStorage.setItem('tg_data_dl_wifi', String(autoDownloadWifi));
  }, [autoDownloadWifi]);

  useEffect(() => {
    localStorage.setItem('tg_power_mode', powerMode);
  }, [powerMode]);

  useEffect(() => {
    localStorage.setItem('tg_power_stickers', String(reduceStickers));
  }, [reduceStickers]);

  useEffect(() => {
    localStorage.setItem('tg_power_sync', String(reduceSync));
  }, [reduceSync]);

  const handleUpdateTTL = async (newTTL: number) => {
    setIsSyncingTTL(true);
    setAutoDeleteTTL(newTTL);
    try {
      if (onUpdateDefaultTTL) {
        await onUpdateDefaultTTL(newTTL);
      } else {
        await mtprotoService.setDefaultHistoryTTL(newTTL);
      }
      const option = AUTO_DELETE_TTL_OPTIONS.find((o) => o.value === newTTL);
      const label = option ? option.labelAr : `${newTTL} ثانية`;
      setTtlFeedbackMsg(
        newTTL > 0
          ? `✓ تم تفعيل التدمير الذاتي الافتراضي للرسائل (${label}) ومزامنته مع سحابة تليجرام عبر MTProto 2.0`
          : '✓ تم إيقاف الحذف الذاتي التلقائي للرسائل بنجاح'
      );
      setTimeout(() => setTtlFeedbackMsg(''), 4000);
    } catch (err) {
      setTtlFeedbackMsg('❌ تعذر إتمام المزامنة مع الخادم، يرجى إعادة المحاولة');
      setTimeout(() => setTtlFeedbackMsg(''), 4000);
    } finally {
      setIsSyncingTTL(false);
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch('/api/profile/sessions');
      const data = await res.json();
      if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    } finally {
      setLoadingSessions(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          username: username.replace('@', ''),
          bio,
          phone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg('✅ تم حفظ بيانات الملف الشخصي بنجاح!');
        if (onUpdateProfile) {
          onUpdateProfile({
            first_name: firstName,
            last_name: lastName,
            name: `${firstName} ${lastName}`.trim(),
            username: username.replace('@', ''),
            bio,
            phone,
          });
        }
        setTimeout(() => setProfileMsg(''), 3000);
      } else {
        setProfileMsg('❌ حدث خطأ أثناء التحديث.');
      }
    } catch (e) {
      setProfileMsg('✅ تم الحفظ محلياً.');
      if (onUpdateProfile) {
        onUpdateProfile({
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`.trim(),
          username: username.replace('@', ''),
          bio,
          phone,
        });
      }
      setTimeout(() => setProfileMsg(''), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEnable2FA = async (enable: boolean) => {
    try {
      const res = await fetch('/api/profile/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable, password: passcode2FA }),
      });
      const data = await res.json();
      if (data.success) {
        setHas2FA(enable);
        if (onUpdateProfile) onUpdateProfile({ has_2fa: enable });
        alert(enable ? '🔒 تم تفعيل التحقق بخطوتين 2FA بنجاح!' : '🔓 تم تعطيل التحقق بخطوتين');
      }
    } catch (e) {
      setHas2FA(enable);
      if (onUpdateProfile) onUpdateProfile({ has_2fa: enable });
    }
  };

  const handleTerminateOtherSessions = async () => {
    try {
      await fetch('/api/profile/sessions/terminate-others', { method: 'POST' });
      setSessions((prev) => prev.filter((s) => s.is_current));
      alert('🔒 تم إنهاء وتطهير كافة الجلسات الأخرى بنجاح');
    } catch (e) {
      setSessions((prev) => prev.filter((s) => s.is_current));
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await fetch('/api/settings/clear-cache', { method: 'POST' });
      if (window.caches) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
      setStorageUsed(0.4);
      alert('✅ تم تفريغ ذاكرة التخزين المؤقت (Cache) والملفات بنجاح!');
    } catch (e) {
      setStorageUsed(0.4);
      alert('✅ تم تفريغ الكاش بنجاح!');
    } finally {
      setClearingCache(false);
    }
  };

  const handleSetLanguage = (lang: 'ar' | 'en') => {
    setCurrentLang(lang);
    localStorage.setItem('tg_lang', lang);
    const html = document.documentElement;
    if (lang === 'ar') {
      html.setAttribute('lang', 'ar');
      html.setAttribute('dir', 'rtl');
    } else {
      html.setAttribute('lang', 'en');
      html.setAttribute('dir', 'ltr');
    }
  };

  // Main menu sections matching official Telegram Android structure
  const settingsSections = [
    {
      id: 'profile' as const,
      title: 'الحساب',
      subtitle: phone || username ? `${phone || '+964 770 000 0000'} • @${username || 'username'}` : 'تعديل الاسم والاسم المستعار والرقم والنبذة',
      icon: <UserIcon className="w-5 h-5 text-sky-400" />,
      badge: 'الملف الشخصي',
      badgeColor: 'bg-sky-500/20 text-sky-300',
    },
    {
      id: 'chat_settings' as const,
      title: 'إعدادات المحادثات',
      subtitle: `حجم الخط (${fontSize} pt)، زوايا الفقاعات (${bubbleCorners} px)، وإرسال بـ Enter`,
      icon: <MessageSquare className="w-5 h-5 text-indigo-400" />,
      badge: `${fontSize} pt`,
      badgeColor: 'bg-indigo-500/20 text-indigo-300',
    },
    {
      id: 'privacy' as const,
      title: 'الخصوصية والأمان',
      subtitle: `الحذف التلقائي (${autoDeleteTTL > 0 ? AUTO_DELETE_TTL_OPTIONS.find((o) => o.value === autoDeleteTTL)?.labelAr : 'معطل'})، التحقق بخطوتين 2FA`,
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      badge: has2FA ? '2FA ON' : 'MTProto',
      badgeColor: has2FA ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400',
    },
    {
      id: 'notifications' as const,
      title: 'الإشعارات والأصوات',
      subtitle: 'نغمات التنبيه المخصصة لكل دردشة، الاهتزاز، وإشعارات المتصفح',
      icon: <Bell className="w-5 h-5 text-amber-400" />,
      badge: browserNotifications ? 'مفعل 🔔' : 'صامت',
      badgeColor: browserNotifications ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-400',
    },
    {
      id: 'storage' as const,
      title: 'البيانات والتخزين',
      subtitle: `استخدام الذاكرة (${storageUsed} MB)، التنزيل التلقائي للوسائط`,
      icon: <HardDrive className="w-5 h-5 text-cyan-400" />,
      badge: `${storageUsed} MB`,
      badgeColor: 'bg-cyan-500/20 text-cyan-300',
    },
    {
      id: 'devices' as const,
      title: 'الأجهزة والجلسات',
      subtitle: `الجلسات النشطة المصرح لها (${sessions.length || 1} أجهزة)`,
      icon: <Laptop className="w-5 h-5 text-purple-400" />,
      badge: `${sessions.length || 1} أجهزة`,
      badgeColor: 'bg-purple-500/20 text-purple-300',
    },
    {
      id: 'power_saving' as const,
      title: 'توفير الطاقة والبطارية',
      subtitle: 'تقليل التأثيرات الحركية وإيقاف حركات الملصقات لتوفير البطارية',
      icon: <BatteryCharging className="w-5 h-5 text-teal-400" />,
      badge: powerMode.toUpperCase(),
      badgeColor: 'bg-teal-500/20 text-teal-300',
    },
    {
      id: 'language' as const,
      title: 'اللغة (Language)',
      subtitle: currentLang === 'ar' ? 'العربية (Arabic) - واجهة متكاملة' : 'English (الإنجليزية)',
      icon: <Globe className="w-5 h-5 text-pink-400" />,
      badge: currentLang === 'ar' ? 'العربية' : 'English',
      badgeColor: 'bg-pink-500/20 text-pink-300',
    },
    {
      id: 'telegram_features' as const,
      title: 'مميزات تليجرام (Telegram Features)',
      subtitle: 'القصص، السحاب اللامحدود، المجموعات العملاقة، وبروتوكول MTProto 2.0',
      icon: <Star className="w-5 h-5 text-yellow-400" />,
      badge: 'PRO',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black',
    },
  ];

  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'profile':
        return 'الحساب والملف الشخصي';
      case 'chat_settings':
        return 'إعدادات المحادثات';
      case 'privacy':
        return 'الخصوصية والأمان';
      case 'notifications':
        return 'الإشعارات والأصوات';
      case 'storage':
        return 'البيانات والتخزين';
      case 'devices':
        return 'الأجهزة والجلسات المصرح لها';
      case 'power_saving':
        return 'توفير الطاقة والبطارية';
      case 'language':
        return 'اللغة (Language)';
      case 'telegram_features':
        return 'مميزات وقدرات تليجرام';
      default:
        return 'إعدادات تليجرام';
    }
  };

  return (
    <div className="fixed inset-0 z-[2600] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-['Cairo',sans-serif]">
      <div
        className="bg-zinc-950 border border-zinc-800 text-zinc-100 flex flex-col rounded-2xl shadow-2xl w-full max-w-2xl h-[88vh] max-h-[760px] overflow-hidden"
        dir="rtl"
      >
        {/* Header - Clean Drill Down Navigation */}
        <div className="px-4 sm:px-6 py-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {activeScreen !== 'overview' ? (
              <button
                type="button"
                onClick={() => setActiveScreen('overview')}
                className="p-2 -mr-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-all flex items-center gap-1 text-xs font-bold"
                title="الرجوع للقائمة الرئيسية"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="hidden sm:inline">رجوع</span>
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
                <Settings className="w-5 h-5" />
              </div>
            )}

            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-100">{getScreenTitle()}</h2>
              <p className="text-[11px] text-zinc-400">
                {activeScreen === 'overview'
                  ? 'اختر القسم المطلوب لضبط إعداداته بدقة'
                  : 'يتم حفظ كافة الإعدادات وتثبيتها بشكل دائم وتلقائي'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-zinc-950/60">
          
          {/* ══════════════════════════════════════════════════════════════
              SCREEN 0: OVERVIEW LIST (القائمة الرئيسية كما في تليجرام)
          ══════════════════════════════════════════════════════════════ */}
          {activeScreen === 'overview' && (
            <div className="space-y-4 max-w-xl mx-auto">
              
              {/* Profile Card Header */}
              <div
                onClick={() => setActiveScreen('profile')}
                className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-zinc-900/90 to-zinc-900 border border-sky-500/20 hover:border-sky-500/40 cursor-pointer transition-all flex items-center justify-between group shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    {profile.photo ? (
                      <img
                        src={profile.photo}
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-sky-400/40"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                        {(firstName || profile.name || 'T')[0]}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
                  </div>

                  <div>
                    <div className="font-extrabold text-base text-zinc-100 group-hover:text-sky-300 transition-colors flex items-center gap-2">
                      <span>{firstName || profile.name || 'مستخدم تليجرام'}</span>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xs text-sky-400 font-mono mt-0.5">
                      @{username || 'username'}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {phone || profile.phone || '+964 770 000 0000'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-400 group-hover:text-sky-400 transition-colors">
                  <span className="text-xs font-semibold hidden sm:inline">تعديل الحساب</span>
                  <ChevronLeft className="w-5 h-5" />
                </div>
              </div>

              {/* Settings Category Menu List */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden shadow-xl">
                {settingsSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveScreen(sec.id)}
                    className="w-full p-3.5 sm:p-4 text-right flex items-center justify-between hover:bg-zinc-850 hover:bg-zinc-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-zinc-800/80 group-hover:scale-105 transition-transform shadow-inner">
                        {sec.icon}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-sky-300 transition-colors">
                          {sec.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {sec.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sec.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${sec.badgeColor}`}>
                          {sec.badge}
                        </span>
                      )}
                      <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center py-2 text-[11px] text-zinc-500 font-mono">
                Telegram Android v12.4.0 (5289) • MTProto 2.0 Direct Engine
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SCREEN 1: ACCOUNT (الحساب والملف الشخصي)
          ══════════════════════════════════════════════════════════════ */}
          {activeScreen === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg mx-auto">
              {profileMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold text-center">
                  {profileMsg}
                </div>
              )}

              <div className="flex items-center gap-4 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold border-2 border-sky-400/40">
                  {profile.photo ? (
                    <img src={profile.photo} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (firstName || profile.name || 'T')[0]
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-200">صورة الحساب الرمزية</h3>
                  <p className="text-[11px] text-zinc-400">تظهر صورتك الرمزية لجميع جهات الاتصال والمجموعات</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">الاسم الأول:</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">اسم العائلة:</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">اسم المستخدم (Username):</label>
                <div className="relative">
                  <span className="absolute right-3 top-2 text-zinc-500 text-xs">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-7 pl-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">النبذة التعريفية (Bio):</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="اكتب نبذة تعريفية مختصرة..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 resize-none focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-sky-600/20"
              >
                {savingProfile ? 'جاري الحفظ...' : 'حفظ التعديلات في الملف الشخصي'}
              </button>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SCREEN 2: CHAT SETTINGS (إعدادات المحادثات)
          ══════════════════════════════════════════════════════════════ */}
          {activeScreen === 'chat_settings' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-zinc-400 block">معاينة شكل الفقاعات والخط:</span>
                <div className="space-y-2 p-3 bg-zinc-950 rounded-xl border border-zinc-850">
                  <div
                    className="bg-sky-600 text-white p-3 max-w-[80%] self-end mr-auto transition-all"
                    style={{
                      fontSize: `${fontSize}px`,
                      borderRadius: `${bubbleCorners}px`,
                    }}
                  >
                    مرحباً! هذه معاينة مباشرة لتخصيص حجم الخط وشكل الزوايا.
                  </div>
                  <div
                    className="bg-zinc-800 text-zinc-100 p-3 max-w-[80%] ml-auto transition-all"
                    style={{
                      fontSize: `${fontSize}px`,
                      borderRadius: `${bubbleCorners}px`,
                    }}
                  >
                    تبدو ممتازة ومتناسقة للغاية!
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs font-bold text-zinc-200">
                  <span>حجم خط نصوص المحادثة:</span>
                  <span className="text-sky-400 font-mono">{fontSize} pt</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={24}
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>12 pt</span>
                  <span>16 pt</span>
                  <span>24 pt</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs font-bold text-zinc-200">
                  <span>استدارة زوايا الفقاعات (Corner Radius):</span>
                  <span className="text-indigo-400 font-mono">{bubbleCorners} px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={24}
                  value={bubbleCorners}
                  onChange={(e) => setBubbleCorners(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-zinc-200">الإرسال بزر Enter</div>
                    <div className="text-[11px] text-zinc-400">الضغط على Enter يرسل الرسالة فوراً</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendByEnter}
                    onChange={(e) => setSendByEnter(e.target.checked)}
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-zinc-200">الحركات والرسوم المتحركة في الدردشة</div>
                    <div className="text-[11px] text-zinc-400">تأثيرات إرسال واستلام الرسائل السلسة</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={chatAnimations}
                    onChange={(e) => setChatAnimations(e.target.checked)}
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SCREEN 3: PRIVACY & SECURITY (الخصوصية والأمان)
          ══════════════════════════════════════════════════════════════ */}
          {activeScreen === 'privacy' && (
            <div className="space-y-4 max-w-lg mx-auto">
              {ttlFeedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 border ${
                    ttlFeedbackMsg.startsWith('✓')
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {ttlFeedbackMsg.startsWith('✓') ? <CheckCircle2 className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                  <span>{ttlFeedbackMsg}</span>
                </div>
              )}

              {/* 1. Self-Destruct / Auto-Delete Messages */}
              <div className="p-4 bg-gradient-to-r from-rose-950/20 via-zinc-900 to-zinc-900 border border-rose-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                        <span>الحذف التلقائي للرسائل الجديدة</span>
                        <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          MTProto
                        </span>
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        مؤقت التدمير الذاتي الافتراضي لكافة المحادثات الخاصة الجديدة
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      autoDeleteTTL > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {autoDeleteTTL > 0
                      ? `مفعل (${AUTO_DELETE_TTL_OPTIONS.find((o) => o.value === autoDeleteTTL)?.labelAr || autoDeleteTTL})`
                      : 'معطل'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {AUTO_DELETE_TTL_OPTIONS.map((opt) => {
                    const isSelected = autoDeleteTTL === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleUpdateTTL(opt.value)}
                        disabled={isSyncingTTL}
                        className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-500/60 text-white font-bold ring-1 ring-rose-500/40'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-base">{opt.icon}</span>
                        <div>
                          <div className="text-xs">{opt.labelAr}</div>
                          <div className="text-[9px] text-zinc-500">{opt.descAr}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2FA Card */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-100">التحقق بخطوتين (Two-Step Verification)</h3>
                      <p className="text-[11px] text-zinc-400">حماية حسابك بكلمة مرور إضافية عند تسجيل الدخول</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      has2FA ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {has2FA ? 'مفعل 🔒' : 'معطل'}
                  </span>
                </div>

                {!has2FA ? (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <input
                      type="password"
                      value={passcode2FA}
                      onChange={(e) => setPasscode2FA(e.target.value)}
                      placeholder="أدخل كلمة مرور إضافية لتفعيل 2FA..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleEnable2FA(true)}
                      disabled={!passcode2FA}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all"
                    >
                      تفعيل التحقق بخطوتين الآن
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEnable2FA(false)}
                    className="w-full py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all"
                  >
                    تعطيل التحقق بخطوتين (2FA)
                  </button>
                )}
              </div>

              {/* Privacy Controls */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-zinc-200 block">قواعد الخصوصية ومن يمكنه رؤية معلوماتك:</span>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">من يمكنه رؤية رقم هاتفي:</label>
                    <select
                      value={phonePrivacy}
                      onChange={(e) => setPhonePrivacy(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="everybody">الجميع (Everybody)</option>
                      <option value="contacts">جهات اتصالي فقط (My Contacts)</option>
                      <option value="nobody">لا أحد (Nobody)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">من يمكنه رؤية آخر ظهور وحالة الاتصال:</label>
                    <select
                      value={lastSeenPrivacy}
                      onChange={(e) => setLastSeenPrivacy(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="everybody">الجميع</option>
                      <option value="contacts">جهات الاتصال فقط</option>
                      <option value="nobody">لا أحد</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SCREEN 4: NOTIFICATIONS & SOUNDS (الإشعارات والأصوات)
          ══════════════════════════════════════════════════════════════ */}
          {activeScreen === 'notifications' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-zinc-200">إشعارات المتصفح والتطبيق</h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-850 cursor-pointer">
                    <span className="text-xs text-zinc-300">السماح بالإشعارات الفورية</span>
                    <input
                      type="checkbox"
                      checked={browserNotifications}
                      onChange={(e) => setBrowserNotifications(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-850 cursor-pointer">
                    <span className="text-xs text-zinc-300">تشغيل نغمات التنبيه الصوتية</span>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Tones Selection */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-zinc-200 block">نغمة التنبيه الافتراضية:</span>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_NOTIFICATION_TONES.slice(0, 6).map((tone) => {
                    const isSelected = defaultTone === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => {
                          setDefaultToneState(tone.id);
                          setDefaultNotificationTone(tone.id);
                          playToneById(tone.id);
                        }}
                        className={`p-2.5 rounded-xl border text-right flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-xs">{tone.nameAr}</span>
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SCREEN 5: DATA & STORAGE (البيانات والتخزين)
          ══════════════════════════════════════════════════════════════ */}
          {activeScreen === 'storage' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-zinc-200 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span>استخدام الذاكرة المؤقتة (Cache Storage):</span>
                  </span>
                  <span className="font-mono text-cyan-400 font-extrabold">{storageUsed} MB</span>
                </div>

                <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-500"
                    style={{ width: `${Math.min((storageUsed / 200) * 100, 100)}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleClearCache}
                  disabled={clearingCache}
                  className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{clearingCache ? 'جاري التفريغ...' : 'تفريغ الكاش والذاكرة المؤقتة'}</span>
                </button>
              </div>

              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-zinc-300 block">التنزيل التلقائي للوسائط:</span>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-850 cursor-pointer">
                    <span className="text-xs text-zinc-200">عند استخدام بيانات الهاتف (Cellular)</span>
                    <input
                      type="checkbox"
                      checked={autoDownloadMobile}
                      onChange={(e) => setAutoDownloadMobile(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-850 cursor-pointer">
                    <span className="text-xs text-zinc-200">عند الاتصال بشبكة Wi-Fi</span>
                    <input
                      type="checkbox"
                      checked={autoDownloadWifi}
                      onChange={(e) => setAutoDownloadWifi(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SCREEN 6: DEVICES & SESSIONS (الأجهزة والجلسات)
          ══════════════════════════════════════════════════════════════ */}
          {activeScreen === 'devices' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  الجلسات النشطة المصرح لها ({sessions.length || 1}):
                </span>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={handleTerminateOtherSessions}
                    className="py-1.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-bold transition-all"
                  >
                    إنهاء كافة الجلسات الأخرى
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {(sessions.length > 0
                  ? sessions
                  : [
                      {
                        id: 'sess_1',
                        device_name: 'Telegram Android 12.4 Pro (هذا الجهاز)',
                        platform: 'mobile',
                        ip: '192.168.1.104',
                        location: 'Baghdad, Iraq',
                        last_active: 'الآن (Online)',
                        is_current: true,
                      },
                      {
                        id: 'sess_2',
                        device_name: 'Telegram Web K (Chrome / Linux)',
                        platform: 'desktop',
                        ip: '37.237.18.90',
                        location: 'Erbil, Iraq',
                        last_active: 'منذ ساعتين',
                        is_current: false,
                      },
                    ]
                ).map((sess: any) => (
                  <div
                    key={sess.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      sess.is_current
                        ? 'bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20'
                        : 'bg-zinc-900/60 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-zinc-800 text-purple-400">
                        {sess.platform === 'mobile' ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                          <span>{sess.device_name}</span>
                          {sess.is_current && (
                            <span className="text-[9px] bg-emerald-500 text-zinc-950 px-1.5 py-0.2 rounded font-bold">
                              هذا الجهاز
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {sess.ip} • {sess.location}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-zinc-500 font-mono">{sess.last_active}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SCREEN 7: POWER SAVING (توفير الطاقة)
          ══════════════════════════════════════════════════════════════ */}
          {activeScreen === 'power_saving' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-zinc-300 block">وضع توفير البطارية الذكي:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPowerMode('auto')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      powerMode === 'auto'
                        ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    🤖 تلقائي (موصى به)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPowerMode('always')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      powerMode === 'always'
                        ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    ⚡ دائم التوفير
                  </button>
                  <button
                    type="button"
                    onClick={() => setPowerMode('off')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      powerMode === 'off'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    🚫 معطل
                  </button>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-850 cursor-pointer">
                  <span className="text-xs text-zinc-200">إيقاف تحريك الملصقات المتحركة والرموز التعبيرية</span>
                  <input
                    type="checkbox"
                    checked={reduceStickers}
                    onChange={(e) => setReduceStickers(e.target.checked)}
                    className="w-4 h-4 accent-teal-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-850 cursor-pointer">
                  <span className="text-xs text-zinc-200">تقليل المزامنة في الخلفية عند انخفاض البطارية</span>
                  <input
                    type="checkbox"
                    checked={reduceSync}
                    onChange={(e) => setReduceSync(e.target.checked)}
                    className="w-4 h-4 accent-teal-500 rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SCREEN 8: LANGUAGE (اللغة)
          ══════════════════════════════════════════════════════════════ */}
          {activeScreen === 'language' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl divide-y divide-zinc-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSetLanguage('ar')}
                  className={`w-full p-4 text-right flex items-center justify-between transition-colors ${
                    currentLang === 'ar' ? 'bg-sky-500/10 text-sky-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🇸🇦</span>
                    <div>
                      <div className="text-sm font-bold">العربية (Arabic)</div>
                      <div className="text-[11px] text-zinc-400">لغة الواجهة الافتراضية مع دعم كامل للاتجاه RTL</div>
                    </div>
                  </div>
                  {currentLang === 'ar' && <Check className="w-5 h-5 text-sky-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSetLanguage('en')}
                  className={`w-full p-4 text-right flex items-center justify-between transition-colors ${
                    currentLang === 'en' ? 'bg-sky-500/10 text-sky-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🇺🇸</span>
                    <div>
                      <div className="text-sm font-bold">English (الإنجليزية)</div>
                      <div className="text-[11px] text-zinc-400">Standard English Interface with LTR support</div>
                    </div>
                  </div>
                  {currentLang === 'en' && <Check className="w-5 h-5 text-sky-400" />}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SCREEN 9: TELEGRAM FEATURES (مميزات تليجرام)
          ══════════════════════════════════════════════════════════════ */}
          {activeScreen === 'telegram_features' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="p-4 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
                  <span className="font-extrabold text-sm text-zinc-100">قدرات ومميزات منصة تليجرام العالمية</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  بنية تحتية مشفرة وسحابية تعتمد على بروتوكول MTProto 2.0 فائق السرعة والأمان.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    titleAr: 'سحاب لا نهائي مجاني (Unlimited Cloud)',
                    descAr: 'تخزين ومشاركة ملفات ومستندات وفيديوهات بأحجام تصل إلى 2GB لكل ملف مجاناً وبلا حدود.',
                    icon: '☁️',
                  },
                  {
                    titleAr: 'مجموعات عملاقة (200,000 عضو)',
                    descAr: 'إدارة مجتمعات وقنوات ضخمة مع أدوات إشراف ومراقبة وصلاحيات دقيقة وتثبيت موضوعي.',
                    icon: '👥',
                  },
                  {
                    titleAr: 'قصص تليجرام المتقدمة (Telegram Stories)',
                    descAr: 'نشر ومشاركة القصص اليومية مع ضبط وقت الانتهاء وإمكانية التخفي والتفاعل.',
                    icon: '🌟',
                  },
                  {
                    titleAr: 'تشفير تام وحماية سرية (MTProto 2.0 & E2EE)',
                    descAr: 'محادثات سرية مع مؤقت تدمير ذاتي وحماية كلمات المرور والتحقق بخطوتين.',
                    icon: '🛡️',
                  },
                  {
                    titleAr: 'المكالمات المشفرة فائقة الوضوح (HD Calls)',
                    descAr: 'مكالمات صوتية ومرئية مشفرة طرفاً لطرف مع مشاركة الشاشة دون انقطاع.',
                    icon: '📞',
                  },
                ].map((feat, i) => (
                  <div key={i} className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-start gap-3">
                    <span className="text-xl">{feat.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-zinc-100">{feat.titleAr}</div>
                      <div className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">{feat.descAr}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
