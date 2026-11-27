import {
  AlertTriangle,
  BellRing,
  Check,
  CheckCircle2,
  Clock,
  MessageSquare,
  Mic,
  PhoneCall,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { AppSettings, Reminder } from '../domain/types';
import type { Translations } from '../domain/i18n';
import {
  getTriggeredEmergencyReminders,
  selectHeroReminder,
  sortTodayReminders,
} from '../domain/reminderEngine';

interface HomeViewProps {
  reminders: Reminder[];
  settings: AppSettings;
  t: Translations;
  onMarkDone: (id: string) => void;
  onUndoDone: (id: string) => void;
  onSnooze10: (id: string) => void;
  onDelete: (id: string) => void;
  onTestNotification: (reminder: Reminder) => void;
  onSimulateNag: (id: string) => void;
  onOpenAdd: () => void;
  onOpenVoice: (prefillPhrase?: string) => void;
}

export function HomeView({
  reminders,
  settings,
  t,
  onMarkDone,
  onUndoDone,
  onSnooze10,
  onDelete,
  onTestNotification,
  onSimulateNag,
  onOpenAdd,
  onOpenVoice,
}: HomeViewProps) {
  const heroReminder = selectHeroReminder(reminders);
  const sorted = sortTodayReminders(reminders);
  const emergencyList = getTriggeredEmergencyReminders(reminders, settings);

  const doneCount = reminders.filter((r) => r.status === 'done').length;
  const overdueCount = reminders.filter((r) => r.status === 'overdue').length;
  const totalCount = reminders.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const emergencySmsBody = encodeURIComponent(
    emergencyList.length > 0
      ? `Nhờ ${settings.emergencyContact.name} gọi nhắc giúp mình việc quan trọng: ${emergencyList[0].title} (${emergencyList[0].time}).`
      : 'Nhờ kiểm tra giúp lịch nhắc việc hôm nay.'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main column: Next Reminder Hero + Emergency Card + Today's History */}
      <div className="lg:col-span-8 space-y-6">
        {/* Dominant Focal Anchor: Next Upcoming / Overdue Task */}
        {heroReminder ? (
          <section
            aria-label={t.nextUpLabel}
            className={`rounded-3xl p-6 sm:p-8 border transition-colors ${
              heroReminder.status === 'overdue'
                ? 'bg-[#FFFBEB] dark:bg-[#271F0E] border-[#F59E0B] dark:border-[#B45309]'
                : 'bg-white dark:bg-[#161F21] border-[#DCE5E2] dark:border-[#273538]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-semibold">
                <span className="text-[#0F766E] dark:text-[#2DD4BF]">{t.nextUpLabel}</span>
                <span aria-hidden="true" className="text-[#94A3B8]">·</span>
                <span className="font-mono-num text-base font-bold text-[#111918] dark:text-white">
                  {heroReminder.time}
                </span>
                <span aria-hidden="true" className="text-[#94A3B8]">·</span>
                <span className="text-[#526762] dark:text-[#9BB2AD]">
                  {t.repeatLabels[heroReminder.repeatType]}
                </span>
                {heroReminder.status === 'overdue' && (
                  <>
                    <span aria-hidden="true" className="text-[#94A3B8]">·</span>
                    <span className="inline-flex items-center gap-1 text-[#B45309] dark:text-[#FBBF24]">
                      <AlertTriangle className="w-4 h-4" />
                      {t.overdueTag} (nhắc {heroReminder.nagCount}/{heroReminder.maxNagCount ?? settings.defaultMaxNagCount})
                    </span>
                  </>
                )}
                {heroReminder.isImportant && (
                  <>
                    <span aria-hidden="true" className="text-[#94A3B8]">·</span>
                    <span className="text-[#BE123C] dark:text-[#FDA4AF]">{t.importantTag}</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => onTestNotification(heroReminder)}
                className="hidden sm:inline-flex min-h-[44px] px-3.5 rounded-xl border border-[#CAD7D3] dark:border-[#34464A] text-sm font-medium items-center gap-2 hover:bg-[#EFF4F2] dark:hover:bg-[#223033] transition-colors whitespace-nowrap shrink-0"
              >
                <BellRing className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                <span>{t.testNotificationBtn}</span>
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3.5 leading-tight">
              {heroReminder.title}
            </h1>

            {heroReminder.note && (
              <p className="text-base text-[#475B57] dark:text-[#A9BEB9] mt-2 leading-relaxed">
                {heroReminder.note}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={() => onMarkDone(heroReminder.id)}
                className="flex-1 min-h-[56px] px-6 py-3.5 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#042F2E] font-bold text-lg flex items-center justify-center gap-2.5 transition-colors whitespace-nowrap"
              >
                <Check className="w-6 h-6" />
                <span>{t.markDone}</span>
              </button>

              <button
                type="button"
                onClick={() => onSnooze10(heroReminder.id)}
                className="min-h-[56px] px-5 py-3.5 rounded-2xl border-2 border-[#CAD7D3] dark:border-[#34464A] bg-white/70 dark:bg-[#1E2A2D] hover:bg-[#EFF4F2] dark:hover:bg-[#273639] font-semibold text-base flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Clock className="w-5 h-5" />
                <span>{t.snooze10}</span>
              </button>

              <button
                type="button"
                onClick={() => onTestNotification(heroReminder)}
                className="sm:hidden min-h-[48px] px-4 py-2.5 rounded-2xl border border-[#CAD7D3] dark:border-[#34464A] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#EFF4F2] dark:hover:bg-[#223033] transition-colors whitespace-nowrap"
              >
                <BellRing className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                <span>{t.testNotificationBtn}</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl p-8 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.allDoneTitle}</h1>
            <p className="text-base text-[#526762] dark:text-[#9BB2AD] max-w-md mx-auto">
              {t.allDoneSubtitle}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenAdd}
                className="min-h-[52px] px-6 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:text-[#042F2E] text-white font-bold inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>{t.addReminderCta}</span>
              </button>
            </div>
          </section>
        )}

        {/* Emergency Family Contact Card when critical reminders missed >= threshold */}
        {emergencyList.length > 0 && (
          <section
            role="alert"
            className="rounded-3xl p-6 bg-[#FFF1F2] dark:bg-[#33131C] border border-[#FDA4AF] dark:border-[#9F1239] space-y-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[#BE123C] dark:text-[#FDA4AF] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-[#881337] dark:text-[#FFE4E6]">
                  {t.emergencyTitle} ({settings.emergencyContact.name} · {settings.emergencyContact.relation})
                </h2>
                <p className="text-sm text-[#9F1239] dark:text-[#FECDD3] mt-1">
                  {t.emergencyDesc} Việc bị bỏ lỡ: <strong>{emergencyList[0].title}</strong> ({emergencyList[0].nagCount} lần).
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={`tel:${settings.emergencyContact.phone}`}
                className="min-h-[48px] px-5 rounded-2xl bg-[#BE123C] hover:bg-[#9F1239] text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <PhoneCall className="w-4 h-4" />
                <span>
                  {t.callRelative} ({settings.emergencyContact.phone})
                </span>
              </a>
              <a
                href={`sms:${settings.emergencyContact.phone}?body=${emergencySmsBody}`}
                className="min-h-[48px] px-5 rounded-2xl border border-[#BE123C] dark:border-[#FDA4AF] text-[#9F1239] dark:text-[#FFE4E6] font-semibold text-sm inline-flex items-center gap-2 hover:bg-[#FFE4E6] dark:hover:bg-[#4C1726] transition-colors whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t.smsRelative}</span>
              </a>
            </div>
          </section>
        )}

        {/* Today's History List */}
        <section className="rounded-3xl bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5EDEA] dark:border-[#243235] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold">{t.todayHistoryTitle}</h2>
              <p className="text-sm text-[#526762] dark:text-[#9BB2AD] mt-0.5">
                <span className="font-mono-num font-semibold">{doneCount}/{totalCount}</span> {t.completedSummary}
                {overdueCount > 0 && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span className="text-[#B45309] dark:text-[#FBBF24] font-semibold">
                      {overdueCount} việc đang trễ
                    </span>
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAdd}
              className="min-h-[44px] px-4 rounded-xl bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF] font-semibold text-sm flex items-center gap-1.5 hover:bg-[#D4ECE6] dark:hover:bg-[#184742] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addReminderCta}</span>
            </button>
          </div>

          {sorted.length === 0 ? (
            <div className="p-8 text-center text-[#526762] dark:text-[#9BB2AD]">
              Chưa có nhắc việc nào hôm nay. Hãy bấm nút “Thêm nhắc việc” hoặc nói bằng giọng nói.
            </div>
          ) : (
            <ul className="divide-y divide-[#E7EFECE6] dark:divide-[#243235]" data-testid="today-reminders-list">
              {sorted.map((item) => {
                const isDone = item.status === 'done';
                const isOverdue = item.status === 'overdue';
                const isSkipped = item.status === 'skipped';

                return (
                  <li
                    key={item.id}
                    className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      isOverdue
                        ? 'bg-[#FFFBEB]/70 dark:bg-[#271F0E]/60'
                        : isDone
                        ? 'bg-[#F8FBFA] dark:bg-[#131B1D]/70'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Status action button */}
                      {isDone ? (
                        <button
                          type="button"
                          onClick={() => onUndoDone(item.id)}
                          aria-label={`Hoàn tác việc '${item.title}'`}
                          className="min-h-[44px] min-w-[44px] rounded-2xl bg-[#15803D] text-white flex items-center justify-center shrink-0 hover:bg-[#166534] transition-colors"
                        >
                          <Check className="w-6 h-6" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onMarkDone(item.id)}
                          aria-label={`Đánh dấu đã xong '${item.title}'`}
                          className={`min-h-[44px] min-w-[44px] rounded-2xl border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isOverdue
                              ? 'border-[#B45309] text-[#B45309] dark:border-[#FBBF24] dark:text-[#FBBF24] hover:bg-[#FEF3C7] dark:hover:bg-[#3A2B10]'
                              : 'border-[#94ACA6] dark:border-[#496164] text-transparent hover:border-[#0F766E] hover:text-[#0F766E]'
                          }`}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-[#526762] dark:text-[#9BB2AD]">
                          <span className="font-mono-num text-sm font-bold text-[#111918] dark:text-white">
                            {item.time}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{t.repeatLabels[item.repeatType]}</span>
                          {item.isImportant && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#BE123C] dark:text-[#FDA4AF] font-semibold">
                                {t.importantTag}
                              </span>
                            </>
                          )}
                          {isOverdue && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#B45309] dark:text-[#FBBF24] font-semibold">
                                {t.overdueTag} · đã nhắc {item.nagCount}/{item.maxNagCount ?? settings.defaultMaxNagCount}
                              </span>
                            </>
                          )}
                          {isDone && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#15803D] dark:text-[#4ADE80] font-semibold">
                                {t.doneTag}
                              </span>
                            </>
                          )}
                          {isSkipped && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{t.skippedTag}</span>
                            </>
                          )}
                        </div>

                        <h3
                          className={`text-lg font-bold mt-0.5 leading-snug ${
                            isDone ? 'line-through text-[#6B807B] dark:text-[#78918C]' : ''
                          }`}
                        >
                          {item.title}
                        </h3>
                        {item.note && (
                          <p className="text-sm text-[#526762] dark:text-[#9BB2AD] mt-0.5">
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => onTestNotification(item)}
                          aria-label={`Thử thông báo cho '${item.title}'`}
                          className="min-h-[44px] px-3 rounded-xl border border-[#DCE5E2] dark:border-[#2A393C] text-xs font-semibold hover:bg-[#EFF4F2] dark:hover:bg-[#223033] transition-colors whitespace-nowrap"
                        >
                          Thử báo
                        </button>
                      )}
                      {isDone && (
                        <button
                          type="button"
                          onClick={() => onUndoDone(item.id)}
                          aria-label={`Khôi phục việc '${item.title}'`}
                          className="min-h-[44px] px-3 rounded-xl border border-[#DCE5E2] dark:border-[#2A393C] text-xs font-medium inline-flex items-center gap-1 hover:bg-[#EFF4F2] dark:hover:bg-[#223033] transition-colors whitespace-nowrap"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Mở lại</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        aria-label={`Xóa nhắc việc '${item.title}'`}
                        className="min-h-[44px] min-w-[44px] rounded-xl text-[#64748B] hover:text-[#BE123C] hover:bg-[#FFF1F2] dark:hover:bg-[#33131C] flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Right Companion Column: Big Voice Mic Trigger + Persistent Nagging Simulator & Progress */}
      <aside className="lg:col-span-4 space-y-6">
        {/* Big Voice Input Card */}
        <section className="rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] space-y-4">
          <div>
            <h2 className="text-lg font-bold">Ghi nhanh bằng giọng nói</h2>
            <p className="text-sm text-[#526762] dark:text-[#9BB2AD] mt-1">
              Bấm nút micro lớn và nói tự nhiên bằng tiếng Việt, ứng dụng tự tách nội dung và giờ nhắc.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenVoice()}
            className="w-full min-h-[76px] rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#042F2E] font-bold text-lg flex items-center justify-center gap-3 shadow-sm transition-colors"
          >
            <Mic className="w-7 h-7" />
            <span>{t.voiceQuickButton}</span>
          </button>

          <div className="space-y-2 pt-1">
            <div className="text-xs font-semibold text-[#526762] dark:text-[#9BB2AD]">
              Chạm để nói mẫu ngay:
            </div>
            {[
              'Nhắc tôi tắt bếp lúc 7 giờ tối',
              'Uống thuốc sau 15 phút',
            ].map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => onOpenVoice(phrase)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#DCE5E2] dark:border-[#2A393C] text-left text-sm font-medium hover:bg-[#F0F7F5] dark:hover:bg-[#1E2C2F] transition-colors"
              >
                “{phrase}”
              </button>
            ))}
          </div>
        </section>

        {/* Progress & Persistent Nagging Control */}
        <section className="rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Tiến độ hôm nay</h2>
              <p className="text-sm text-[#526762] dark:text-[#9BB2AD]">
                Hoàn thành {doneCount} trên {totalCount} việc
              </p>
            </div>
            <div className="font-mono-num text-3xl font-extrabold text-[#0F766E] dark:text-[#2DD4BF]">
              {progressPct}%
            </div>
          </div>

          <div className="h-3 w-full rounded-full bg-[#E5EDEA] dark:bg-[#243235] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0F766E] dark:bg-[#2DD4BF] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="pt-2 border-t border-[#E5EDEA] dark:border-[#243235] space-y-3">
            <div className="text-sm text-[#475B57] dark:text-[#A9BEB9]">
              Chế độ kiên trì đang đặt nhắc lại mỗi{' '}
              <strong className="font-mono-num">{settings.defaultNagIntervalMinutes} phút</strong> (tối đa{' '}
              <strong className="font-mono-num">{settings.defaultMaxNagCount} lần</strong>).
              {settings.quietHours.enabled && (
                <span>
                  {' '}
                  Giờ yên tĩnh:{' '}
                  <strong className="font-mono-num">
                    {settings.quietHours.startTime}–{settings.quietHours.endTime}
                  </strong>
                  .
                </span>
              )}
            </div>

            {heroReminder && (
              <button
                type="button"
                onClick={() => onSimulateNag(heroReminder.id)}
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#CAD7D3] dark:border-[#34464A] font-semibold text-sm hover:bg-[#EFF4F2] dark:hover:bg-[#223033] transition-colors flex items-center justify-center gap-2"
              >
                <BellRing className="w-4 h-4 text-[#B45309] dark:text-[#FBBF24]" />
                <span>{t.nagAgainBtn} (+1 lần nhắc)</span>
              </button>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
