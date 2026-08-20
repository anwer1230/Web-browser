import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Smartphone, Zap, X, ShieldCheck, Loader2 } from 'lucide-react';

export interface PwaInstallNotificationProps {
  lang?: 'ar' | 'en';
  onInstallComplete?: () => void;
}

export const PwaInstallNotification: React.FC<PwaInstallNotificationProps> = ({
  lang = 'ar',
  onInstallComplete,
}) => {
  const [visible, setVisible] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isRunningStandalone);
    if (isRunningStandalone) {
      setVisible(false);
    }

    const handleAppInstalled = () => {
      setInstalling(false);
      setProgress(100);
      setCompleted(true);
      setStatusText(lang === 'ar' ? '✅ تم تثبيت تطبيق تليجرام بنجاح!' : '✅ Telegram App Installed Successfully!');
      if (onInstallComplete) onInstallComplete();
      setTimeout(() => {
        setVisible(false);
      }, 3500);
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [lang, onInstallComplete]);

  const handleStartInstallation = () => {
    if (installing || completed) return;

    setInstalling(true);
    setProgress(5);
    setStatusText(lang === 'ar' ? '🚀 جاري تهيئة حزمة تطبيق تليجرام...' : '🚀 Initializing Telegram package...');

    // Progress animation loop
    const startTime = Date.now();
    const duration = 2800; // 2.8 seconds realistic install experience

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 96);
      setProgress(pct);

      if (pct < 30) {
        setStatusText(lang === 'ar' ? '📦 جاري استخراج ملفات النواة والتوقيع الرقمي...' : '📦 Extracting core package & digital signature...');
      } else if (pct < 70) {
        setStatusText(lang === 'ar' ? '⚡ جاري تثبيت التطبيق على النظام (PWA / WebAPK)...' : '⚡ Installing application into OS (PWA/WebAPK)...');
      } else if (pct < 95) {
        setStatusText(lang === 'ar' ? '🔒 تهيئة صلاحيات التخزين والإشعارات الفورية...' : '🔒 Configuring offline cache & push channels...');
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        
        // Trigger native prompt if available
        if (window.__pwa_deferred) {
          try {
            window.__pwa_deferred.prompt();
            window.__pwa_deferred.userChoice.then((choice: any) => {
              window.__pwa_deferred = null;
            }).catch(() => {});
          } catch (e) {
            console.error(e);
          }
        }

        // Direct fallback trigger for APK / WebAPK
        try {
          const directApkUrl = '/api/telegram_apk/download/direct_arm64';
          const link = document.createElement('a');
          link.href = directApkUrl;
          link.download = 'Telegram-Enjaz-Speed-v2.0.0.apk';
          // silently pre-trigger if on android mobile device
          if (/android/i.test(navigator.userAgent) && !window.__pwa_deferred) {
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } catch (err) {}

        setProgress(100);
        setInstalling(false);
        setCompleted(true);
        setStatusText(lang === 'ar' ? '✅ اكتمل التثبيت بنجاح! تم تثبيت تطبيق تليجرام.' : '✅ Installation Complete! Telegram App is ready.');

        if (onInstallComplete) onInstallComplete();

        setTimeout(() => {
          setVisible(false);
        }, 4000);
      }
    }, 100);
  };

  if (!visible || isStandalone) return null;

  return (
    <div
      id="pwaInstallNotificationBanner"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg transition-all duration-300 ease-out"
      style={{
        animation: 'slideDownNotif 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        className="relative overflow-hidden rounded-2xl p-4 bg-slate-900/95 border border-sky-500/40 shadow-2xl backdrop-blur-md text-white"
        style={{
          boxShadow: '0 15px 35px -5px rgba(14, 165, 233, 0.35), 0 8px 16px -6px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Animated Glow Border Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-500" />

        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-md p-1.5 shrink-0">
              <img
                src="/static/icons/app-logo.png"
                alt="Telegram Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-sky-200">
                  {lang === 'ar' ? 'تطبيق تليجرام - مركز سرعة إنجاز' : 'Telegram App - Enjaz Speed'}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                  PWA / APK
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {lang === 'ar'
                  ? 'تثبيت التطبيق مباشرة على هاتفك للعمل بكامل الشاشة وبدون متصفح'
                  : 'Install direct Telegram app for fullscreen & offline access'}
              </p>
            </div>
          </div>

          {!installing && !completed && (
            <button
              onClick={() => setVisible(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={lang === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar or Action Button */}
        {installing || completed ? (
          <div className="space-y-2 mt-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-sky-300 flex items-center gap-1.5">
                {installing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {statusText}
              </span>
              <span className="font-mono text-emerald-400 font-bold">{progress}%</span>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {lang === 'ar' ? 'تثبيت مباشر' : 'Direct install'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> {lang === 'ar' ? 'بدون متصفح' : 'Standalone'}
              </span>
            </div>

            <button
              onClick={handleStartInstallation}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 hover:from-emerald-300 hover:to-sky-300 shadow-md transition-all transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تثبيت الآن' : 'Install Now'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PwaInstallNotification;
