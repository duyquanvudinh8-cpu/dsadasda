import { useState } from 'react';
import {
  AlarmClock,
  BatteryCharging,
  Bell,
  Check,
  ChevronRight,
  ShieldCheck,
  Type,
} from 'lucide-react';
import type { AppSettings, FontScaleOption } from '../domain/types';

interface OnboardingFlowProps {
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  onFinish: () => void;
}

export function OnboardingFlow({
  settings,
  onUpdateSettings,
  onFinish,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleRequestBrowserNotif = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        await window.Notification.requestPermission();
      } catch {
        // Ignore permission dialog denial
      }
    }
    onUpdateSettings((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, notificationsGranted: true },
    }));
  };

  const togglePermission = (key: keyof AppSettings['permissions']) => {
    onUpdateSettings((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const setFontScale = (scale: FontScaleOption) => {
    onUpdateSettings((prev) => ({ ...prev, fontScale: scale }));
  };

  return (
    <div className="min-h-screen bg-[#F6F8F7] dark:bg-[#0D1314] text-[#111918] dark:text-[#EDF3F1] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] rounded-3xl p-6 sm:p-10 shadow-sm">
        {/* Step indicator & skip */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm font-medium text-[#475B57] dark:text-[#9BB2AD]">
            <span className="font-mono-num font-semibold text-[#0F766E] dark:text-[#2DD4BF]">
              Bước {step}/3
            </span>
            <span aria-hidden="true">·</span>
            <span>Thiết lập Nhớ Giúp</span>
          </div>
          <button
            type="button"
            onClick={onFinish}
            className="min-h-[44px] px-3 text-sm font-medium text-[#475B57] dark:text-[#9BB2AD] hover:text-[#111918] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Bỏ qua
          </button>
        </div>

        {/* Progress track */}
        <div className="grid grid-cols-3 gap-2 mb-8" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-2 rounded-full transition-colors ${
                n <= step
                  ? 'bg-[#0F766E] dark:bg-[#2DD4BF]'
                  : 'bg-[#E2EBE8] dark:bg-[#273538]'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Chào mừng bạn đến với Nhớ Giúp
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-[#475B57] dark:text-[#A9BEB9]">
                Ứng dụng nhắc việc kiên trì dành riêng cho người hay quên. Hoạt động hoàn toàn ngoại tuyến, không cần đăng nhập hay tạo tài khoản.
              </p>
            </div>

            <div className="divide-y divide-[#E7EFECE6] dark:divide-[#263437] border-t border-b border-[#E7EFECE6] dark:border-[#263437]">
              <div className="py-4 flex items-start gap-4">
                <Bell className="w-6 h-6 text-[#0F766E] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-base">Nhắc lại kiên trì đến khi làm xong</h2>
                  <p className="text-sm text-[#526762] dark:text-[#9BB2AD]">
                    Nếu bạn bận chưa làm, máy tự nhắc lại sau mỗi 10 phút ngay trên thanh thông báo.
                  </p>
                </div>
              </div>
              <div className="py-4 flex items-start gap-4">
                <AlarmClock className="w-6 h-6 text-[#0F766E] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-base">Nói tiếng Việt để tạo nhắc việc</h2>
                  <p className="text-sm text-[#526762] dark:text-[#9BB2AD]">
                    Chỉ cần nói “Nhắc tôi tắt bếp lúc 7 giờ tối”, ứng dụng tự điền giờ và lưu ngay.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full min-h-[54px] px-6 py-3.5 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#042F2E] font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              <span>Tiếp tục thiết lập quyền</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Cấp quyền để không lỡ việc quan trọng
              </h1>
              <p className="text-base text-[#475B57] dark:text-[#A9BEB9]">
                Trên điện thoại Android, ứng dụng cần 3 quyền đơn giản dưới đây để chuông nhắc luôn reo đúng giờ ngay cả khi bạn khóa màn hình.
              </p>
            </div>

            <div className="space-y-3">
              {/* Permission 1: Notifications */}
              <div className="p-4 rounded-2xl border border-[#DCE5E2] dark:border-[#273538] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Bell className="w-6 h-6 text-[#0F766E] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-semibold text-base">1. Quyền Thông báo (Android 13+)</h2>
                    <p className="text-sm text-[#526762] dark:text-[#9BB2AD]">
                      Để hiện bảng nhắc việc có nút “Đã xong” và “Nhắc lại sau 10 phút”.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRequestBrowserNotif}
                  className={`min-h-[44px] px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 transition-colors ${
                    settings.permissions.notificationsGranted
                      ? 'bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF]'
                      : 'bg-[#0F766E] text-white'
                  }`}
                >
                  {settings.permissions.notificationsGranted && <Check className="w-4 h-4" />}
                  <span>{settings.permissions.notificationsGranted ? 'Đã bật' : 'Cho phép'}</span>
                </button>
              </div>

              {/* Permission 2: Exact Alarm */}
              <div className="p-4 rounded-2xl border border-[#DCE5E2] dark:border-[#273538] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlarmClock className="w-6 h-6 text-[#0F766E] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-semibold text-base">2. Báo thức chính xác từng phút</h2>
                    <p className="text-sm text-[#526762] dark:text-[#9BB2AD]">
                      Giúp nhắc uống thuốc hoặc tắt bếp đúng từng phút, không bị trễ giờ.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => togglePermission('exactAlarmGranted')}
                  className={`min-h-[44px] px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 transition-colors ${
                    settings.permissions.exactAlarmGranted
                      ? 'bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF]'
                      : 'bg-[#0F766E] text-white'
                  }`}
                >
                  {settings.permissions.exactAlarmGranted && <Check className="w-4 h-4" />}
                  <span>{settings.permissions.exactAlarmGranted ? 'Đã bật' : 'Cho phép'}</span>
                </button>
              </div>

              {/* Permission 3: Battery optimization */}
              <div className="p-4 rounded-2xl border border-[#DCE5E2] dark:border-[#273538] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <BatteryCharging className="w-6 h-6 text-[#B45309] dark:text-[#FBBF24] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-semibold text-base">3. Tắt tối ưu pin cho Nhớ Giúp</h2>
                    <p className="text-sm text-[#526762] dark:text-[#9BB2AD]">
                      Tránh việc điện thoại tự tắt ứng dụng chạy ngầm ban đêm làm mất báo thức.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => togglePermission('batteryOptimizationIgnored')}
                  className={`min-h-[44px] px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 transition-colors ${
                    settings.permissions.batteryOptimizationIgnored
                      ? 'bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF]'
                      : 'bg-[#111918] dark:bg-white text-white dark:text-[#111918]'
                  }`}
                >
                  {settings.permissions.batteryOptimizationIgnored && <Check className="w-4 h-4" />}
                  <span>
                    {settings.permissions.batteryOptimizationIgnored ? 'Đã xác nhận' : 'Đã hiểu & Bật'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[52px] px-5 rounded-2xl border border-[#DCE5E2] dark:border-[#273538] font-medium hover:bg-[#F1F5F4] dark:hover:bg-[#1E2A2D] transition-colors"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 min-h-[52px] px-6 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#042F2E] font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
              >
                <span>Chọn cỡ chữ dễ đọc</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center">
              <Type className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Chọn cỡ chữ thoải mái nhất cho mắt bạn
              </h1>
              <p className="text-base text-[#475B57] dark:text-[#A9BEB9]">
                Bạn luôn có thể đổi lại cỡ chữ hoặc chế độ sáng/tối bất cứ lúc nào trong phần Cài đặt.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { id: 'normal', label: 'Vừa', sample: 'Uống thuốc 08:00' },
                  { id: 'large', label: 'Lớn (Khuyên dùng)', sample: 'Uống thuốc 08:00' },
                  { id: 'xlarge', label: 'Rất lớn', sample: 'Uống thuốc 08:00' },
                ] as { id: FontScaleOption; label: string; sample: string }[]
              ).map((option) => {
                const selected = settings.fontScale === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFontScale(option.id)}
                    className={`p-4 rounded-2xl text-left border-2 transition-colors min-h-[96px] flex flex-col justify-between ${
                      selected
                        ? 'border-[#0F766E] dark:border-[#2DD4BF] bg-[#E6F4F1]/60 dark:bg-[#133834]/60'
                        : 'border-[#DCE5E2] dark:border-[#273538] hover:border-[#9EB5AF]'
                    }`}
                  >
                    <span className="text-sm font-semibold text-[#0F766E] dark:text-[#2DD4BF]">
                      {option.label}
                    </span>
                    <span
                      className={`font-semibold ${
                        option.id === 'normal'
                          ? 'text-base'
                          : option.id === 'large'
                          ? 'text-lg'
                          : 'text-xl'
                      }`}
                    >
                      {option.sample}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[54px] px-5 rounded-2xl border border-[#DCE5E2] dark:border-[#273538] font-medium hover:bg-[#F1F5F4] dark:hover:bg-[#1E2A2D] transition-colors"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={onFinish}
                className="flex-1 min-h-[54px] px-6 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#042F2E] font-bold text-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-5 h-5" />
                <span>Bắt đầu sử dụng Nhớ Giúp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
