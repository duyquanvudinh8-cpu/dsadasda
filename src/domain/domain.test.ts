import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVietnameseVoiceCommand } from './voiceParser';
import {
  completeReminder,
  filterItemLocations,
  getTriggeredEmergencyReminders,
  normalizeVietnamese,
  recordPersistentNag,
  selectHeroReminder,
  shouldSuppressForQuietHours,
  snoozeReminderByMinutes,
  validateBackupPayload,
} from './reminderEngine';
import { INITIAL_ITEM_LOCATIONS, INITIAL_REMINDERS, INITIAL_SETTINGS } from './seedData';

test('parseVietnameseVoiceCommand parses "nhắc tôi tắt bếp lúc 7 giờ tối"', () => {
  const ref = new Date('2026-11-27T10:00:00');
  const parsed = parseVietnameseVoiceCommand('nhắc tôi tắt bếp lúc 7 giờ tối', ref);
  assert.equal(parsed.title, 'Tắt bếp');
  assert.equal(parsed.time, '19:00');
  assert.equal(parsed.isImportant, true);
  assert.equal(parsed.repeatType, 'once');
});

test('parseVietnameseVoiceCommand parses "nhớ uống thuốc lúc 8h30 sáng mỗi ngày"', () => {
  const ref = new Date('2026-11-27T07:00:00');
  const parsed = parseVietnameseVoiceCommand('nhớ uống thuốc lúc 8h30 sáng mỗi ngày', ref);
  assert.equal(parsed.title, 'Uống thuốc');
  assert.equal(parsed.time, '08:30');
  assert.equal(parsed.repeatType, 'daily');
  assert.equal(parsed.isImportant, true);
});

test('parseVietnameseVoiceCommand parses relative minutes "khóa cửa sau 15 phút"', () => {
  const ref = new Date('2026-11-27T14:10:00');
  const parsed = parseVietnameseVoiceCommand('khóa cửa sau 15 phút', ref);
  assert.equal(parsed.title, 'Khóa cửa');
  assert.equal(parsed.time, '14:25');
  assert.equal(parsed.isImportant, true);
});

test('parseVietnameseVoiceCommand parses half-hour "đi chợ lúc 6 giờ rưỡi sáng ngày mai"', () => {
  const ref = new Date('2026-11-27T14:00:00');
  const parsed = parseVietnameseVoiceCommand('đi chợ lúc 6 giờ rưỡi sáng ngày mai', ref);
  assert.equal(parsed.title, 'Đi chợ');
  assert.equal(parsed.time, '06:30');
  assert.equal(parsed.date, '2026-11-28');
});

test('shouldSuppressForQuietHours handles overnight range and lets important tasks through', () => {
  const quiet = { enabled: true, startTime: '22:00', endTime: '06:30' };
  assert.equal(shouldSuppressForQuietHours('23:15', quiet, false), true);
  assert.equal(shouldSuppressForQuietHours('05:45', quiet, false), true);
  assert.equal(shouldSuppressForQuietHours('08:00', quiet, false), false);
  // Important reminders always bypass quiet hours
  assert.equal(shouldSuppressForQuietHours('23:15', quiet, true), false);
});

test('recordPersistentNag escalates reminder and triggers emergency contact at threshold', () => {
  const base = INITIAL_REMINDERS[0]; // important, overdue, nagCount: 2
  // Threshold is 3 -> not triggered yet at 2
  assert.equal(getTriggeredEmergencyReminders([base], INITIAL_SETTINGS).length, 0);

  const { updated, reachedMax } = recordPersistentNag(base, INITIAL_SETTINGS);
  assert.equal(updated.nagCount, 3);
  assert.equal(updated.status, 'overdue');
  assert.equal(reachedMax, false);

  // Now threshold 3 is reached -> triggers family contact alert
  assert.equal(getTriggeredEmergencyReminders([updated], INITIAL_SETTINGS).length, 1);

  // Marking done clears emergency trigger
  const done = completeReminder(updated);
  assert.equal(done.status, 'done');
  assert.equal(getTriggeredEmergencyReminders([done], INITIAL_SETTINGS).length, 0);
});

test('snoozeReminderByMinutes sets pending status and snoozedUntil', () => {
  const now = new Date('2026-11-27T08:30:00Z');
  const snoozed = snoozeReminderByMinutes(INITIAL_REMINDERS[0], 10, now);
  assert.equal(snoozed.status, 'pending');
  assert.equal(snoozed.snoozedUntil, '2026-11-27T08:40:00.000Z');
});

test('selectHeroReminder prioritizes overdue important task over later pending tasks', () => {
  const hero = selectHeroReminder(INITIAL_REMINDERS);
  assert.ok(hero);
  assert.equal(hero.id, 'rem-1');
});

test('filterItemLocations matches Vietnamese text without diacritics', () => {
  assert.equal(normalizeVietnamese('Chìa khóa nhà'), 'chia khoa nha');
  const matched = filterItemLocations(INITIAL_ITEM_LOCATIONS, 'chia khoa');
  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, 'loc-1');
});

test('validateBackupPayload accepts valid payload and rejects malformed JSON', () => {
  const ok = validateBackupPayload({
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'Nhớ Giúp',
    reminders: INITIAL_REMINDERS,
    checklists: [],
    itemLocations: [],
    settings: INITIAL_SETTINGS,
  });
  assert.equal(ok.valid, true);

  const bad = validateBackupPayload({ hello: 'world' });
  assert.equal(bad.valid, false);
});

test('Android project bundle includes CI APK workflow, adaptive icons, and all 4 packages', async () => {
  const { ALL_ANDROID_SOURCE_FILES } = await import('../androidProject');
  const paths = new Set(ALL_ANDROID_SOURCE_FILES.map((f) => f.path));

  assert.ok(paths.has('.github/workflows/build-apk.yml'), 'Missing GitHub Actions APK workflow');
  assert.ok(paths.has('app/build.gradle.kts'), 'Missing app/build.gradle.kts');
  assert.ok(paths.has('app/src/main/AndroidManifest.xml'), 'Missing AndroidManifest.xml');
  assert.ok(paths.has('app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'), 'Missing launcher icon');
  assert.ok(paths.has('app/src/main/java/com/nhogiup/app/ui/screens/OnboardingScreen.kt'), 'Missing OnboardingScreen.kt');
  assert.ok(paths.has('app/src/main/java/com/nhogiup/app/ui/screens/ChecklistScreen.kt'), 'Missing ChecklistScreen.kt');
  assert.ok(paths.has('app/src/main/java/com/nhogiup/app/ui/screens/ItemLocationScreen.kt'), 'Missing ItemLocationScreen.kt');
  assert.ok(paths.has('app/src/main/java/com/nhogiup/app/ui/screens/SettingsScreen.kt'), 'Missing SettingsScreen.kt');
  assert.ok(paths.has('app/src/main/java/com/nhogiup/app/alarm/BootCompletedReceiver.kt'), 'Missing BootCompletedReceiver.kt');

  for (const file of ALL_ANDROID_SOURCE_FILES) {
    assert.ok(file.content.trim().length > 20, `File ${file.path} should not be empty`);
  }
});
