import { useRef, useState } from 'react';
import {
  BatteryCharging,
  Bell,
  Download,
  Globe,
  Moon,
  MoonStar,
  PhoneCall,
  RotateCcw,
  Sun,
  Type,
  Upload,
  Volume2,
} from 'lucide-react';
import type {
  AppLanguage,
  AppSettings,
  FontScaleOption,
  NhoGiupBackupPayload,
} from '../domain/types';
import type { Translations } from '../domain/i18n';
import { validateBackupPayload } from '../domain/reminderEngine';
import { playReminderChime, triggerDeviceVibration } from '../utils/storage';

interface SettingsViewProps {
  settings: AppSettings;
  t: Translations;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (payload: NhoGiupBackupPayload) => void;
  onReopenOnboarding: () => void;
}

export function SettingsView({
  settings,
  t,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onReopenOnboarding,
}: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupMessage, setBackupMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const check = validateBackupPayload(parsed);
      if (!check.valid || !check.payload) {
        setBackupMessage({
          type: 'error',
          text: check.error || 'Tệp JSON sao lưu không đúng định dạng Nhớ Giúp.',
        });
      } else {
        onImportBackup(check.payload);
        setBackupMessage({
          type: 'success',
          text: `Đã khôi phục thành công ${check.payload.reminders.length} nhắc việc và ${check.payload.itemLocations.length} vị trí đồ vật.`,
        });
      }
    } catch {
      setBackupMessage({
        type: 'error',
        text: 'Không thể đọc tệp JSON. Vui lòng chọn đúng tệp sao lưu đã xuất từ Nhớ Giúp.',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t.settingsTitle}</h1>
        <p className="text-base text-[#526762] dark:text-[#9BB2AD] mt-1">{t.settingsSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 1. Display, Theme, Font Size, Language */}
        <section className="rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] space-y-6">
          <h2 className="text-lg font-bold">Hiển thị & Ngôn ngữ</h2>

          {/* Light / Dark mode */}
          <div className="space-y-2.5">
            <div className="text-sm font-semibold">Chế độ giao diện</div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                aria-pressed={settings.theme === 'light'}
                onClick={() => onUpdateSettings((prev) => ({ ...prev, theme: 'light' }))}
                className={`min-h-[50px] px-4 rounded-2xl border font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  settings.theme === 'light'
                    ? 'border-[#0F766E] bg-[#E6F4F1] text-[#0F766E]'
                    : 'border-[#DCE5E2] dark:border-[#2A393C] text-[#526762] dark:text-[#9BB2AD]'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Chế độ Sáng</span>
              </button>
              <button
                type="button"
                aria-pressed={settings.theme === 'dark'}
                onClick={() => onUpdateSettings((prev) => ({ ...prev, theme: 'dark' }))}
                className={`min-h-[50px] px-4 rounded-2xl border font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  settings.theme === 'dark'
                    ? 'border-[#2DD4BF] bg-[#133834] text-[#2DD4BF]'
                    : 'border-[#DCE5E2] dark:border-[#2A393C] text-[#526762] dark:text-[#9BB2AD]'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Chế độ Tối</span>
              </button>
            </div>
          </div>

          {/* Font size */}
          <div className="space-y-2.5">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Type className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
              <span>Cỡ chữ toàn ứng dụng</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'normal', label: 'Vừa' },
                  { id: 'large', label: 'Lớn' },
                  { id: 'xlarge', label: 'Rất lớn' },
                ] as { id: FontScaleOption; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={settings.fontScale === opt.id}
                  onClick={() => onUpdateSettings((prev) => ({ ...prev, fontScale: opt.id }))}
                  className={`min-h-[48px] px-3 rounded-xl border font-semibold text-sm transition-colors ${
                    settings.fontScale === opt.id
                      ? 'border-[#0F766E] bg-[#0F766E] text-white dark:border-[#2DD4BF] dark:bg-[#2DD4BF] dark:text-[#042F2E]'
                      : 'border-[#DCE5E2] dark:border-[#2A393C] hover:bg-[#F0F7F5] dark:hover:bg-[#1E2C2F]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2.5">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
              <span>Ngôn ngữ / Language</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { id: 'vi', label: 'Tiếng Việt' },
                  { id: 'en', label: 'English' },
                ] as { id: AppLanguage; label: string }[]
              ).map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  aria-pressed={settings.language === lang.id}
                  onClick={() => onUpdateSettings((prev) => ({ ...prev, language: lang.id }))}
                  className={`min-h-[48px] px-4 rounded-xl border font-semibold text-sm transition-colors ${
                    settings.language === lang.id
                      ? 'border-[#0F766E] bg-[#E6F4F1] text-[#0F766E] dark:border-[#2DD4BF] dark:bg-[#133834] dark:text-[#2DD4BF]'
                      : 'border-[#DCE5E2] dark:border-[#2A393C]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Sound, Vibration & Persistent Nagging */}
        <section className="rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#0F766E] dark:text-[#2DD4BF]" />
              <span>Âm báo & Nhắc kiên trì</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                playReminderChime(true, false);
                triggerDeviceVibration(settings.vibrationEnabled);
              }}
              className="min-h-[44px] px-3.5 rounded-xl border border-[#CAD7D3] dark:border-[#34464A] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EFF4F2] dark:hover:bg-[#223033]"
            >
              <Volume2 className="w-4 h-4" />
              <span>Nghe thử</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={settings.soundEnabled}
              onClick={() =>
                onUpdateSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
              }
              className={`min-h-[52px] px-4 rounded-2xl border font-semibold text-sm flex items-center justify-between transition-colors ${
                settings.soundEnabled
                  ? 'border-[#0F766E] bg-[#E6F4F1]/60 dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF]'
                  : 'border-[#DCE5E2] dark:border-[#2A393C]'
              }`}
            >
              <span>Âm chuông báo</span>
              <span>{settings.soundEnabled ? 'Bật' : 'Tắt'}</span>
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={settings.vibrationEnabled}
              onClick={() =>
                onUpdateSettings((prev) => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }))
              }
              className={`min-h-[52px] px-4 rounded-2xl border font-semibold text-sm flex items-center justify-between transition-colors ${
                settings.vibrationEnabled
                  ? 'border-[#0F766E] bg-[#E6F4F1]/60 dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF]'
                  : 'border-[#DCE5E2] dark:border-[#2A393C]'
              }`}
            >
              <span>Rung khi nhắc</span>
              <span>{settings.vibrationEnabled ? 'Bật' : 'Tắt'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-nag-interval" className="block text-sm font-semibold mb-1.5">
                Nhắc lại sau mỗi
              </label>
              <select
                id="settings-nag-interval"
                value={settings.defaultNagIntervalMinutes}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    defaultNagIntervalMinutes: Number(e.target.value),
                  }))
                }
                className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] font-semibold text-sm"
              >
                <option value={5}>5 phút</option>
                <option value={10}>10 phút (Mặc định)</option>
                <option value={15}>15 phút</option>
                <option value={30}>30 phút</option>
              </select>
            </div>
            <div>
              <label htmlFor="settings-nag-max" className="block text-sm font-semibold mb-1.5">
                Số lần nhắc tối đa
              </label>
              <select
                id="settings-nag-max"
                value={settings.defaultMaxNagCount}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    defaultMaxNagCount: Number(e.target.value),
                  }))
                }
                className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] font-semibold text-sm"
              >
                <option value={3}>3 lần</option>
                <option value={5}>5 lần (Khuyên dùng)</option>
                <option value={8}>8 lần</option>
                <option value={10}>10 lần</option>
              </select>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="pt-4 border-t border-[#E5EDEA] dark:border-[#243235] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MoonStar className="w-5 h-5 text-[#0F766E] dark:text-[#2DD4BF]" />
                <div>
                  <div className="font-semibold text-sm">Giờ yên tĩnh ban đêm</div>
                  <div className="text-xs text-[#526762] dark:text-[#9BB2AD]">
                    Tạm hoãn việc thường ban đêm; việc “Quan trọng” vẫn báo bình thường.
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.quietHours.enabled}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled },
                  }))
                }
                className={`min-h-[44px] px-4 rounded-xl font-semibold text-sm whitespace-nowrap ${
                  settings.quietHours.enabled
                    ? 'bg-[#0F766E] text-white dark:bg-[#2DD4BF] dark:text-[#042F2E]'
                    : 'bg-[#E9F0EE] dark:bg-[#223033] text-[#475B57] dark:text-[#9BB2AD]'
                }`}
              >
                {settings.quietHours.enabled ? 'Đang bật' : 'Tắt'}
              </button>
            </div>

            {settings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="quiet-start" className="block text-xs font-semibold mb-1">
                    Bắt đầu từ
                  </label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={settings.quietHours.startTime}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, startTime: e.target.value },
                      }))
                    }
                    className="w-full min-h-[46px] px-3 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] font-mono-num font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="quiet-end" className="block text-xs font-semibold mb-1">
                    Kết thúc lúc
                  </label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={settings.quietHours.endTime}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, endTime: e.target.value },
                      }))
                    }
                    className="w-full min-h-[46px] px-3 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] font-mono-num font-bold"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. Emergency Family Contact */}
        <section className="rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-[#BE123C] dark:text-[#FDA4AF]" />
              <span>Người thân hỗ trợ</span>
            </h2>
            <button
              type="button"
              role="switch"
              aria-checked={settings.emergencyContact.enabled}
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  emergencyContact: {
                    ...prev.emergencyContact,
                    enabled: !prev.emergencyContact.enabled,
                  },
                }))
              }
              className={`min-h-[44px] px-4 rounded-xl font-semibold text-sm ${
                settings.emergencyContact.enabled
                  ? 'bg-[#0F766E] text-white dark:bg-[#2DD4BF] dark:text-[#042F2E]'
                  : 'bg-[#E9F0EE] dark:bg-[#223033]'
              }`}
            >
              {settings.emergencyContact.enabled ? 'Đang bật' : 'Tắt'}
            </button>
          </div>
          <p className="text-sm text-[#526762] dark:text-[#9BB2AD]">
            Nếu bỏ lỡ việc “Quan trọng” quá số lần dưới đây, màn hình chính sẽ hiện nút gọi / nhắn tin nhanh tới người thân.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="emg-name" className="block text-xs font-semibold mb-1">
                Tên người thân
              </label>
              <input
                id="emg-name"
                type="text"
                value={settings.emergencyContact.name}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, name: e.target.value },
                  }))
                }
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] text-sm"
              />
            </div>
            <div>
              <label htmlFor="emg-relation" className="block text-xs font-semibold mb-1">
                Mối quan hệ
              </label>
              <input
                id="emg-relation"
                type="text"
                value={settings.emergencyContact.relation}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relation: e.target.value },
                  }))
                }
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] text-sm"
              />
            </div>
            <div>
              <label htmlFor="emg-phone" className="block text-xs font-semibold mb-1">
                Số điện thoại
              </label>
              <input
                id="emg-phone"
                type="tel"
                value={settings.emergencyContact.phone}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, phone: e.target.value },
                  }))
                }
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] font-mono-num text-sm"
              />
            </div>
            <div>
              <label htmlFor="emg-threshold" className="block text-xs font-semibold mb-1">
                Gợi ý liên hệ sau khi lỡ
              </label>
              <select
                id="emg-threshold"
                value={settings.emergencyContact.missedThreshold}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    emergencyContact: {
                      ...prev.emergencyContact,
                      missedThreshold: Number(e.target.value),
                    },
                  }))
                }
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] font-semibold text-sm"
              >
                <option value={2}>2 lần nhắc</option>
                <option value={3}>3 lần nhắc</option>
                <option value={4}>4 lần nhắc</option>
                <option value={5}>5 lần nhắc</option>
              </select>
            </div>
          </div>
        </section>

        {/* 4. Offline JSON Backup & Android Battery Optimization Guide */}
        <section className="rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] space-y-5">
          <div>
            <h2 className="text-lg font-bold">Sao lưu JSON & Quyền Android</h2>
            <p className="text-sm text-[#526762] dark:text-[#9BB2AD] mt-1">
              Dữ liệu lưu hoàn toàn trên máy. Bạn có thể xuất tệp JSON để sao lưu khi đổi điện thoại.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                onExportBackup();
                setBackupMessage({
                  type: 'success',
                  text: 'Đã tải xuống tệp sao lưu JSON về thiết bị của bạn.',
                });
              }}
              className="min-h-[50px] px-4 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:text-[#042F2E] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Xuất sao lưu JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[50px] px-4 rounded-2xl border border-[#CAD7D3] dark:border-[#34464A] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#EFF4F2] dark:hover:bg-[#223033] transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Khôi phục từ JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="sr-only"
              aria-label="Chọn tệp sao lưu JSON để khôi phục"
            />
          </div>

          {backupMessage && (
            <p
              role="status"
              className={`text-sm font-medium px-4 py-3 rounded-xl ${
                backupMessage.type === 'success'
                  ? 'bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#5EEAD4]'
                  : 'bg-[#FFF1F2] dark:bg-[#33131C] text-[#BE123C] dark:text-[#FDA4AF]'
              }`}
            >
              {backupMessage.text}
            </p>
          )}

          <div className="pt-4 border-t border-[#E5EDEA] dark:border-[#243235] space-y-3">
            <div className="flex items-start gap-3">
              <BatteryCharging className="w-5 h-5 text-[#B45309] dark:text-[#FBBF24] shrink-0 mt-0.5" />
              <div className="text-sm text-[#475B57] dark:text-[#A9BEB9]">
                <strong>Mẹo tắt tối ưu pin trên Android:</strong> Vào <em>Cài đặt điện thoại → Ứng dụng → Nhớ Giúp → Pin → Không hạn chế</em> để báo thức không bao giờ bị trễ khi khóa màn hình.
              </div>
            </div>

            <button
              type="button"
              onClick={onReopenOnboarding}
              className="min-h-[46px] px-4 rounded-xl border border-[#DCE5E2] dark:border-[#2A393C] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#EFF4F2] dark:hover:bg-[#223033] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Xem lại hướng dẫn 3 bước lần đầu</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
