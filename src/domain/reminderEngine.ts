import type {
  AppSettings,
  ItemLocation,
  NhoGiupBackupPayload,
  QuietHoursConfig,
  Reminder,
} from './types';

/** Parse HH:mm into total minutes from midnight (0..1439) */
export function timeToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number.parseInt(hStr || '0', 10);
  const m = Number.parseInt(mStr || '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return Math.max(0, Math.min(23, h)) * 60 + Math.max(0, Math.min(59, m));
}

export function minutesToTime(totalMinutes: number): string {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Checks if a given HH:mm time falls inside configured quiet hours.
 * Correctly handles overnight spans such as 22:00 -> 06:30.
 * Critical ("quan trọng") reminders bypass quiet hours as required.
 */
export function shouldSuppressForQuietHours(
  currentTimeHHmm: string,
  quietHours: QuietHoursConfig,
  isImportant: boolean
): boolean {
  if (!quietHours.enabled) return false;
  if (isImportant) return false;

  const current = timeToMinutes(currentTimeHHmm);
  const start = timeToMinutes(quietHours.startTime);
  const end = timeToMinutes(quietHours.endTime);

  if (start === end) return false;
  if (start < end) {
    // Daytime window, e.g. 13:00 -> 15:00
    return current >= start && current < end;
  }
  // Overnight window, e.g. 22:00 -> 06:30
  return current >= start || current < end;
}

/**
 * Escalates a persistent reminder when the user hasn't marked it Done.
 * Returns updated reminder with incremented nagCount and overdue status.
 */
export function recordPersistentNag(
  reminder: Reminder,
  settings: AppSettings
): { updated: Reminder; reachedMax: boolean } {
  if (reminder.status === 'done' || reminder.status === 'skipped') {
    return { updated: reminder, reachedMax: false };
  }
  const maxNag = reminder.maxNagCount ?? settings.defaultMaxNagCount;
  const nextCount = reminder.nagCount + 1;
  const reachedMax = nextCount >= maxNag;

  return {
    updated: {
      ...reminder,
      status: 'overdue',
      nagCount: nextCount,
      snoozedUntil: null,
    },
    reachedMax,
  };
}

/**
 * Snoozes a reminder by N minutes (default 10 mins) and shifts its snoozedUntil marker.
 */
export function snoozeReminderByMinutes(
  reminder: Reminder,
  minutes: number,
  now: Date = new Date()
): Reminder {
  const target = new Date(now.getTime() + minutes * 60 * 1000);
  return {
    ...reminder,
    status: 'pending',
    snoozedUntil: target.toISOString(),
  };
}

/**
 * Marks a reminder as completed ("Đã làm xong").
 */
export function completeReminder(
  reminder: Reminder,
  now: Date = new Date()
): Reminder {
  return {
    ...reminder,
    status: 'done',
    snoozedUntil: null,
    completedAt: now.toISOString(),
  };
}

/**
 * Marks a reminder as skipped for today ("Bỏ qua hôm nay").
 */
export function skipReminderForToday(reminder: Reminder): Reminder {
  return {
    ...reminder,
    status: 'skipped',
    snoozedUntil: null,
  };
}

/**
 * Determines whether the Emergency Family Contact ("Người thân hỗ trợ") card
 * should surface because at least one important reminder has been missed too many times.
 */
export function getTriggeredEmergencyReminders(
  reminders: Reminder[],
  settings: AppSettings
): Reminder[] {
  if (!settings.emergencyContact.enabled || !settings.emergencyContact.phone.trim()) {
    return [];
  }
  const threshold = Math.max(1, settings.emergencyContact.missedThreshold);
  return reminders.filter(
    (r) =>
      r.isImportant &&
      r.status === 'overdue' &&
      r.nagCount >= threshold
  );
}

/**
 * Selects the single most prominent "Việc tiếp theo" (Next Up) reminder for the Home hero card:
 * 1. Most urgent overdue reminder (important first, highest nagCount, earliest time)
 * 2. Otherwise earliest pending reminder
 */
export function selectHeroReminder(reminders: Reminder[]): Reminder | null {
  const active = reminders.filter((r) => r.status === 'overdue' || r.status === 'pending');
  if (active.length === 0) return null;

  const sorted = [...active].sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (b.status === 'overdue' && a.status !== 'overdue') return 1;
    if (a.isImportant !== b.isImportant) return a.isImportant ? -1 : 1;
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  return sorted[0];
}

/**
 * Orders today's reminders cleanly: Overdue first, then Pending by time, then Done/Skipped.
 */
export function sortTodayReminders(reminders: Reminder[]): Reminder[] {
  const rank: Record<Reminder['status'], number> = {
    overdue: 0,
    pending: 1,
    done: 2,
    skipped: 3,
  };
  return [...reminders].sort((a, b) => {
    const rDiff = rank[a.status] - rank[b.status];
    if (rDiff !== 0) return rDiff;
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });
}

/**
 * Strips Vietnamese diacritics for forgiving search ("chia khoa" matches "Chìa khóa").
 */
export function normalizeVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

export function filterItemLocations(items: ItemLocation[], query: string): ItemLocation[] {
  const normalizedQuery = normalizeVietnamese(query);
  if (!normalizedQuery) return items;
  return items.filter((item) => {
    const haystack = normalizeVietnamese(
      `${item.itemName} ${item.location} ${item.note ?? ''}`
    );
    return haystack.includes(normalizedQuery);
  });
}

/**
 * Validates an imported JSON backup file before restoring state.
 */
export function validateBackupPayload(raw: unknown): {
  valid: boolean;
  payload?: NhoGiupBackupPayload;
  error?: string;
} {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Tệp JSON không hợp lệ.' };
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.reminders) || !Array.isArray(obj.checklists) || !Array.isArray(obj.itemLocations)) {
    return { valid: false, error: 'Thiếu dữ liệu nhắc việc, danh sách hoặc vị trí đồ vật.' };
  }
  if (!obj.settings || typeof obj.settings !== 'object') {
    return { valid: false, error: 'Thiếu cấu hình cài đặt trong tệp sao lưu.' };
  }
  return {
    valid: true,
    payload: obj as unknown as NhoGiupBackupPayload,
  };
}
