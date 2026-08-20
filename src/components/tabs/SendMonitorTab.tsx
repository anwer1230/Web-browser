import React, { useState, useEffect, useRef } from 'react';

interface SendMonitorTabProps {
  onBack?: () => void;
  initialMessage?: string;
  initialGroups?: string[];
  initialWatchWords?: string[];
}

export const SendMonitorTab: React.FC<SendMonitorTabProps> = ({
  onBack,
  initialMessage = '',
  initialGroups = [],
  initialWatchWords = [],
}) => {
  // State management matching exact HTML specifications
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [messageText, setMessageText] = useState(initialMessage);
  const [groupsInput, setGroupsInput] = useState(initialGroups.join('\n'));
  const [allGroupsSelected, setAllGroupsSelected] = useState(false);
  const [sendType, setSendType] = useState<'manual' | 'scheduled'>('manual');
  const [sendSmart, setSendSmart] = useState<'smart' | 'normal'>('smart');
  const [intervalMinutes, setIntervalMinutes] = useState(25);
  const [scheduleDuration, setScheduleDuration] = useState(0);
  const [watchWords, setWatchWords] = useState(initialWatchWords.join('\n'));
  const [selectedOption, setSelectedOption] = useState<'salam' | 'skip' | 'smart' | 'always' | 'off'>('salam');
  const [uploadedImages, setUploadedImages] = useState<Array<{ name: string; data: string; type: string }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSendingActive, setIsSendingActive] = useState<boolean>(() => {
    return localStorage.getItem('tg_send_mon_active') === 'true';
  });
  const [isPaused, setIsPaused] = useState<boolean>(() => {
    return localStorage.getItem('tg_send_mon_paused') === 'true';
  });
  const [logs, setLogs] = useState<Array<{ id: string; time: string; message: string }>>([
    {
      id: 'init',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: '● النظام جاهز',
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logBoxRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      ...prev.slice(-49),
      { id: `${Date.now()}_${Math.random()}`, time, message: msg },
    ]);
  };

  const playBeep = () => {
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
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
      setTimeout(() => ctx.close(), 300);
    } catch (e) {
      // Ignored if browser blocks autoplay
    }
  };

  // Scroll log automatically
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  // Initialize and load saved settings / status
  useEffect(() => {
    addLog('🚀 واجهة الإرسال والمراقبة جاهزة');

    // Fetch initial status
    fetch('/api/get_login_status')
      .then((r) => r.json())
      .then((data) => {
        if (data.is_running) {
          setIsMonitoring(true);
          addLog('🔄 المراقبة تعمل بالفعل');
        }
      })
      .catch(() => {});

    fetch('/api/get_stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.sent !== undefined) {
          addLog(`📊 مرسل: ${data.sent} | أخطاء: ${data.errors || 0}`);
        }
      })
      .catch(() => {});

    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.settings) {
          if (data.settings.message) setMessageText(data.settings.message);
          if (data.settings.groups && data.settings.groups.length > 0) {
            setGroupsInput(data.settings.groups.join('\n'));
          }
          if (data.settings.watch_words && data.settings.watch_words.length > 0) {
            setWatchWords(data.settings.watch_words.join('\n'));
          }
          if (data.settings.interval_seconds) {
            setIntervalMinutes(Math.floor(data.settings.interval_seconds / 60) || 25);
          }
          if (data.settings.schedule_duration_hours) {
            setScheduleDuration(data.settings.schedule_duration_hours);
          }
          if (data.settings.sanitize_mode) {
            setSelectedOption(data.settings.sanitize_mode);
          }
          if (data.settings.send_type) {
            setSendType(data.settings.send_type);
          }
        }
      })
      .catch(() => {});

    // Listen to real-time events via EventSource SSE
    const es = new EventSource('/api/events');
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'log_update' && payload.data?.message) {
          addLog(payload.data.message);
        } else if (payload.type === 'new_alert' && payload.data) {
          addLog(`🚨 تنبيه: "${payload.data.keyword}" في ${payload.data.group}`);
          playBeep();
        } else if (payload.type === 'monitoring_status' && payload.data?.is_running !== undefined) {
          setIsMonitoring(payload.data.is_running);
        }
      } catch (e) {}
    };

    return () => {
      es.close();
    };
  }, []);

  // Handlers matching the prompt
  const toggleAllGroups = () => {
    const nextVal = !allGroupsSelected;
    setAllGroupsSelected(nextVal);
    addLog(nextVal ? '✅ تفعيل الإرسال لكل المجموعات' : '⏹ إلغاء اختيار الكل');
  };

  const selectOption = (val: 'salam' | 'skip' | 'smart' | 'always' | 'off') => {
    setSelectedOption(val);
    const names: Record<string, string> = {
      salam: 'ذكي (salam)',
      skip: 'تخطي',
      smart: 'ذكية',
      always: 'تنقية',
      off: 'معطل',
    };
    addLog(`🛡️ وضع: ${names[val] || val}`);
  };

  const toggleSchedule = (type: 'manual' | 'scheduled') => {
    setSendType(type);
    addLog(type === 'scheduled' ? '⏰ تفعيل الإرسال المجدول' : '📌 الإرسال اليدوي');
  };

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        addLog(`⚠️ ${file.name} > 10MB، تم تخطيها`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setUploadedImages((prev) => [
            ...prev,
            { name: file.name, data: e.target!.result as string, type: file.type },
          ]);
          addLog(`📷 رفع: ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    addLog('🗑️ حذف صورة');
  };

  const startSending = async () => {
    const msg = messageText.trim();
    const grps = groupsInput.trim();
    const sendToAll = allGroupsSelected;

    if (!msg && uploadedImages.length === 0) {
      addLog('⚠️ اكتب رسالة أو ارفع صورة على الأقل');
      return;
    }
    if (!sendToAll && !grps) {
      addLog('⚠️ حدد المجموعات أو اختر "كل المجموعات"');
      return;
    }

    try {
      const res = await fetch('/api/send/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          groups: grps,
          interval_minutes: intervalMinutes,
          sanitize_mode: selectedOption,
          send_type: sendType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSendingActive(true);
        setIsPaused(false);
        localStorage.setItem('tg_send_mon_active', 'true');
        localStorage.setItem('tg_send_mon_paused', 'false');
        addLog('▶️ بدأت مهمة الإرسال في الخلفية');
      }
    } catch (e: any) {
      addLog('❌ فشل بدء الإرسال: ' + e.message);
    }
  };

  const pauseSending = async () => {
    try {
      const res = await fetch('/api/send/pause', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsPaused(true);
        localStorage.setItem('tg_send_mon_paused', 'true');
        addLog('⏸️ تم التوقف المؤقت للإرسال');
      }
    } catch (e: any) {
      addLog('❌ خطأ أثناء الإيقاف المؤقت');
    }
  };

  const resumeSending = async () => {
    try {
      const res = await fetch('/api/send/resume', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsPaused(false);
        setIsSendingActive(true);
        localStorage.setItem('tg_send_mon_paused', 'false');
        localStorage.setItem('tg_send_mon_active', 'true');
        addLog('▶️ تم استئناف الإرسال في الخلفية');
      }
    } catch (e: any) {
      addLog('❌ خطأ أثناء الاستئناف');
    }
  };

  const stopSending = async () => {
    try {
      const res = await fetch('/api/send/stop', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsSendingActive(false);
        setIsPaused(false);
        localStorage.setItem('tg_send_mon_active', 'false');
        localStorage.setItem('tg_send_mon_paused', 'false');
        addLog('⏹️ تم إيقاف مهمة الإرسال بالكامل');
      }
    } catch (e: any) {
      addLog('❌ خطأ أثناء الإيقاف');
    }
  };

  const saveSettings = async () => {
    const data = {
      message: messageText,
      groups: groupsInput,
      watch_words: watchWords,
      send_type: sendType,
      interval_seconds: (intervalMinutes || 25) * 60,
      schedule_duration_hours: scheduleDuration || 0,
      sanitize_mode: selectedOption,
      smart_send: sendSmart,
    };

    try {
      const res = await fetch('/api/save_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      addLog(result.success ? '✅ تم حفظ الإعدادات' : '❌ فشل الحفظ: ' + (result.message || 'خطأ'));
    } catch (err: any) {
      addLog('❌ خطأ: ' + err.message);
    }
  };

  const sendNow = async () => {
    const msg = messageText.trim();
    const grps = groupsInput.trim();
    const sendToAll = allGroupsSelected;

    if (!msg && uploadedImages.length === 0) {
      addLog('⚠️ اكتب رسالة أو ارفع صورة');
      return;
    }
    if (!sendToAll && !grps) {
      addLog('⚠️ حدد المجموعات أو اختر "كل المجموعات"');
      return;
    }

    setIsSending(true);
    addLog('⏳ جاري الإرسال...');

    try {
      const res = await fetch('/api/send_now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          groups: grps,
          send_to_all: sendToAll,
          images: uploadedImages,
          action: selectedOption,
          smart_send: sendSmart,
        }),
      });
      const data = await res.json();
      addLog(data.success ? '✅ ' + data.message : '❌ ' + (data.message || 'فشل الإرسال'));
      if (data.success) {
        setUploadedImages([]);
      }
    } catch (err: any) {
      addLog('❌ خطأ: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const startMonitoring = async () => {
    try {
      const res = await fetch('/api/start_monitoring', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsMonitoring(true);
        addLog('🚀 بدأت المراقبة');
      } else {
        addLog('❌ فشل البدء: ' + (data.message || 'خطأ'));
      }
    } catch (err: any) {
      addLog('❌ خطأ: ' + err.message);
    }
  };

  const stopMonitoring = async () => {
    try {
      const res = await fetch('/api/stop_monitoring', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsMonitoring(false);
        addLog('⏹ توقفت المراقبة');
      }
    } catch (err: any) {
      addLog('❌ خطأ: ' + err.message);
    }
  };

  const stopScheduledSend = () => {
    if (window.confirm('⚠️ إيقاف الإرسال المجدول فوراً؟')) {
      stopMonitoring();
    }
  };

  return (
    <div
      dir="rtl"
      className="w-full text-zinc-100 font-sans antialiased select-none"
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
        
        {/* حالة المراقبة & شريط المؤشرات */}
        <div className="bg-zinc-900/90 rounded-2xl p-4 shadow-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 rounded-xl text-amber-400 border border-amber-500/30">
              <i className="fas fa-paper-plane text-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full inline-block transition-colors ${
                    isMonitoring
                      ? 'bg-emerald-500 animate-[pulse_1.5s_infinite] shadow-lg shadow-emerald-500/50'
                      : 'bg-zinc-600'
                  }`}
                />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isMonitoring ? 'محرك المراقبة والجدولة: يعمل بنشاط ✅' : 'محرك المراقبة والجدولة: متوقف حالياً'}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                تحديد المجموعات المستهدفة، فلاتر الكلمات المراقبة، التخطي التلقائي، وجدولة الإرسال
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isMonitoring ? (
              <button
                className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                onClick={startMonitoring}
              >
                <i className="fas fa-play" />
                <span>بدء المراقبة التلقائية</span>
              </button>
            ) : (
              <button
                className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
                onClick={stopMonitoring}
              >
                <i className="fas fa-stop" />
                <span>إيقاف المراقبة</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left / Main Column: Message & Media & Groups */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* الرسالة */}
            <div className="bg-zinc-900/80 rounded-2xl p-4 shadow-xl border border-zinc-800/80">
              <span className="text-zinc-300 text-xs font-bold block mb-2">📝 نص الرسالة التلقائية</span>
              <textarea
                id="messageText"
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="اكتب نص الرسالة التي ترغب بإرسالها للمجموعات..."
                className="w-full p-3 rounded-xl border border-zinc-700/80 bg-zinc-950 text-zinc-100 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-y placeholder:text-zinc-500"
              />
            </div>

            {/* رفع الصور والوسائط */}
            <div className="bg-zinc-900/80 rounded-2xl p-4 shadow-xl border border-zinc-800/80">
              <span className="text-zinc-300 text-xs font-bold block mb-2">📷 إرفاق وسائط وصور</span>
              <div
                className="border-2 border-dashed border-zinc-700 rounded-xl p-4 text-center cursor-pointer transition-all bg-zinc-950/60 hover:border-amber-500/60 hover:bg-zinc-900/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-cloud-upload-alt text-2xl text-zinc-400 mb-1 block" />
                <div className="text-zinc-200 text-xs font-semibold">اضغط لاختيار الصور أو المستندات</div>
                <div className="text-zinc-500 text-[10px] mt-0.5">يدعم: JPG, PNG, GIF, WebP</div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImages(e.target.files)}
                />
              </div>

              {/* Image preview */}
              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {uploadedImages.map((img, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-xl overflow-hidden relative bg-zinc-800 border border-zinc-700 group"
                    >
                      <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white border-none text-[10px] flex items-center justify-center cursor-pointer shadow hover:scale-110 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        title="حذف"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* المجموعات المستهدفة */}
            <div className="bg-zinc-900/80 rounded-2xl p-4 shadow-xl border border-zinc-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-300 text-xs font-bold">👥 المجموعات والقنوات المستهدفة</span>
                <div className="flex items-center gap-2 cursor-pointer" onClick={toggleAllGroups}>
                  <div
                    className={`w-9 h-5 rounded-full cursor-pointer transition-colors relative shrink-0 ${
                      allGroupsSelected ? 'bg-amber-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                        allGroupsSelected ? '-translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                  <span className="text-zinc-300 text-xs font-medium">
                    {allGroupsSelected ? '✅ كل المجموعات' : 'تحديد كل المجموعات'}
                  </span>
                </div>
              </div>

              <textarea
                id="groupsInput"
                rows={3}
                value={groupsInput}
                onChange={(e) => setGroupsInput(e.target.value)}
                disabled={allGroupsSelected}
                placeholder="ضع روابط المجموعات (https://t.me/group أو t.me/+invite أو @username) أو أسماء المجموعات (كل مجموعة في سطر)..."
                className="w-full p-3 rounded-xl border border-zinc-700/80 bg-zinc-950 text-zinc-100 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-50 disabled:bg-zinc-900/40 placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* Right Column: Settings, Protection, Actions & Logs */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* نوع الإرسال والجدولة */}
            <div className="bg-zinc-900/80 rounded-2xl p-4 shadow-xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-xs font-bold">⏰ نوع الإرسال والنمط</span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono border border-amber-500/20">
                  {sendType === 'scheduled' ? 'مجدول تلقائياً' : 'إرسال فوري / يدوي'}
                </span>
              </div>

              <select
                id="sendType"
                value={sendType}
                onChange={(e) => toggleSchedule(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-zinc-700/80 bg-zinc-950 text-zinc-100 text-xs outline-none focus:border-amber-500"
              >
                <option value="manual">يدوي (عند الطلب فقط)</option>
                <option value="scheduled">مجدول دوري تلقائي</option>
              </select>

              <div className="flex gap-4 items-center pt-1 border-t border-zinc-800">
                <span className="text-xs text-zinc-400">أسلوب الإرسال:</span>
                <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="sendSmart"
                    value="smart"
                    checked={sendSmart === 'smart'}
                    onChange={() => setSendSmart('smart')}
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span>ذكي (Smart)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="sendSmart"
                    value="normal"
                    checked={sendSmart === 'normal'}
                    onChange={() => setSendSmart('normal')}
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span>عادي (Direct)</span>
                </label>
              </div>

              {/* خيارات المجدول */}
              {sendType === 'scheduled' && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-zinc-400 text-[11px] block mb-1">⏱️ الفترة (دقائق)</span>
                      <input
                        type="number"
                        min={1}
                        value={intervalMinutes}
                        onChange={(e) => setIntervalMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100 text-xs outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[11px] block mb-1">⏹️ يتوقف بعد (ساعات)</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={scheduleDuration}
                        onChange={(e) => setScheduleDuration(parseFloat(e.target.value) || 0)}
                        placeholder="0 = بدون حد"
                        className="w-full p-2 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100 text-xs outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <button
                    className="w-full p-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                    onClick={stopScheduledSend}
                  >
                    <i className="fas fa-stop-circle" />
                    <span>إيقاف الإرسال المجدول</span>
                  </button>
                </div>
              )}
            </div>

            {/* كلمات المراقبة */}
            <div className="bg-zinc-900/80 rounded-2xl p-4 shadow-xl border border-zinc-800/80">
              <span className="text-zinc-300 text-xs font-bold block mb-1.5">🔑 كلمات المراقبة والتنصت</span>
              <textarea
                id="watchWords"
                rows={2}
                value={watchWords}
                onChange={(e) => setWatchWords(e.target.value)}
                placeholder="كلمة في كل سطر (مثال: بحوث، مشروع، مساعدة)..."
                className="w-full p-2.5 rounded-xl border border-zinc-700/80 bg-zinc-950 text-zinc-100 text-xs outline-none focus:border-amber-500 transition-all resize-y placeholder:text-zinc-500"
              />
            </div>

            {/* وضع الحماية والمجموعات المحمية */}
            <div className="bg-zinc-900/80 rounded-2xl p-4 shadow-xl border border-zinc-800/80">
              <span className="text-zinc-300 text-xs font-bold block mb-2">🛡️ وضع المجموعات المحمية</span>
              <div className="grid grid-cols-2 gap-2">
                
                {/* salam */}
                <div
                  className={`p-2.5 rounded-xl cursor-pointer border transition-all ${
                    selectedOption === 'salam'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                  onClick={() => selectOption('salam')}
                >
                  <div className="text-xs font-bold text-amber-300">🤖 ذكي (salam)</div>
                  <div className="text-[10px] text-zinc-400">إرسال السلام ثم التعديل</div>
                </div>

                {/* skip */}
                <div
                  className={`p-2.5 rounded-xl cursor-pointer border transition-all ${
                    selectedOption === 'skip'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                  onClick={() => selectOption('skip')}
                >
                  <div className="text-xs font-bold text-sky-300">⏭️ تخطي</div>
                  <div className="text-[10px] text-zinc-400">عدم الإرسال للمحمية</div>
                </div>

                {/* smart */}
                <div
                  className={`p-2.5 rounded-xl cursor-pointer border transition-all ${
                    selectedOption === 'smart'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                  onClick={() => selectOption('smart')}
                >
                  <div className="text-xs font-bold text-emerald-300">🧠 تنقية ذكية</div>
                  <div className="text-[10px] text-zinc-400">تنقية الروابط الحساسة</div>
                </div>

                {/* always */}
                <div
                  className={`p-2.5 rounded-xl cursor-pointer border transition-all ${
                    selectedOption === 'always'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                  onClick={() => selectOption('always')}
                >
                  <div className="text-xs font-bold text-indigo-300">🛡️ تنقية دائمة</div>
                  <div className="text-[10px] text-zinc-400">حذف الروابط دائماً</div>
                </div>

                {/* off */}
                <div
                  className={`col-span-2 p-2 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
                    selectedOption === 'off'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-500 hover:border-zinc-700'
                  }`}
                  onClick={() => selectOption('off')}
                >
                  <span className="text-xs font-semibold">🚫 معطّل (إرسال مباشر بدون تعديل)</span>
                  <span className="text-[9px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">خطر حظر</span>
                </div>

              </div>
            </div>

            {/* أزرار التحكم والإجراءات الشاملة (حفظ، بدء الإرسال، توقف، استئناف) */}
            <div className="space-y-2">
              {/* شريط حالة مهمة الإرسال المستمر */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isSendingActive
                      ? isPaused
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-emerald-400 animate-ping'
                      : 'bg-zinc-600'
                  }`} />
                  <span className="text-xs font-bold text-zinc-200">
                    {isSendingActive
                      ? isPaused
                        ? 'حالة الإرسال: متوقف مؤقتاً ⏸️'
                        : 'حالة الإرسال: يعمل في الخلفية 🟢'
                      : 'حالة الإرسال: متوقف ⏹️'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {isSendingActive ? (isPaused ? 'PAUSED' : 'ACTIVE') : 'STOPPED'}
                </span>
              </div>

              {/* أزرار التحكم 4x */}
              <div className="grid grid-cols-2 gap-2">
                {/* زر حفظ الإعدادات */}
                <button
                  type="button"
                  className="w-full py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  onClick={saveSettings}
                >
                  <i className="fas fa-save text-sm" />
                  <span>حفظ الإعدادات 💾</span>
                </button>

                {/* زر بدء الإرسال */}
                <button
                  type="button"
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-40 active:scale-95"
                  onClick={startSending}
                  disabled={isSendingActive && !isPaused}
                >
                  <i className="fas fa-play text-sm" />
                  <span>بدء الإرسال ▶️</span>
                </button>

                {/* زر توقف مؤقت / استئناف */}
                {!isPaused ? (
                  <button
                    type="button"
                    className="w-full py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95"
                    onClick={pauseSending}
                    disabled={!isSendingActive}
                  >
                    <i className="fas fa-pause text-sm" />
                    <span>توقف مؤقت ⏸️</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full py-2.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    onClick={resumeSending}
                  >
                    <i className="fas fa-play text-sm" />
                    <span>استئناف الإرسال ⏯️</span>
                  </button>
                )}

                {/* زر إيقاف كلي */}
                <button
                  type="button"
                  className="w-full py-2.5 px-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95"
                  onClick={stopSending}
                  disabled={!isSendingActive && !isPaused}
                >
                  <i className="fas fa-stop text-sm" />
                  <span>إيقاف كلي ⏹️</span>
                </button>
              </div>

              {/* زر إرسال فوري دفعة واحدة */}
              <button
                type="button"
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-zinc-950 font-black rounded-xl text-xs sm:text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                onClick={sendNow}
                disabled={isSending}
              >
                <i className={`fas ${isSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} />
                <span>{isSending ? 'جاري الإرسال الفعلي...' : 'إرسال فوري الآن دفعة واحدة 🚀'}</span>
              </button>
            </div>

            {/* سجل العمليات الفوري المدمج */}
            <div className="bg-zinc-900/80 rounded-2xl p-4 shadow-xl border border-zinc-800/80">
              <span className="text-zinc-300 text-xs font-bold block mb-2">📋 سجل العمليات المباشر</span>
              <div
                ref={logBoxRef}
                className="bg-zinc-950 rounded-xl p-3 min-h-[100px] max-h-[140px] overflow-y-auto text-xs text-zinc-300 space-y-1 font-mono border border-zinc-800 scrollbar-thin"
              >
                {logs.map((item) => (
                  <div key={item.id} className="py-0.5 border-b border-zinc-800/50 text-[11px] flex items-start gap-1.5">
                    <span className="text-zinc-500 shrink-0">[{item.time}]</span>
                    <span className="text-zinc-200">{item.message}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
