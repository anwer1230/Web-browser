import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Play,
  Pause,
  AlertTriangle,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  ShieldCheck,
  CheckCircle,
  Save,
  Flame,
  Search,
} from 'lucide-react';

interface MonitorOnlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ar' | 'en';
}

export const MonitorOnlyModal: React.FC<MonitorOnlyModalProps> = ({
  isOpen,
  onClose,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';

  // 1. Local & Server Persisted States
  const [isMonitoring, setIsMonitoring] = useState<boolean>(() => {
    return localStorage.getItem('tg_auto_monitor_running') === 'true';
  });
  const [watchWords, setWatchWords] = useState<string>(() => {
    return localStorage.getItem('tg_auto_monitor_keywords') || 'عاجل\nمطلوب\nوظيفة\nسعر\nشراء\nبيع\nتخفيض';
  });
  const [monitoredGroups, setMonitoredGroups] = useState<string>(() => {
    return localStorage.getItem('tg_auto_monitor_groups') || '';
  });
  const [monitorAllChats, setMonitorAllChats] = useState<boolean>(() => {
    return localStorage.getItem('tg_auto_monitor_all') !== 'false';
  });
  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => {
    return localStorage.getItem('tg_auto_monitor_sound') !== 'false';
  });
  const [autoForwardAlerts, setAutoForwardAlerts] = useState<boolean>(() => {
    return localStorage.getItem('tg_auto_monitor_forward') === 'true';
  });

  const [alertsCount, setAlertsCount] = useState<number>(() => {
    const saved = localStorage.getItem('tg_auto_monitor_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [alerts, setAlerts] = useState<Array<{
    id: string;
    time: string;
    keyword: string;
    group: string;
    sender: string;
    text: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('tg_auto_monitor_alerts_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [saveFeedback, setSaveFeedback] = useState('');
  const logBoxRef = useRef<HTMLDivElement>(null);

  // Play beep sound
  const playAlertSound = () => {
    if (!soundAlerts) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
      setTimeout(() => ctx.close(), 350);
    } catch (e) {}
  };

  // Sync with server state
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/get_login_status')
      .then((r) => r.json())
      .then((data) => {
        if (data.is_running !== undefined) {
          setIsMonitoring(data.is_running);
        }
      })
      .catch(() => {});

    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.settings) {
          if (data.settings.watch_words && data.settings.watch_words.length > 0 && !localStorage.getItem('tg_auto_monitor_keywords')) {
            setWatchWords(data.settings.watch_words.join('\n'));
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Real-time EventSource listener for alerts
  useEffect(() => {
    if (!isOpen) return;

    const es = new EventSource('/api/events');
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'new_alert' && payload.data) {
          const newAlertItem = {
            id: `alert_${Date.now()}_${Math.random()}`,
            time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            keyword: payload.data.keyword || 'كلمة مفتاحية',
            group: payload.data.group || 'مجموعة تليجرام',
            sender: payload.data.sender || 'مستخدم',
            text: payload.data.text || payload.data.message || '',
          };
          setAlerts((prev) => [newAlertItem, ...prev.slice(0, 49)]);
          setAlertsCount((prev) => prev + 1);
          playAlertSound();
        } else if (payload.type === 'monitoring_status' && payload.data?.is_running !== undefined) {
          setIsMonitoring(payload.data.is_running);
        }
      } catch (e) {}
    };

    return () => {
      es.close();
    };
  }, [isOpen, soundAlerts]);

  // Persist locally
  useEffect(() => {
    localStorage.setItem('tg_auto_monitor_running', String(isMonitoring));
  }, [isMonitoring]);

  useEffect(() => {
    localStorage.setItem('tg_auto_monitor_keywords', watchWords);
  }, [watchWords]);

  useEffect(() => {
    localStorage.setItem('tg_auto_monitor_groups', monitoredGroups);
  }, [monitoredGroups]);

  useEffect(() => {
    localStorage.setItem('tg_auto_monitor_all', String(monitorAllChats));
  }, [monitorAllChats]);

  useEffect(() => {
    localStorage.setItem('tg_auto_monitor_sound', String(soundAlerts));
  }, [soundAlerts]);

  useEffect(() => {
    localStorage.setItem('tg_auto_monitor_forward', String(autoForwardAlerts));
  }, [autoForwardAlerts]);

  useEffect(() => {
    localStorage.setItem('tg_auto_monitor_count', String(alertsCount));
  }, [alertsCount]);

  useEffect(() => {
    localStorage.setItem('tg_auto_monitor_alerts_history', JSON.stringify(alerts));
  }, [alerts]);

  if (!isOpen) return null;

  const handleToggleMonitoring = async () => {
    const nextState = !isMonitoring;
    setIsMonitoring(nextState);

    try {
      const endpoint = nextState ? '/api/start_monitor' : '/api/stop_monitor';
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: watchWords.split('\n').filter(Boolean),
          groups: monitoredGroups.split('\n').filter(Boolean),
          monitor_all: monitorAllChats,
        }),
      });
      setSaveFeedback(
        nextState
          ? (isAr ? 'تم تشغيل الرادار والمراقبة الحية بنجاح!' : 'Monitoring started!')
          : (isAr ? 'تم إيقاف المراقبة الحية' : 'Monitoring paused')
      );
      setTimeout(() => setSaveFeedback(''), 3000);
    } catch (err) {}
  };

  const handleSaveKeywords = async () => {
    try {
      await fetch('/api/save_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watch_words: watchWords.split('\n').filter(Boolean),
          groups: monitoredGroups.split('\n').filter(Boolean),
          enabled: isMonitoring,
        }),
      });
      setSaveFeedback(isAr ? 'تم حفظ كلمات المراقبة بنجاح في الخادم والمحلي' : 'Keywords saved successfully');
      setTimeout(() => setSaveFeedback(''), 3000);
    } catch (e) {
      setSaveFeedback(isAr ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving');
      setTimeout(() => setSaveFeedback(''), 3000);
    }
  };

  const handleClearAlerts = () => {
    setAlerts([]);
    setAlertsCount(0);
    localStorage.removeItem('tg_auto_monitor_alerts_history');
    localStorage.setItem('tg_auto_monitor_count', '0');
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none font-['Cairo',sans-serif]">
      <div
        className="bg-zinc-950 border border-sky-500/30 text-zinc-100 flex flex-col rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] max-h-[750px] overflow-hidden"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header - ONLY for Automatic Monitoring */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-sky-500/10 via-zinc-900 to-zinc-900 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold shadow-inner">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-zinc-100">
                  {isAr ? 'واجهة المراقبة التلقائية والرادار (Live Radar Monitor)' : 'Live Monitoring & Keyword Radar'}
                </span>
                <span className={`px-2 py-0.5 text-[10px] rounded-md font-black flex items-center gap-1 ${
                  isMonitoring
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  <Radio className="w-3 h-3" />
                  {isMonitoring ? (isAr ? 'الرادار نشط 🟢' : 'Active 🟢') : (isAr ? 'متوقف ⚪' : 'Idle ⚪')}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {isAr ? 'مراقبة فورية لرسائل المجموعات واقتناص الكلمات المفتاحية فور نشرها مع إصدار تنبيهات صوتية وحفظ كامل للإعدادات' : 'Real-time keyword radar and group message monitoring with audio alerts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveKeywords}
              className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              title="حفظ الكلمات"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ دائم' : 'Save'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {saveFeedback && (
          <div className="bg-sky-500/20 border-b border-sky-500/40 text-sky-300 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Column: Keywords & Settings (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Radar Power Switch Card */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? 'تشغيل رادار الاقتناص والمراقبة:' : 'Radar Engine Status:'}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {isAr ? 'يتم فحص كل رسالة جديدة فور وصولها وتنبيهك بها' : 'Scans every incoming message for targets'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMonitoring}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                    isMonitoring
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                  }`}
                >
                  {isMonitoring ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إيقاف المراقبة' : 'Pause Radar'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تشغيل المراقبة 🟢' : 'Start Radar 🟢'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Keywords Input Box */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <Search className="w-4 h-4 text-sky-400" />
                    <span>{isAr ? 'الكلمات المفتاحية المستهدفة (كل كلمة في سطر):' : 'Target Keywords (One per line):'}</span>
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {watchWords.split('\n').filter(Boolean).length} {isAr ? 'كلمة' : 'words'}
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={watchWords}
                  onChange={(e) => setWatchWords(e.target.value)}
                  placeholder={isAr ? 'عاجل\nمطلوب مهندس\nبيع شقة\nتخفيض\n...' : 'keyword 1\nkeyword 2...'}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Preferences & Scope */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-zinc-300 block mb-1">
                  ⚙️ {isAr ? 'نطاق المراقبة والتنبيهات:' : 'Radar Scope & Triggers:'}
                </span>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
                    <div className="flex items-center gap-2">
                      {soundAlerts ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                      <span className="text-xs text-zinc-200">{isAr ? 'تنبيه صوتي فوري عند رصد كلمة' : 'Sound Beep on Hit'}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundAlerts}
                      onChange={(e) => setSoundAlerts(e.target.checked)}
                      className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-sky-400" />
                      <span className="text-xs text-zinc-200">{isAr ? 'مراقبة جميع المجموعات والقنوات المشترك بها' : 'Monitor all joined channels'}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={monitorAllChats}
                      onChange={(e) => setMonitorAllChats(e.target.checked)}
                      className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

            </div>

            {/* Right Column: Alerts Stream (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 flex flex-col h-[520px]">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-100">{isAr ? 'سجل الاقتناص والتنبيهات المباشرة:' : 'Captured Radar Alerts:'}</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      {alerts.length} {isAr ? 'تنبيه' : 'hits'}
                    </span>
                  </div>

                  {alerts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAlerts}
                      className="text-[11px] text-zinc-400 hover:text-rose-400 transition-colors"
                    >
                      {isAr ? 'مسح السجل' : 'Clear'}
                    </button>
                  )}
                </div>

                {/* Alerts List */}
                <div
                  ref={logBoxRef}
                  className="flex-1 overflow-y-auto pt-3 space-y-2.5 custom-scrollbar"
                >
                  {alerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                      <Radio className="w-8 h-8 mb-2 text-zinc-700 animate-pulse" />
                      <p className="text-xs font-bold">{isAr ? 'الرادار في حالة تأهب...' : 'Radar listening...'}</p>
                      <p className="text-[11px] mt-1 text-zinc-600">
                        {isAr ? 'ستظهر هنا الرسائل التي تحتوي على كلماتك المفتاحية لحظة نشرها' : 'Matching messages will appear here live'}
                      </p>
                    </div>
                  ) : (
                    alerts.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-zinc-950 border border-sky-500/20 hover:border-sky-500/40 transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {item.keyword}
                          </span>
                          <span className="text-zinc-500 font-mono text-[10px]">{item.time}</span>
                        </div>

                        <p className="text-xs text-zinc-200 line-clamp-3 leading-relaxed">
                          {item.text}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-900">
                          <span className="truncate max-w-[160px]">👥 {item.group}</span>
                          <span className="text-sky-400">👤 {item.sender}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
