import { BellRing, Check, Clock, SkipForward, X } from 'lucide-react';
import type { Reminder } from '../domain/types';

interface NotificationBannerProps {
  reminder: Reminder;
  nagIntervalMinutes: number;
  maxNagCount: number;
  onDone: (id: string) => void;
  onSnooze10: (id: string) => void;
  onSkipToday: (id: string) => void;
  onDismiss: () => void;
}

/**
 * Interactive Android-style Heads-up Notification Banner showing the 3 direct actions:
 * "Đã xong", "Nhắc lại sau 10 phút", "Bỏ qua hôm nay" without needing to navigate away.
 */
export function NotificationBanner({
  reminder,
  nagIntervalMinutes,
  maxNagCount,
  onDone,
  onSnooze10,
  onSkipToday,
  onDismiss,
}: NotificationBannerProps) {
  const effectiveMax = reminder.maxNagCount ?? maxNagCount;
  const effectiveInterval = reminder.nagIntervalMinutes ?? nagIntervalMinutes;

  return (
    <div
      role="alertdialog"
      aria-label="Thông báo nhắc việc"
      className="fixed top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 md:top-20 z-50 w-[calc(100%-2rem)] max-w-xl bg-[#111918] dark:bg-[#1C282B] text-white rounded-3xl p-5 shadow-[0_24px_60px_rgba(0,0,0,0.4)] border border-[#2C3D3F] ring-1 ring-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center shrink-0">
            <BellRing className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#A3C2BC]">
              <span className="font-semibold text-[#5EEAD4]">Thông báo Nhớ Giúp</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">{reminder.time}</span>
              <span aria-hidden="true">·</span>
              <span>
                Lần nhắc {Math.max(1, reminder.nagCount)}/{effectiveMax}
              </span>
              {reminder.isImportant && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#FDA4AF] font-semibold">Quan trọng</span>
                </>
              )}
            </div>
            <h3 className="text-lg font-bold mt-1 leading-snug text-white">
              {reminder.title}
            </h3>
            <p className="text-sm text-[#C6D6D3] mt-0.5">
              {reminder.note || `Nếu chưa xong, máy sẽ nhắc lại sau mỗi ${effectiveInterval} phút.`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#9BB2AD] hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 3 Android Notification Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
        <button
          type="button"
          onClick={() => onDone(reminder.id)}
          className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>Đã xong</span>
        </button>

        <button
          type="button"
          onClick={() => onSnooze10(reminder.id)}
          className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-white/12 hover:bg-white/20 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Nhắc lại sau 10 phút</span>
        </button>

        <button
          type="button"
          onClick={() => onSkipToday(reminder.id)}
          className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-transparent border border-white/20 hover:bg-white/10 text-[#D4E2DF] font-medium text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          <SkipForward className="w-4 h-4 shrink-0" />
          <span>Bỏ qua hôm nay</span>
        </button>
      </div>
    </div>
  );
}
