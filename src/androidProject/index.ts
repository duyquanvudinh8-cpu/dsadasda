import JSZip from 'jszip';
import { GRADLE_AND_MANIFEST_FILES, type AndroidSourceFile } from './gradleAndManifest';
import { DATA_AND_DOMAIN_KT_FILES } from './dataAndDomainKt';
import { ALARM_KT_FILES } from './alarmKt';
import { UI_KT_FILES } from './uiKt';
import { UI_SCREENS_KT_FILES } from './uiScreensKt';

export type { AndroidSourceFile };

export const ALL_ANDROID_SOURCE_FILES: AndroidSourceFile[] = [
  ...GRADLE_AND_MANIFEST_FILES,
  ...DATA_AND_DOMAIN_KT_FILES,
  ...ALARM_KT_FILES,
  ...UI_KT_FILES,
  ...UI_SCREENS_KT_FILES,
];

export async function generateAndroidProjectZipBlob(): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder('nho-giup-android');
  if (!root) {
    throw new Error('Could not initialize ZIP folder');
  }
  ALL_ANDROID_SOURCE_FILES.forEach((file) => {
    root.file(file.path, file.content);
  });
  return zip.generateAsync({ type: 'blob' });
}
