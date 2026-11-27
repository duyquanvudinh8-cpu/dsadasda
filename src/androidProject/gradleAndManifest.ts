export interface AndroidSourceFile {
  path: string;
  packageGroup: 'gradle' | 'manifest' | 'data' | 'domain' | 'alarm' | 'ui' | 'res' | 'docs';
  language: 'kotlin' | 'xml' | 'gradle' | 'markdown' | 'properties' | 'yaml';
  summary: string;
  content: string;
}

export const GRADLE_AND_MANIFEST_FILES: AndroidSourceFile[] = [
  {
    path: '.github/workflows/build-apk.yml',
    packageGroup: 'docs',
    language: 'yaml',
    summary: 'Tự động build file APK trên máy chủ GitHub miễn phí (không cần cài Android Studio)',
    content: `name: Build NhoGiup Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'

      - name: Set up Gradle 8.9
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.9'

      - name: Build Debug APK
        run: gradle assembleDebug --no-daemon

      - name: Build Unsigned Release APK
        run: gradle assembleRelease --no-daemon

      - name: Upload NhoGiup Debug APK
        uses: actions/upload-artifact@v4
        with:
          name: NhoGiup-Debug-APK
          path: app/build/outputs/apk/debug/*.apk
          if-no-files-found: error

      - name: Upload NhoGiup Release APK
        uses: actions/upload-artifact@v4
        with:
          name: NhoGiup-Release-APK
          path: app/build/outputs/apk/release/*.apk
          if-no-files-found: warn
`,
  },
  {
    path: 'gradle/wrapper/gradle-wrapper.properties',
    packageGroup: 'gradle',
    language: 'properties',
    summary: 'Chỉ định phiên bản Gradle 8.9 tương thích AGP 8.6 và JDK 17',
    content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.9-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`,
  },
  {
    path: 'settings.gradle.kts',
    packageGroup: 'gradle',
    language: 'gradle',
    summary: 'Cấu hình Gradle repositories và module :app',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "NhoGiup"
include(":app")
`,
  },
  {
    path: 'build.gradle.kts',
    packageGroup: 'gradle',
    language: 'gradle',
    summary: 'Khai báo plugin Android, Kotlin, Compose Compiler và KSP cho Room',
    content: `plugins {
    id("com.android.application") version "8.6.1" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
    id("com.google.devtools.ksp") version "2.0.21-1.0.25" apply false
}
`,
  },
  {
    path: 'gradle.properties',
    packageGroup: 'gradle',
    language: 'properties',
    summary: 'Tối ưu bộ nhớ JVM và bật AndroidX',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`,
  },
  {
    path: 'app/build.gradle.kts',
    packageGroup: 'gradle',
    language: 'gradle',
    summary: 'Cấu hình minSdk 26, targetSdk 34, Jetpack Compose Material 3, Room và Coil',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.nhogiup.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.nhogiup.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.09.03")
    implementation(composeBom)

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")
    implementation("androidx.activity:activity-compose:1.9.2")

    // Jetpack Compose + Material 3
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Room Offline Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // Photo preview for "Tôi để đồ ở đâu?"
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    debugImplementation("androidx.compose.ui:ui-tooling")
}
`,
  },
  {
    path: 'app/proguard-rules.pro',
    packageGroup: 'gradle',
    language: 'properties',
    summary: 'Quy tắc giữ class Room & Receiver khi build APK Release',
    content: `-keep class com.nhogiup.app.data.entity.** { *; }
-keep class com.nhogiup.app.alarm.** { *; }
-dontwarn androidx.room.**
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    packageGroup: 'manifest',
    language: 'xml',
    summary: 'Khai báo đầy đủ quyền POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM, BOOT_COMPLETED, RECORD_AUDIO và các Receiver',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Quyền thông báo trên Android 13+ -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <!-- Quyền đặt báo thức chính xác từng phút -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <!-- Đặt lại toàn bộ lịch nhắc sau khi khởi động lại điện thoại -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <!-- Ghi nhanh bằng giọng nói tiếng Việt -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <!-- Rung và giữ CPU tỉnh ngắn khi phát thông báo -->
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <!-- Mở màn hình xin tắt tối ưu pin -->
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

    <application
        android:name=".NhoGiupApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.NhoGiup">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Receiver phát thông báo nhắc việc kiên trì -->
        <receiver
            android:name=".alarm.AlarmReceiver"
            android:exported="false" />

        <!-- Receiver xử lý nút Đã xong / Nhắc lại 10p / Bỏ qua ngay trên thông báo -->
        <receiver
            android:name=".alarm.NotificationActionReceiver"
            android:exported="false" />

        <!-- Receiver đặt lại toàn bộ báo thức sau khi khởi động lại máy -->
        <receiver
            android:name=".alarm.BootCompletedReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.LOCKED_BOOT_COMPLETED" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
            </intent-filter>
        </receiver>

        <!-- FileProvider chụp ảnh cho tính năng Tôi để đồ ở đâu -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
`,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_background.xml',
    packageGroup: 'res',
    language: 'xml',
    summary: 'Nền biểu tượng ứng dụng Nhớ Giúp (xanh ngọc đậm)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0F766E"
        android:pathData="M0,0h108v108h-108z" />
</vector>
`,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
    packageGroup: 'res',
    language: 'xml',
    summary: 'Biểu tượng chuông nhắc & dấu tick trắng nổi bật',
    content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M54,28c-11.05,0 -20,8.95 -20,20v12l-5,6v3h50v-3l-5,-6V48C74,36.95 65.05,28 54,28zM54,79c3.86,0 7,-3.14 7,-7H47C47,75.86 50.14,79 54,79z" />
    <path
        android:fillColor="#5EEAD4"
        android:pathData="M45,51.5l6,6 13,-13 -3.2,-3.2 -9.8,9.8 -2.8,-2.8z" />
</vector>
`,
  },
  {
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    packageGroup: 'res',
    language: 'xml',
    summary: 'Adaptive Icon cho Android 8.0+ (minSdk 26)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`,
  },
  {
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    packageGroup: 'res',
    language: 'xml',
    summary: 'Adaptive Icon tròn cho màn hình chính Android',
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`,
  },
  {
    path: 'app/src/main/res/xml/file_paths.xml',
    packageGroup: 'res',
    language: 'xml',
    summary: 'Cấu hình đường dẫn lưu ảnh chụp đồ vật ngoại tuyến',
    content: `<?xml version="1.0" encoding="utf-8"?>
<paths>
    <files-path name="item_photos" path="photos/" />
    <cache-path name="backup_files" path="backups/" />
</paths>
`,
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    packageGroup: 'res',
    language: 'xml',
    summary: 'Theme nền khởi động không dùng ActionBar mặc định (Compose Material 3)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.NhoGiup" parent="android:Theme.Material.Light.NoActionBar" />
</resources>
`,
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    packageGroup: 'res',
    language: 'xml',
    summary: 'Tài nguyên ngôn ngữ Tiếng Việt mặc định',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Nhớ Giúp</string>
    <string name="tab_today">Hôm nay</string>
    <string name="tab_checklist">Ra khỏi nhà</string>
    <string name="tab_items">Tìm đồ</string>
    <string name="tab_settings">Cài đặt</string>
    <string name="action_done">Đã xong</string>
    <string name="action_snooze_10">Nhắc lại sau 10 phút</string>
    <string name="action_skip_today">Bỏ qua hôm nay</string>
    <string name="next_reminder_label">Việc tiếp theo</string>
    <string name="add_reminder">Thêm nhắc việc</string>
    <string name="speak_reminder">Nói để nhắc việc</string>
    <string name="channel_normal_name">Nhắc việc hằng ngày</string>
    <string name="channel_critical_name">Nhắc việc quan trọng (vượt giờ yên tĩnh)</string>
</resources>
`,
  },
  {
    path: 'app/src/main/res/values-en/strings.xml',
    packageGroup: 'res',
    language: 'xml',
    summary: 'Tài nguyên đa ngôn ngữ Tiếng Anh (values-en)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Nho Giup</string>
    <string name="tab_today">Today</string>
    <string name="tab_checklist">Checklist</string>
    <string name="tab_items">Find Items</string>
    <string name="tab_settings">Settings</string>
    <string name="action_done">Done</string>
    <string name="action_snooze_10">Remind in 10m</string>
    <string name="action_skip_today">Skip today</string>
    <string name="next_reminder_label">Up Next</string>
    <string name="add_reminder">Add Reminder</string>
    <string name="speak_reminder">Voice Reminder</string>
    <string name="channel_normal_name">Daily Reminders</string>
    <string name="channel_critical_name">Critical Reminders</string>
</resources>
`,
  },
  {
    path: 'README_BUILD_APK.md',
    packageGroup: 'docs',
    language: 'markdown',
    summary: 'Hướng dẫn 2 cách tạo file APK: tự động trên GitHub Actions (không cần cài máy) hoặc bằng Android Studio',
    content: `# Nhớ Giúp — Hướng dẫn Tạo File APK & Cài Lên Điện Thoại

## CÁCH 1 (Nhanh nhất — KHÔNG cần cài Android Studio): Build APK tự động trên GitHub Actions (Miễn phí)
Dự án đã có sẵn tệp \`.github/workflows/build-apk.yml\`.
1. Giải nén file \`nho-giup-android-project.zip\`.
2. Đăng nhập [github.com](https://github.com) → tạo 1 kho lưu trữ mới (ví dụ \`nho-giup-android\`).
3. Tải toàn bộ thư mục bên trong \`nho-giup-android/\` lên kho lưu trữ (bao gồm thư mục ẩn \`.github/workflows/build-apk.yml\`).
4. Mở tab **Actions** trên GitHub → chọn workflow **Build NhoGiup Android APK** → chờ khoảng 2–3 phút để máy chủ tự biên dịch.
5. Nhấn vào mục **Artifacts** bên dưới → tải **NhoGiup-Debug-APK** về máy tính hoặc thẳng về điện thoại Android, giải nén ra \`app-debug.apk\` và cài đặt ngay!

---

## CÁCH 2: Build APK trên máy tính bằng Android Studio
### Yêu cầu
- **Android Studio Ladybug (2024.2)** trở lên (tích hợp sẵn JDK 17).
- **Android SDK 34**.

### Build APK Debug
1. Mở Android Studio → **File → Open** → chọn thư mục \`nho-giup-android\`.
2. Chờ Gradle Sync hoàn tất.
3. Chọn **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. File APK xuất ra tại: \`app/build/outputs/apk/debug/app-debug.apk\`.

### Build APK Release (đã ký phát hành)
1. Chọn **Build → Generate Signed Bundle / APK...** → chọn **APK**.
2. Nhấn **Create new...** để tạo keystore \`.jks\`, chọn bản **release** → **Create**.
3. File APK chính thức nằm tại: \`app/build/outputs/apk/release/app-release.apk\`.

---

## Cài file APK trực tiếp lên điện thoại Android
1. Chép file \`.apk\` sang điện thoại (hoặc tải trực tiếp từ GitHub Actions trên trình duyệt điện thoại).
2. Mở ứng dụng **Tệp (Files)** → chạm vào file \`.apk\`.
3. Nếu điện thoại hỏi, bật **Cho phép cài đặt ứng dụng từ nguồn này** → nhấn **Cài đặt**.
4. Lần đầu mở **Nhớ Giúp**, làm theo 3 bước trên màn hình để cấp quyền **Thông báo**, **Báo thức chính xác**, và chọn **Không hạn chế pin**.
`,
  },
];
