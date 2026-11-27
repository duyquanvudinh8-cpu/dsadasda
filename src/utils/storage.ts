import type { AppSettings, ChecklistGroup, ItemLocation, Reminder } from '../domain/types';
import {
  INITIAL_CHECKLISTS,
  INITIAL_ITEM_LOCATIONS,
  INITIAL_REMINDERS,
  INITIAL_SETTINGS,
} from '../domain/seedData';

const STORAGE_KEYS = {
  reminders: 'nhogiup_v1_reminders',
  checklists: 'nhogiup_v1_checklists',
  items: 'nhogiup_v1_items',
  settings: 'nhogiup_v1_settings',
} as const;

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors silently
  }
}

export function loadStoredState(): {
  reminders: Reminder[];
  checklists: ChecklistGroup[];
  itemLocations: ItemLocation[];
  settings: AppSettings;
} {
  const settings = {
    ...INITIAL_SETTINGS,
    ...safeRead<Partial<AppSettings>>(STORAGE_KEYS.settings, {}),
  };
  return {
    reminders: safeRead<Reminder[]>(STORAGE_KEYS.reminders, INITIAL_REMINDERS),
    checklists: safeRead<ChecklistGroup[]>(STORAGE_KEYS.checklists, INITIAL_CHECKLISTS),
    itemLocations: safeRead<ItemLocation[]>(STORAGE_KEYS.items, INITIAL_ITEM_LOCATIONS),
    settings,
  };
}

export function persistReminders(reminders: Reminder[]): void {
  safeWrite(STORAGE_KEYS.reminders, reminders);
}

export function persistChecklists(checklists: ChecklistGroup[]): void {
  safeWrite(STORAGE_KEYS.checklists, checklists);
}

export function persistItemLocations(items: ItemLocation[]): void {
  safeWrite(STORAGE_KEYS.items, items);
}

export function persistSettings(settings: AppSettings): void {
  safeWrite(STORAGE_KEYS.settings, settings);
}

/**
 * Plays a gentle two-tone chime via Web Audio API when sound is enabled.
 */
export function playReminderChime(enabled: boolean, important = false): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = important ? [587.33, 880, 1046.5] : [523.25, 659.25];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);
      gain.gain.setValueAtTime(0.001, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.16 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.38);
    });
  } catch {
    // Audio playback blocked before interaction; safely ignored
  }
}

export function triggerDeviceVibration(enabled: boolean): void {
  if (!enabled || typeof navigator === 'undefined') return;
  if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
    navigator.vibrate([160, 80, 160]);
  }
}
