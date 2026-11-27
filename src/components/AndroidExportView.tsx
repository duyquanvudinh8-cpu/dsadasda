import { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  FileCode2,
  FolderTree,
  Smartphone,
  Terminal,
} from 'lucide-react';
import {
  ALL_ANDROID_SOURCE_FILES,
  generateAndroidProjectZipBlob,
  type AndroidSourceFile,
} from '../androidProject';
import type { Translations } from '../domain/i18n';

interface AndroidExportViewProps {
  t: Translations;
}

const GROUP_LABELS: Record<AndroidSourceFile['packageGroup'], string> = {
  gradle: 'Gradle & Cấu hình',
  manifest: 'AndroidManifest',
  data: 'Package data (Room)',
  domain: 'Package domain (Parser & Logic)',
  alarm: 'Package alarm (AlarmManager)',
  ui: 'Package ui (Compose M3)',
  res: 'Tài nguyên & Đa ngôn ngữ',
  docs: 'Hướng dẫn build APK',
};

const GROUP_ORDER: AndroidSourceFile['packageGroup'][] = [
  'docs',
  'gradle',
  'manifest',
  'data',
  'domain',
  'alarm',
  'ui',
  'res',
];

export function AndroidExportView({ t }: AndroidExportViewProps) {
  const [selectedPath, setSelectedPath] = useState<string>(
    ALL_ANDROID_SOURCE_FILES.find((f) => f.path === 'app/src/main/java/com/nhogiup/app/alarm/AlarmScheduler.kt')
      ?.path ?? ALL_ANDROID_SOURCE_FILES[0].path
  );
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');

  const selectedFile =
    ALL_ANDROID_SOURCE_FILES.find((f) => f.path === selectedPath) ?? ALL_ANDROID_SOURCE_FILES[0];

  const handleDownloadZip = async () => {
    setDownloading(true);
    setDownloadStatus('');
    try {
      const blob = await generateAndroidProjectZipBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nho-giup-android-project.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadStatus(
        'Đã tải nho-giup-android-project.zip (gồm đầy đủ Gradle, Room, AlarmManager, Compose M3 và README_BUILD_APK.md).'
      );
    } catch {
      setDownloadStatus('Không thể nén tệp ZIP trên trình duyệt này. Bạn có thể sao chép từng tệp bên dưới.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyFile = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Primary ZIP Download CTA */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-sm font-semibold text-[#0F766E] dark:text-[#2DD4BF]">
            Kotlin 2.0 · Jetpack Compose Material 3 · Room Offline · minSdk 26 / targetSdk 34
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t.androidTitle}</h1>
          <p className="text-base text-[#526762] dark:text-[#9BB2AD] leading-relaxed">
            {t.androidSubtitle}
          </p>
        </div>

        <div className="shrink-0 space-y-2">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={downloading}
            className="w-full lg:w-auto min-h-[56px] px-7 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#042F2E] font-bold text-base inline-flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            <Download className="w-5 h-5" />
            <span>{downloading ? 'Đang đóng gói...' : t.downloadZipBtn}</span>
          </button>
          <div className="text-xs text-[#526762] dark:text-[#9BB2AD] text-center lg:text-right">
            {ALL_ANDROID_SOURCE_FILES.length} tệp mã nguồn chuẩn Gradle
          </div>
        </div>
      </div>

      {downloadStatus && (
        <p
          role="status"
          className="px-5 py-3.5 rounded-2xl bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#5EEAD4] text-sm font-semibold"
        >
          {downloadStatus}
        </p>
      )}

      {/* 3-Step Cloud APK Build (No Android Studio Needed) & Local Build Guide */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#0F766E] dark:border-[#2DD4BF] space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold">Cách 1 (Khuyên dùng): Tạo APK tự động trên GitHub</h2>
          <p className="text-sm text-[#526762] dark:text-[#9BB2AD] leading-relaxed">
            <strong>Không cần cài Android Studio.</strong> File ZIP đã cài sẵn{' '}
            <code className="font-mono-num text-xs bg-[#EFF4F2] dark:bg-[#223033] px-1.5 py-0.5 rounded">
              .github/workflows/build-apk.yml
            </code>
            . Chỉ cần đẩy mã nguồn lên 1 repo GitHub mới → mở tab <strong>Actions</strong> → chờ ~3 phút rồi tải{' '}
            <strong>NhoGiup-Debug-APK</strong> ở mục <strong>Artifacts</strong>.
          </p>
        </div>

        <div className="rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold">Cách 2: Build trên máy bằng Android Studio</h2>
          <p className="text-sm text-[#526762] dark:text-[#9BB2AD] leading-relaxed">
            Giải nén file ZIP, mở bằng <strong>Android Studio Ladybug</strong> → chọn{' '}
            <strong>Build → Build APK(s)</strong> (bản Debug) hoặc{' '}
            <strong>Generate Signed Bundle / APK</strong> (bản Release có ký keystore{' '}
            <code className="font-mono-num text-xs">.jks</code>).
          </p>
        </div>

        <div className="rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold">Bước cuối: Cài file APK lên điện thoại</h2>
          <p className="text-sm text-[#526762] dark:text-[#9BB2AD] leading-relaxed">
            Tải <code className="font-mono-num text-xs">app-debug.apk</code> về điện thoại Android, mở bằng ứng dụng Tệp, bật{' '}
            <strong>Cho phép từ nguồn này</strong> → <strong>Cài đặt</strong>. Mở app và cấp quyền Thông báo, Báo thức chính xác, Không hạn chế pin.
          </p>
        </div>
      </section>

      {/* Interactive Package Tree + Code Inspector */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Package tree */}
        <div className="lg:col-span-4 rounded-3xl p-5 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] space-y-4">
          <div className="flex items-center gap-2 font-bold text-base">
            <FolderTree className="w-5 h-5 text-[#0F766E] dark:text-[#2DD4BF]" />
            <span>Cấu trúc package Android</span>
          </div>

          <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
            {GROUP_ORDER.map((group) => {
              const files = ALL_ANDROID_SOURCE_FILES.filter((f) => f.packageGroup === group);
              if (files.length === 0) return null;
              return (
                <div key={group} className="space-y-1">
                  <div className="text-xs font-bold text-[#526762] dark:text-[#9BB2AD] px-2">
                    {GROUP_LABELS[group]}
                  </div>
                  {files.map((file) => {
                    const active = file.path === selectedFile.path;
                    const shortName = file.path.split('/').pop() ?? file.path;
                    return (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => setSelectedPath(file.path)}
                        className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-sm flex items-center gap-2 transition-colors ${
                          active
                            ? 'bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                            : 'hover:bg-[#F3F7F6] dark:hover:bg-[#1D292C] text-[#283835] dark:text-[#C5D6D2]'
                        }`}
                      >
                        <FileCode2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">{shortName}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Viewer */}
        <div className="lg:col-span-8 rounded-3xl bg-[#111918] text-[#E6EFED] border border-[#243235] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#243235] flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="font-mono-num text-xs text-[#5EEAD4] truncate">
                {selectedFile.path}
              </div>
              <div className="text-sm text-[#B7C9C5] mt-0.5 leading-snug">
                {selectedFile.summary}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyFile}
              className="min-h-[44px] px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-[#5EEAD4]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép mã'}</span>
            </button>
          </div>
          <pre className="p-5 overflow-x-auto max-h-[540px] text-xs sm:text-sm leading-relaxed font-mono-num">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </section>
    </div>
  );
}
