// =========================================================================
// TELEGRAM 12.x OFFICIAL PEER COLOR & AVATAR ENGINE (DrKLO/Telegram)
// =========================================================================

export interface PeerColorPalette {
  name: string;
  gradient: string;
  color: string;
  bgRgb: string;
}

// Exact Telegram 7-color peer gradient palette from DrKLO/Telegram Android (AvatarDrawable.java)
export const TELEGRAM_PEER_COLORS: PeerColorPalette[] = [
  {
    name: 'red',
    gradient: 'linear-gradient(135deg, #e17076 0%, #ff885e 100%)',
    color: '#e17076',
    bgRgb: '225, 112, 118',
  },
  {
    name: 'orange',
    gradient: 'linear-gradient(135deg, #faa774 0%, #ffbe5b 100%)',
    color: '#faa774',
    bgRgb: '250, 167, 116',
  },
  {
    name: 'violet',
    gradient: 'linear-gradient(135deg, #a695e7 0%, #8561c5 100%)',
    color: '#a695e7',
    bgRgb: '166, 149, 231',
  },
  {
    name: 'green',
    gradient: 'linear-gradient(135deg, #7bc862 0%, #6ec9cb 100%)',
    color: '#7bc862',
    bgRgb: '123, 200, 98',
  },
  {
    name: 'cyan',
    gradient: 'linear-gradient(135deg, #6ec9cb 0%, #539ecb 100%)',
    color: '#6ec9cb',
    bgRgb: '110, 201, 203',
  },
  {
    name: 'blue',
    gradient: 'linear-gradient(135deg, #65aadd 0%, #5375d5 100%)',
    color: '#65aadd',
    bgRgb: '101, 170, 221',
  },
  {
    name: 'pink',
    gradient: 'linear-gradient(135deg, #ee7aae 0%, #d0467c 100%)',
    color: '#ee7aae',
    bgRgb: '238, 122, 174',
  },
];

/**
 * Calculates the exact deterministic Telegram peer color index (0 to 6)
 * according to DrKLO/Telegram Android AvatarDrawable logic.
 */
export function getPeerColorIndex(peerIdOrTitle: string | number): number {
  if (typeof peerIdOrTitle === 'number') {
    return Math.abs(peerIdOrTitle) % 7;
  }
  const str = String(peerIdOrTitle || 'Telegram').trim();
  const num = parseInt(str.replace(/[^\d]/g, ''), 10);
  if (!isNaN(num) && num > 0) {
    return Math.abs(num) % 7;
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % 7;
}

export function getPeerColor(peerIdOrTitle: string | number): PeerColorPalette {
  const idx = getPeerColorIndex(peerIdOrTitle);
  return TELEGRAM_PEER_COLORS[idx];
}

/**
 * Formats user/group name initials with support for Arabic and Latin scripts
 */
export function getPeerInitials(title: string): string {
  if (!title) return 'TG';
  const clean = title
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim();
  if (!clean) return title.charAt(0).toUpperCase() || 'TG';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return clean.slice(0, Math.min(2, clean.length)).toUpperCase();
}

export interface NotificationToneInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  icon: string;
}

export const AVAILABLE_NOTIFICATION_TONES: NotificationToneInfo[] = [
  {
    id: 'default',
    nameAr: 'تيليجرام الكلاسيكية (افتراضي)',
    nameEn: 'Telegram Classic (Default)',
    descAr: 'النغمة الأصلية المزدوجة الشهيرة لتطبيق تيليجرام',
    descEn: 'Original signature Telegram incoming chime',
    icon: '🔔',
  },
  {
    id: 'crystal',
    nameAr: 'جرس بلوري ناعم',
    nameEn: 'Crystal Bell',
    descAr: 'رنين بلوري نقي وعالي الوضوح',
    descEn: 'Crisp, high-definition crystalline chime',
    icon: '💎',
  },
  {
    id: 'radar',
    nameAr: 'رادار وتنبيه عاجل',
    nameEn: 'Radar Pulse',
    descAr: 'نبضات ثنائية تكتيكية مخصصة للمجموعات المهمة',
    descEn: 'Tactical dual-pulse alert for important channels',
    icon: '🚨',
  },
  {
    id: 'droplet',
    nameAr: 'قطرة ماء هادئة',
    nameEn: 'Soft Droplet',
    descAr: 'صوت هادئ غير مزعج بتأثير ارتداد مائي',
    descEn: 'Subtle, organic water drop ripple tone',
    icon: '💧',
  },
  {
    id: 'synth',
    nameAr: 'سينث إلكتروني صاعد',
    nameEn: 'Modern Synth',
    descAr: 'نغمة تصاعدية ثلاثية عصرية وخفيفة',
    descEn: 'Ascending futuristic 3-chord electronic chime',
    icon: '⚡',
  },
  {
    id: 'subtle',
    nameAr: 'نقرة خفيفة (Pop)',
    nameEn: 'Subtle Pop',
    descAr: 'صوت مقتضب وهادئ جداً للمحادثات المتكررة',
    descEn: 'Gentle, minimalist click for busy chats',
    icon: '✨',
  },
  {
    id: 'silent',
    nameAr: 'صامت (بدون صوت)',
    nameEn: 'Mute / Silent',
    descAr: 'تلقي الإشعار في الواجهة دون إصدار أي صوت',
    descEn: 'Visual notification only with no sound',
    icon: '🔕',
  },
];

const CUSTOM_TONES_STORAGE_KEY = 'telegram_custom_chat_tones';
const DEFAULT_TONE_STORAGE_KEY = 'telegram_default_notification_tone';

/**
 * Get the custom tone assigned to a specific chat ID from localStorage
 */
export function getCustomChatTone(chatId: string | number): string | null {
  try {
    const raw = localStorage.getItem(CUSTOM_TONES_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[String(chatId)] || null;
  } catch (e) {
    return null;
  }
}

/**
 * Set or update the custom tone for a specific chat ID in localStorage
 */
export function setCustomChatTone(chatId: string | number, toneId: string): void {
  try {
    const raw = localStorage.getItem(CUSTOM_TONES_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    if (toneId === 'default') {
      delete map[String(chatId)];
    } else {
      map[String(chatId)] = toneId;
    }
    localStorage.setItem(CUSTOM_TONES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save custom chat tone to localStorage:', e);
  }
}

/**
 * Remove a custom tone assignment for a specific chat ID
 */
export function removeCustomChatTone(chatId: string | number): void {
  setCustomChatTone(chatId, 'default');
}

/**
 * Get all custom chat tones mapping from localStorage
 */
export function getAllCustomChatTones(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CUSTOM_TONES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Get the global default notification tone ID
 */
export function getDefaultNotificationTone(): string {
  try {
    return localStorage.getItem(DEFAULT_TONE_STORAGE_KEY) || 'default';
  } catch (e) {
    return 'default';
  }
}

/**
 * Set the global default notification tone ID in localStorage
 */
export function setDefaultNotificationTone(toneId: string): void {
  try {
    localStorage.setItem(DEFAULT_TONE_STORAGE_KEY, toneId);
  } catch (e) {
    console.error('Failed to save default notification tone to localStorage:', e);
  }
}

/**
 * Synthesizes a specific tone using the Web Audio API
 */
export function playToneById(toneId: string) {
  if (toneId === 'silent') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    switch (toneId) {
      case 'crystal': {
        // High crystalline chime (C6 1046Hz -> E6 1318Hz -> C7 2093Hz)
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now);
        osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(2093.0, now + 0.2);

        oscHarmonic.type = 'triangle';
        oscHarmonic.frequency.setValueAtTime(2093.0, now);
        oscHarmonic.frequency.exponentialRampToValueAtTime(3135.96, now + 0.15);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        oscHarmonic.start(now);
        osc.stop(now + 0.45);
        oscHarmonic.stop(now + 0.45);
        break;
      }

      case 'radar': {
        // Double tactical pulse (1200Hz -> 1600Hz x 2)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1600, now + 0.08);
        osc.frequency.setValueAtTime(1200, now + 0.16);
        osc.frequency.setValueAtTime(1800, now + 0.24);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.setValueAtTime(0.01, now + 0.07);
        gain.gain.setValueAtTime(0.18, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      case 'droplet': {
        // Water droplet sweep (600Hz -> 1800Hz quick bell)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.09); // A6
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'synth': {
        // Triad synth chord arpeggio (C5 523Hz -> E5 659Hz -> G5 784Hz -> C6 1046Hz)
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteTime = now + idx * 0.05;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.18, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.28);
        });
        break;
      }

      case 'subtle': {
        // Gentle minimalist pop (440Hz -> 880Hz soft click)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case 'default':
      default: {
        // Dual harmonic signature Telegram chime (880Hz A5 + 1760Hz A6 harmonic)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6
        osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.18); // A6

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(440, now);
        osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
        break;
      }
    }
  } catch (e) {
    // Audio Context might require gesture
  }
}

/**
 * Plays the appropriate notification sound taking into account specific chat overrides
 */
export function playTelegramIncomingSound(chatId?: string | number) {
  try {
    let toneToPlay = getDefaultNotificationTone();
    if (chatId) {
      const customTone = getCustomChatTone(chatId);
      if (customTone) {
        toneToPlay = customTone;
      }
    }
    playToneById(toneToPlay);
  } catch (e) {
    // Fallback
  }
}
