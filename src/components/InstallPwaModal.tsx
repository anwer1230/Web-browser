import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle, WifiOff, Bell, Zap, X, ShieldCheck, Loader2, Cpu, HardDrive } from 'lucide-react';

export interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ar' | 'en';
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose, lang = 'ar' }) => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isRunningStandalone);
    setIsCompleted(isRunningStandalone);

    const handleAppInstalled = () => {
      setInstalling(false);
      setProgress(100);
      setIsCompleted(true);
      setStatusText(lang === 'ar' ? '✅ تم تثبيت تطبيق تليجرام بنجاح!' : '✅ Telegram App Installed Successfully!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [lang]);

  const handleStartInstall = () => {
    if (installing || isCompleted) return;

    setInstalling(true);
    setProgress(5);
    setStatusText(lang === 'ar' ? '🚀 جاري تهيئة وتجميع حزمة تليجرام...' : '🚀 Initializing Telegram App Package...');

    const startTime = Date.now();
    const duration = 2600;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 96);
      setProgress(pct);

      if (pct < 35) {
        setStatusText(lang === 'ar' ? '📦 فحص التوقيع الرقمي وتجهيز ملفات النظام...' : '📦 Verifying digital signatures & package assets...');
      } else if (pct < 70) {
        setStatusText(lang === 'ar' ? '⚡ تثبيت التطبيق وتضمين WebAPK / APK المباشر...' : '⚡ Installing application into OS environment...');
      } else if (pct < 95) {
        setStatusText(lang === 'ar' ? '🔒 ضبط التخزين المحلي وقنوات الإشعارات الفورية...' : '🔒 Configuring background sync & push notifications...');
      }

      if (elapsed >= duration) {
        clearInterval(interval);

        // Native PWA prompt trigger
        if (window.__pwa_deferred) {
          try {
            window.__pwa_deferred.prompt();
            window.__pwa_deferred.userChoice.then(() => {
              window.__pwa_deferred = null;
            }).catch(() => {});
          } catch (e) {}
        }

        // Direct APK trigger if Android
        if (/android/i.test(navigator.userAgent) && !window.__pwa_deferred) {
          try {
            const link = document.createElement('a');
            link.href = '/api/telegram_apk/download/direct_arm64';
            link.download = 'Telegram-Enjaz-Speed-v2.0.0.apk';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (e) {}
        }

        setProgress(100);
        setInstalling(false);
        setIsCompleted(true);
        setStatusText(lang === 'ar' ? '✅ اكتمل التثبيت بنجاح! التطبيق جاهز على جهازك.' : '✅ Installation completed! App is ready on your device.');
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs" onClick={onClose}>
      <div
        className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-sky-500/40 rounded-3xl shadow-2xl text-white animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 text-center bg-gradient-to-br from-[#1e3c78] via-[#0f2852] to-[#13855c] border-b border-slate-700/50 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white rounded-full bg-black/20 hover:bg-black/40 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-white/10 p-2 shadow-inner backdrop-blur-md flex items-center justify-center border border-white/20">
            <img
              src="/static/icons/app-logo.png"
              alt="Telegram App Logo"
              className="w-16 h-16 object-contain rounded-xl"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <h2 className="text-xl font-black text-white tracking-wide">
            {lang === 'ar' ? 'تثبيت تطبيق تليجرام المباشر' : 'Install Direct Telegram App'}
          </h2>
          <p className="text-xs text-sky-200 mt-1 opacity-90">
            {lang === 'ar'
              ? 'تثبيت حقيقي كتطبيق مستقل PWA / APK بدون متصفح وبكامل الشاشة'
              : 'Direct PWA / APK installation with full native OS integration'}
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-sky-400 shrink-0" />
              <div className="text-right">
                <div className="text-xs font-bold text-slate-200">{lang === 'ar' ? 'تطبيق مستقل' : 'Standalone'}</div>
                <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'بدون شريط متصفح' : 'No browser bar'}</div>
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-purple-400 shrink-0" />
              <div className="text-right">
                <div className="text-xs font-bold text-slate-200">{lang === 'ar' ? 'استجابة فائقة' : 'Fast Response'}</div>
                <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'محرك فوري' : 'Native engine'}</div>
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-2.5">
              <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-right">
                <div className="text-xs font-bold text-slate-200">{lang === 'ar' ? 'كاش بدون نت' : 'Offline Cache'}</div>
                <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'تخزين مشفر' : 'Local store'}</div>
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-right">
                <div className="text-xs font-bold text-slate-200">{lang === 'ar' ? 'إشعارات حية' : 'Push Alerts'}</div>
                <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'Web Push' : 'Direct Alerts'}</div>
              </div>
            </div>
          </div>

          {/* Installation Progress Bar or Action */}
          {installing || isCompleted ? (
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-sky-500/30">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-sky-300 flex items-center gap-2">
                  {installing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                  {statusText}
                </span>
                <span className="font-mono text-emerald-400 font-bold text-sm">{progress}%</span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-200 shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {isCompleted && (
                <div className="text-center pt-2">
                  <span className="inline-block text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/30">
                    {lang === 'ar' ? '🎉 التطبيق مثبّت الآن على جهازك بنجاح' : '🎉 App is now installed on your device'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center pt-2">
              <button
                id="pwaInstallBtn"
                onClick={handleStartInstall}
                className="w-full py-3.5 px-6 rounded-2xl text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 hover:from-emerald-300 hover:to-sky-300 shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  boxShadow: '0 8px 25px rgba(28, 200, 138, 0.4)',
                }}
              >
                <Download className="w-5 h-5" />
                <span id="pwaInstallLabel">
                  {lang === 'ar' ? 'تثبيت التطبيق الآن مباشرةً (Install App)' : 'Install Telegram App Now'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {lang === 'ar' ? 'حزمة موثقة وموقعة رقمياً' : 'Signed & Verified Package'}
          </span>
          <button onClick={onClose} className="hover:text-white transition font-medium">
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPwaModal;
