export type RepeatType = 'once' | 'daily' | 'weekdays' | 'monthly';

export type ReminderStatus = 'pending' | 'overdue' | 'done' | 'skipped';

export type ThemeMode = 'light' | 'dark';

export type FontScaleOption = 'normal' | 'large' | 'xlarge';

export type AppLanguage = 'vi' | 'en';

export type AppTab = 'home' | 'checklists' | 'items' | 'settings' | 'android';

export interface Reminder {
  id: string;
  title: string;
  note?: string;
  /** Time in HH:mm (24-hour format) */
  time: string;
  /** Date string YYYY-MM-DD for the current scheduled occurrence */
  date: string;
  repeatType: RepeatType;
  /** 1 = Mon ... 7 = Sun (used when repeatType === 'weekdays') */
  repeatDays: number[];
  isImportant: boolean;
  status: ReminderStatus;
  /** Number of nagging follow-up reminders already fired without completion */
  nagCount: number;
  /** Custom nagging interval in minutes (overrides global default if set) */
  nagIntervalMinutes?: number;
  /** Custom max nagging attempts (overrides global default if set) */
  maxNagCount?: number;
  /** ISO timestamp when snoozed until */
  snoozedUntil?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface ChecklistGroup {
  id: string;
  name: string;
  /** Scheduled reminder time before leaving in HH:mm */
  reminderTime: string;
  reminderEnabled: boolean;
  items: ChecklistItem[];
}

export interface ItemLocation {
  id: string;
  itemName: string;
  location: string;
  note?: string;
  photoUrl?: string;
  updatedAt: string;
}

export interface EmergencyContact {
  enabled: boolean;
  name: string;
  relation: string;
  phone: string;
  missedThreshold: number;
}

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface PermissionChecklistState {
  notificationsGranted: boolean;
  exactAlarmGranted: boolean;
  batteryOptimizationIgnored: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  fontScale: FontScaleOption;
  language: AppLanguage;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  defaultNagIntervalMinutes: number;
  defaultMaxNagCount: number;
  quietHours: QuietHoursConfig;
  emergencyContact: EmergencyContact;
  onboardingCompleted: boolean;
  permissions: PermissionChecklistState;
}

export interface NhoGiupBackupPayload {
  version: number;
  exportedAt: string;
  appName: 'Nhớ Giúp';
  reminders: Reminder[];
  checklists: ChecklistGroup[];
  itemLocations: ItemLocation[];
  settings: AppSettings;
}
