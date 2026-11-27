/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  CheckSquare,
  Download,
  Home,
  MapPin,
  Plus,
  Settings,
} from 'lucide-react';
import type {
  AppSettings,
  AppTab,
  ChecklistGroup,
  ItemLocation,
  NhoGiupBackupPayload,
  Reminder,
} from './domain/types';
import { getTranslations } from './domain/i18n';
import {
  completeReminder,
  recordPersistentNag,
  skipReminderForToday,
  snoozeReminderByMinutes,
} from './domain/reminderEngine';
import {
  loadStoredState,
  persistChecklists,
  persistItemLocations,
  persistReminders,
  persistSettings,
  playReminderChime,
  triggerDeviceVibration,
} from './utils/storage';
import { OnboardingFlow } from './components/OnboardingFlow';
import { NotificationBanner } from './components/NotificationBanner';
import { AddReminderModal } from './components/AddReminderModal';
import { HomeView } from './components/HomeView';
import { ChecklistsView } from './components/ChecklistsView';
import { ItemLocatorView } from './components/ItemLocatorView';
import { SettingsView } from './components/SettingsView';
import { AndroidExportView } from './components/AndroidExportView';

function hasAutostartParam(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('autostart') === '1';
}

export default function App() {
  const initial = loadStoredState();
  const [reminders, setReminders] = useState<Reminder[]>(initial.reminders);
  const [checklists, setChecklists] = useState<ChecklistGroup[]>(initial.checklists);
  const [itemLocations, setItemLocations] = useState<ItemLocation[]>(initial.itemLocations);
  const [settings, setSettings] = useState<AppSettings>(() => ({
    ...initial.settings,
    onboardingCompleted: initial.settings.onboardingCompleted || hasAutostartParam(),
  }));

  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalVoiceMode, setAddModalVoiceMode] = useState(false);
  const [addModalTranscript, setAddModalTranscript] = useState('');

  const t = getTranslations(settings.language);

  // Sync dark mode class and font scale onto <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', settings.theme === 'dark');
    root.dataset.fontScale = settings.fontScale;
    root.lang = settings.language;
  }, [settings.theme, settings.fontScale, settings.language]);

  // Persist offline changes to localStorage
  useEffect(() => {
    persistReminders(reminders);
  }, [reminders]);

  useEffect(() => {
    persistChecklists(checklists);
  }, [checklists]);

  useEffect(() => {
    persistItemLocations(itemLocations);
  }, [itemLocations]);

  useEffect(() => {
    persistSettings(settings);
  }, [settings]);

  const activeNotificationReminder = activeNotificationId
    ? reminders.find((r) => r.id === activeNotificationId) ?? null
    : null;

  const fireNotificationFor = (reminder: Reminder) => {
    setActiveNotificationId(reminder.id);
    playReminderChime(settings.soundEnabled, reminder.isImportant);
    triggerDeviceVibration(settings.vibrationEnabled);
  };

  // Reminder handlers
  const handleMarkDone = (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? completeReminder(r) : r)));
    if (activeNotificationId === id) setActiveNotificationId(null);
  };

  const handleUndoDone = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'pending', completedAt: null } : r))
    );
  };

  const handleSnooze10 = (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? snoozeReminderByMinutes(r, 10) : r)));
    if (activeNotificationId === id) setActiveNotificationId(null);
  };

  const handleSkipToday = (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? skipReminderForToday(r) : r)));
    if (activeNotificationId === id) setActiveNotificationId(null);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    if (activeNotificationId === id) setActiveNotificationId(null);
  };

  const handleSimulateNag = (id: string) => {
    let escalated: Reminder | null = null;
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const { updated } = recordPersistentNag(r, settings);
        escalated = updated;
        return updated;
      })
    );
    if (escalated) {
      fireNotificationFor(escalated);
    }
  };

  const handleSaveReminder = (
    draft: Omit<Reminder, 'id' | 'status' | 'nagCount' | 'createdAt'>
  ) => {
    const created: Reminder = {
      ...draft,
      id: `rem-${Date.now()}`,
      status: 'pending',
      nagCount: 0,
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [created, ...prev]);
    setActiveTab('home');
  };

  // Checklist handlers
  const handleToggleChecklistItem = (groupId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              items: g.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
              ),
            }
      )
    );
  };

  const handleAddChecklistItem = (groupId: string, label: string) => {
    setChecklists((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              items: [...g.items, { id: `ci-${Date.now()}`, label, checked: false }],
            }
      )
    );
  };

  const handleDeleteChecklistItem = (groupId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((g) =>
        g.id !== groupId ? g : { ...g, items: g.items.filter((i) => i.id !== itemId) }
      )
    );
  };

  const handleResetChecklistGroup = (groupId: string) => {
    setChecklists((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : { ...g, items: g.items.map((i) => ({ ...i, checked: false })) }
      )
    );
  };

  const handleUpdateChecklistSchedule = (
    groupId: string,
    time: string,
    enabled: boolean
  ) => {
    setChecklists((prev) =>
      prev.map((g) =>
        g.id !== groupId ? g : { ...g, reminderTime: time, reminderEnabled: enabled }
      )
    );
  };

  const handleCreateChecklistGroup = (name: string, time: string) => {
    const newGroup: ChecklistGroup = {
      id: `chk-${Date.now()}`,
      name,
      reminderTime: time,
      reminderEnabled: true,
      items: [
        { id: `ci-${Date.now()}-1`, label: 'Chìa khóa nhà', checked: false },
        { id: `ci-${Date.now()}-2`, label: 'Điện thoại & ví tiền', checked: false },
      ],
    };
    setChecklists((prev) => [...prev, newGroup]);
  };

  // Item Locator handlers
  const handleAddItemLocation = (item: Omit<ItemLocation, 'id' | 'updatedAt'>) => {
    const newItem: ItemLocation = {
      ...item,
      id: `loc-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setItemLocations((prev) => [newItem, ...prev]);
  };

  const handleDeleteItemLocation = (id: string) => {
    setItemLocations((prev) => prev.filter((i) => i.id !== id));
  };

  // JSON Backup Export & Restore
  const handleExportBackup = () => {
    const payload: NhoGiupBackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'Nhớ Giúp',
      reminders,
      checklists,
      itemLocations,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nho-giup-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (payload: NhoGiupBackupPayload) => {
    setReminders(payload.reminders);
    setChecklists(payload.checklists);
    setItemLocations(payload.itemLocations);
    setSettings({
      ...payload.settings,
      onboardingCompleted: true,
    });
  };

  const openAddModal = (voiceMode = false, transcript = '') => {
    setAddModalVoiceMode(voiceMode);
    setAddModalTranscript(transcript);
    setAddModalOpen(true);
  };

  if (!settings.onboardingCompleted) {
    return (
      <OnboardingFlow
        settings={settings}
        onUpdateSettings={setSettings}
        onFinish={() =>
          setSettings((prev) => ({ ...prev, onboardingCompleted: true }))
        }
      />
    );
  }

  const navItems: { id: AppTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'checklists', label: t.navChecklists, icon: CheckSquare },
    { id: 'items', label: t.navItems, icon: MapPin },
    { id: 'settings', label: t.navSettings, icon: Settings },
    { id: 'android', label: t.navAndroid, icon: Download },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8F7] dark:bg-[#0D1314] text-[#111918] dark:text-[#EDF3F1] flex flex-col">
      {/* Interactive Android Heads-Up Notification Banner */}
      {activeNotificationReminder && (
        <NotificationBanner
          reminder={activeNotificationReminder}
          nagIntervalMinutes={settings.defaultNagIntervalMinutes}
          maxNagCount={settings.defaultMaxNagCount}
          onDone={handleMarkDone}
          onSnooze10={handleSnooze10}
          onSkipToday={handleSkipToday}
          onDismiss={() => setActiveNotificationId(null)}
        />
      )}

      {/* Top Bar Contract: 3 zones separated by gap-8 (Brand wordmark | 5 single-line nav links | 1 primary CTA) */}
      <header className="sticky top-0 z-30 h-14 md:h-16 bg-white/92 dark:bg-[#131C1E]/92 backdrop-blur-md border-b border-[#DCE5E2] dark:border-[#243235]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="font-display text-xl font-extrabold tracking-tight text-[#0F766E] dark:text-[#2DD4BF] whitespace-nowrap shrink-0"
          >
            {t.appName}
          </button>

          {/* Zone 2: 5 clean single-line text nav links on desktop */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center gap-6 text-sm font-semibold"
          >
            {navItems.map((nav) => {
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setActiveTab(nav.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[44px] px-1 border-b-2 transition-colors duration-100 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-[#0F766E] dark:border-[#2DD4BF] text-[#0F766E] dark:text-[#2DD4BF]'
                      : 'border-transparent text-[#475B57] dark:text-[#9BB2AD] hover:text-[#111918] dark:hover:text-white'
                  }`}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => openAddModal(false)}
              className="min-h-[44px] px-3.5 sm:px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#042F2E] font-bold text-sm inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span className="sm:hidden">Thêm</span>
              <span className="hidden sm:inline">{t.addReminderCta}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-12">
        {activeTab === 'home' && (
          <HomeView
            reminders={reminders}
            settings={settings}
            t={t}
            onMarkDone={handleMarkDone}
            onUndoDone={handleUndoDone}
            onSnooze10={handleSnooze10}
            onDelete={handleDeleteReminder}
            onTestNotification={fireNotificationFor}
            onSimulateNag={handleSimulateNag}
            onOpenAdd={() => openAddModal(false)}
            onOpenVoice={(phrase) => openAddModal(true, phrase ?? '')}
          />
        )}

        {activeTab === 'checklists' && (
          <ChecklistsView
            checklists={checklists}
            t={t}
            onToggleItem={handleToggleChecklistItem}
            onAddItem={handleAddChecklistItem}
            onDeleteItem={handleDeleteChecklistItem}
            onResetGroup={handleResetChecklistGroup}
            onUpdateGroupSchedule={handleUpdateChecklistSchedule}
            onCreateGroup={handleCreateChecklistGroup}
          />
        )}

        {activeTab === 'items' && (
          <ItemLocatorView
            items={itemLocations}
            t={t}
            onAddItem={handleAddItemLocation}
            onDeleteItem={handleDeleteItemLocation}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            t={t}
            onUpdateSettings={setSettings}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onReopenOnboarding={() =>
              setSettings((prev) => ({ ...prev, onboardingCompleted: false }))
            }
          />
        )}

        {activeTab === 'android' && <AndroidExportView t={t} />}
      </main>

      {/* Mobile Thumb-Zone Fixed Bottom Navigation Bar (64px tall -> combined header+nav <= 14% of 844px viewport) */}
      <nav
        aria-label="Thanh điều hướng di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#131C1E]/95 backdrop-blur-md border-t border-[#DCE5E2] dark:border-[#243235] grid grid-cols-5 items-center"
      >
        {navItems.map((nav) => {
          const Icon = nav.icon;
          const isActive = activeTab === nav.id;
          return (
            <button
              key={nav.id}
              type="button"
              onClick={() => setActiveTab(nav.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`h-full flex flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                isActive
                  ? 'text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                  : 'text-[#526762] dark:text-[#8CA39E] font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] leading-tight truncate max-w-full">
                {nav.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 3-Step Add Reminder Modal */}
      <AddReminderModal
        isOpen={addModalOpen}
        initialVoiceMode={addModalVoiceMode}
        initialTranscript={addModalTranscript}
        defaultNagInterval={settings.defaultNagIntervalMinutes}
        defaultMaxNag={settings.defaultMaxNagCount}
        onClose={() => setAddModalOpen(false)}
        onSave={handleSaveReminder}
      />
    </div>
  );
}
