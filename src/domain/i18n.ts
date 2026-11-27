import type { AppLanguage, RepeatType } from './types';

export interface Translations {
  appName: string;
  navHome: string;
  navChecklists: string;
  navItems: string;
  navSettings: string;
  navAndroid: string;
  addReminderCta: string;
  voiceQuickButton: string;
  nextUpLabel: string;
  overdueTag: string;
  importantTag: string;
  doneTag: string;
  skippedTag: string;
  pendingTag: string;
  markDone: string;
  snooze10: string;
  skipToday: string;
  todayHistoryTitle: string;
  completedSummary: string;
  testNotificationBtn: string;
  nagAgainBtn: string;
  emergencyTitle: string;
  emergencyDesc: string;
  callRelative: string;
  smsRelative: string;
  allDoneTitle: string;
  allDoneSubtitle: string;
  checklistTitle: string;
  checklistSubtitle: string;
  newChecklistBtn: string;
  resetChecklistBtn: string;
  addItemPlaceholder: string;
  itemsTitle: string;
  itemsSubtitle: string;
  searchItemsPlaceholder: string;
  addItemLocationBtn: string;
  settingsTitle: string;
  settingsSubtitle: string;
  androidTitle: string;
  androidSubtitle: string;
  downloadZipBtn: string;
  repeatLabels: Record<RepeatType, string>;
}

const VI: Translations = {
  appName: 'Nhớ Giúp',
  navHome: 'Hôm nay',
  navChecklists: 'Ra khỏi nhà',
  navItems: 'Tìm đồ',
  navSettings: 'Cài đặt',
  navAndroid: 'Xuất APK',
  addReminderCta: 'Thêm nhắc việc',
  voiceQuickButton: 'Nói để nhắc việc',
  nextUpLabel: 'Việc tiếp theo',
  overdueTag: 'Quá giờ',
  importantTag: 'Quan trọng',
  doneTag: 'Đã xong',
  skippedTag: 'Bỏ qua hôm nay',
  pendingTag: 'Sắp tới',
  markDone: 'Đã làm xong',
  snooze10: 'Nhắc lại sau 10 phút',
  skipToday: 'Bỏ qua hôm nay',
  todayHistoryTitle: 'Lịch sử hôm nay',
  completedSummary: 'hoàn thành',
  testNotificationBtn: 'Thử thông báo',
  nagAgainBtn: 'Mô phỏng nhắc lại',
  emergencyTitle: 'Cần người thân hỗ trợ?',
  emergencyDesc: 'Bạn đã bỏ lỡ một việc quan trọng nhiều lần. Nhấn bên dưới để gọi hoặc gửi tin nhắn ngay cho người thân.',
  callRelative: 'Gọi ngay',
  smsRelative: 'Nhắn tin sẵn',
  allDoneTitle: 'Tuyệt vời! Hôm nay đã hoàn thành hết',
  allDoneSubtitle: 'Bạn có thể nghỉ ngơi hoặc bấm nút Thêm nhắc việc để lên lịch mới.',
  checklistTitle: 'Trước khi ra khỏi nhà',
  checklistSubtitle: 'Kiểm tra nhanh từng món đồ quan trọng trước giờ đi để không bao giờ quên.',
  newChecklistBtn: 'Tạo danh sách mới',
  resetChecklistBtn: 'Làm mới danh sách',
  addItemPlaceholder: 'Thêm đồ cần mang (ví dụ: Ô che nắng)...',
  itemsTitle: 'Tôi để đồ ở đâu?',
  itemsSubtitle: 'Ghi nhanh nơi cất đồ kèm ảnh chụp. Gõ không dấu vẫn tìm ra ngay.',
  searchItemsPlaceholder: 'Tìm nhanh đồ vật (ví dụ: chia khoa, kinh, vi)...',
  addItemLocationBtn: 'Ghi vị trí mới',
  settingsTitle: 'Cài đặt',
  settingsSubtitle: 'Tùy chỉnh cỡ chữ, âm báo, độ kiên trì nhắc việc và sao lưu hoàn toàn ngoại tuyến.',
  androidTitle: 'Mã nguồn Android & Build APK',
  androidSubtitle: 'Toàn bộ dự án Kotlin + Jetpack Compose + Material 3 + Room + AlarmManager chia rõ package và sẵn sàng xuất file APK.',
  downloadZipBtn: 'Tải dự án Android (.zip)',
  repeatLabels: {
    once: 'Một lần',
    daily: 'Hằng ngày',
    weekdays: 'Các thứ trong tuần',
    monthly: 'Hằng tháng',
  },
};

const EN: Translations = {
  appName: 'Nhớ Giúp',
  navHome: 'Today',
  navChecklists: 'Before Leaving',
  navItems: 'Find Items',
  navSettings: 'Settings',
  navAndroid: 'Android APK',
  addReminderCta: 'Add Reminder',
  voiceQuickButton: 'Speak Reminder',
  nextUpLabel: 'Up Next',
  overdueTag: 'Overdue',
  importantTag: 'Important',
  doneTag: 'Done',
  skippedTag: 'Skipped Today',
  pendingTag: 'Upcoming',
  markDone: 'Mark Done',
  snooze10: 'Remind in 10m',
  skipToday: 'Skip Today',
  todayHistoryTitle: "Today's Schedule",
  completedSummary: 'completed',
  testNotificationBtn: 'Test Notification',
  nagAgainBtn: 'Simulate Nag',
  emergencyTitle: 'Reach out to family?',
  emergencyDesc: 'An important reminder was missed several times. Tap below to call or send a pre-filled message.',
  callRelative: 'Call Now',
  smsRelative: 'Send SMS',
  allDoneTitle: 'All caught up for today!',
  allDoneSubtitle: 'You can relax or tap Add Reminder to schedule something new.',
  checklistTitle: 'Before Leaving Home',
  checklistSubtitle: 'Check off essential items before heading out so nothing stays behind.',
  newChecklistBtn: 'New List',
  resetChecklistBtn: 'Reset Checks',
  addItemPlaceholder: 'Add item to bring (e.g. Umbrella)...',
  itemsTitle: 'Where Did I Put It?',
  itemsSubtitle: 'Save where you kept important items with an optional photo and instant search.',
  searchItemsPlaceholder: 'Search items or places (e.g. keys, glasses, wallet)...',
  addItemLocationBtn: 'Save Item Spot',
  settingsTitle: 'Settings',
  settingsSubtitle: 'Customize text size, sound, persistent repeat intervals, quiet hours, and offline JSON backup.',
  androidTitle: 'Android Source & APK Guide',
  androidSubtitle: 'Complete Kotlin + Jetpack Compose + Material 3 + Room + AlarmManager Android project ready to build into an APK.',
  downloadZipBtn: 'Download Android Project (.zip)',
  repeatLabels: {
    once: 'Once',
    daily: 'Daily',
    weekdays: 'Selected Days',
    monthly: 'Monthly',
  },
};

export function getTranslations(lang: AppLanguage): Translations {
  return lang === 'en' ? EN : VI;
}
