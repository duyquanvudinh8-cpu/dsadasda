import type { AndroidSourceFile } from './gradleAndManifest';

export const UI_KT_FILES: AndroidSourceFile[] = [
  {
    path: 'app/src/main/java/com/nhogiup/app/NhoGiupApplication.kt',
    packageGroup: 'ui',
    language: 'kotlin',
    summary: 'Khởi tạo Room Database và Notification Channels khi ứng dụng mở',
    content: `package com.nhogiup.app

import android.app.Application
import com.nhogiup.app.alarm.NotificationHelper
import com.nhogiup.app.data.database.NhoGiupDatabase

class NhoGiupApplication : Application() {
    val database: NhoGiupDatabase by lazy { NhoGiupDatabase.getInstance(this) }

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.ensureChannels(this)
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/ui/theme/Theme.kt',
    packageGroup: 'ui',
    language: 'kotlin',
    summary: 'Material 3 Light/Dark tương phản cao kèm nhân cỡ chữ động cho người lớn tuổi / hay quên',
    content: `package com.nhogiup.app.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density

private val LightColors = lightColorScheme(
    primary = Color(0xFF0F766E),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFCCFBF1),
    onPrimaryContainer = Color(0xFF042F2E),
    secondary = Color(0xFFB45309),
    onSecondary = Color.White,
    error = Color(0xFFBE123C),
    background = Color(0xFFF6F8F7),
    surface = Color.White,
    onBackground = Color(0xFF111918),
    onSurface = Color(0xFF111918)
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF2DD4BF),
    onPrimary = Color(0xFF042F2E),
    primaryContainer = Color(0xFF115E59),
    onPrimaryContainer = Color(0xFFCCFBF1),
    secondary = Color(0xFFF59E0B),
    onSecondary = Color(0xFF1F1600),
    error = Color(0xFFFB7185),
    background = Color(0xFF0D1314),
    surface = Color(0xFF161F21),
    onBackground = Color(0xFFEDF3F1),
    onSurface = Color(0xFFEDF3F1)
)

@Composable
fun NhoGiupTheme(
    darkTheme: Boolean,
    fontScaleMultiplier: Float = 1.15f,
    content: @Composable () -> Unit
) {
    val currentDensity = LocalDensity.current
    val scaledDensity = Density(
        density = currentDensity.density,
        fontScale = currentDensity.fontScale * fontScaleMultiplier
    )

    CompositionLocalProvider(LocalDensity provides scaledDensity) {
        MaterialTheme(
            colorScheme = if (darkTheme) DarkColors else LightColors,
            content = content
        )
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/ui/screens/PermissionsHelper.kt',
    packageGroup: 'ui',
    language: 'kotlin',
    summary: 'Tiện ích mở màn hình cấp quyền SCHEDULE_EXACT_ALARM và tắt tối ưu pin (Battery Optimization)',
    content: `package com.nhogiup.app.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings

object PermissionsHelper {

    fun openExactAlarmSettings(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                data = Uri.parse("package:\${context.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
    }

    fun isIgnoringBatteryOptimizations(context: Context): Boolean {
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        return pm.isIgnoringBatteryOptimizations(context.packageName)
    }

    fun openBatteryOptimizationSettings(context: Context) {
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:\${context.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching { context.startActivity(intent) }.onFailure {
            val fallback = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(fallback)
        }
    }

    fun openCallRelative(context: Context, phone: String) {
        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun openSmsRelative(context: Context, phone: String, message: String) {
        val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:$phone")).apply {
            putExtra("sms_body", message)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/ui/screens/HomeScreen.kt',
    packageGroup: 'ui',
    language: 'kotlin',
    summary: 'Màn hình chính: Việc tiếp theo cực lớn, nút Micro giọng nói tiếng Việt, nút + lớn và lịch sử hôm nay',
    content: `package com.nhogiup.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nhogiup.app.data.entity.ReminderEntity
import com.nhogiup.app.domain.model.ReminderStatus

@Composable
fun HomeScreen(
    reminders: List<ReminderEntity>,
    onMarkDone: (ReminderEntity) -> Unit,
    onSnooze10: (ReminderEntity) -> Unit,
    onStartVoiceInput: () -> Unit,
    onOpenAddDialog: () -> Unit,
    emergencyName: String,
    emergencyPhone: String,
    emergencyThreshold: Int,
    onCallRelative: () -> Unit,
    onSmsRelative: () -> Unit
) {
    val nextTask = reminders.firstOrNull {
        it.status == ReminderStatus.OVERDUE || it.status == ReminderStatus.PENDING
    }
    val emergencyTasks = reminders.filter {
        it.isImportant && it.status == ReminderStatus.OVERDUE && it.nagCount >= emergencyThreshold
    }

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onOpenAddDialog,
                icon = { Icon(Icons.Default.Add, contentDescription = "Thêm nhắc việc") },
                text = { Text("Thêm việc", fontWeight = FontWeight.Bold) }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
        ) {
            // Thẻ việc tiếp theo thật lớn ở trên cùng
            if (nextTask != null) {
                item {
                    ElevatedCard(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.elevatedCardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    ) {
                        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text(
                                text = "VIỆC TIẾP THEO · %02d:%02d".format(nextTask.hour, nextTask.minute),
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            Text(
                                text = nextTask.title,
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Button(
                                    onClick = { onMarkDone(nextTask) },
                                    modifier = Modifier.weight(1f).heightIn(min = 52.dp)
                                ) {
                                    Icon(Icons.Default.Check, contentDescription = null)
                                    Spacer(Modifier.width(8.dp))
                                    Text("Đã làm xong")
                                }
                                OutlinedButton(
                                    onClick = { onSnooze10(nextTask) },
                                    modifier = Modifier.heightIn(min = 52.dp)
                                ) {
                                    Text("+10 phút")
                                }
                            }
                        }
                    }
                }
            }

            // Nút Micro lớn ghi nhanh bằng giọng nói tiếng Việt
            item {
                FilledTonalButton(
                    onClick = onStartVoiceInput,
                    modifier = Modifier.fillMaxWidth().height(58.dp)
                ) {
                    Icon(Icons.Default.Mic, contentDescription = "Ghi nhanh bằng giọng nói")
                    Spacer(Modifier.width(10.dp))
                    Text("Nói để tạo nhắc việc (Tiếng Việt)", fontWeight = FontWeight.SemiBold)
                }
            }

            // Thẻ người thân hỗ trợ khi bỏ lỡ việc quan trọng quá số lần cài đặt
            if (emergencyTasks.isNotEmpty() && emergencyPhone.isNotBlank()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text(
                                "Cần liên hệ $emergencyName hỗ trợ?",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text("Bạn đã bỏ lỡ: \${emergencyTasks.first().title}")
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Button(onClick = onCallRelative, modifier = Modifier.weight(1f)) {
                                    Text("Gọi ngay")
                                }
                                OutlinedButton(onClick = onSmsRelative, modifier = Modifier.weight(1f)) {
                                    Text("Nhắn tin")
                                }
                            }
                        }
                    }
                }
            }

            // Lịch sử hôm nay
            item {
                Text(
                    "Lịch sử hôm nay",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }

            items(reminders, key = { it.id }) { item ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "%02d:%02d".format(item.hour, item.minute),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Column(Modifier.weight(1f)) {
                            Text(item.title, style = MaterialTheme.typography.titleMedium)
                            val statusText = when (item.status) {
                                ReminderStatus.DONE -> "Đã xong"
                                ReminderStatus.OVERDUE -> "Quá giờ · Đã nhắc \${item.nagCount}/\${item.maxNagCount} lần"
                                ReminderStatus.SKIPPED -> "Bỏ qua hôm nay"
                                ReminderStatus.PENDING -> "Sắp tới"
                            }
                            Text(statusText, style = MaterialTheme.typography.bodySmall)
                        }
                        if (item.status != ReminderStatus.DONE) {
                            IconButton(onClick = { onMarkDone(item) }) {
                                Icon(Icons.Default.CheckCircle, contentDescription = "Đánh dấu đã xong")
                            }
                        }
                    }
                }
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/MainActivity.kt',
    packageGroup: 'ui',
    language: 'kotlin',
    summary: 'Activity chính điều phối Onboarding, 4 màn hình chức năng, SpeechRecognizer (vi-VN), và xuất JSON',
    content: `package com.nhogiup.app

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.speech.RecognizerIntent
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.lifecycleScope
import com.nhogiup.app.alarm.AlarmScheduler
import com.nhogiup.app.data.entity.*
import com.nhogiup.app.data.repository.BackupJsonSerializer
import com.nhogiup.app.domain.model.ReminderStatus
import com.nhogiup.app.domain.parser.VietnameseVoiceParser
import com.nhogiup.app.ui.screens.*
import com.nhogiup.app.ui.theme.NhoGiupTheme
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.io.File

class MainActivity : ComponentActivity() {

    private val requestNotifPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* Cập nhật trạng thái quyền thông báo */ }

    private val voiceLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val spoken = result.data
            ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            ?.firstOrNull() ?: return@registerForActivityResult

        val parsed = VietnameseVoiceParser.parse(spoken)
        lifecycleScope.launch {
            val db = (application as NhoGiupApplication).database
            val triggerMillis = AlarmScheduler.computeNextDailyMillis(
                parsed.hour,
                parsed.minute,
                forceTomorrow = parsed.isTomorrow
            )
            val entity = ReminderEntity(
                title = parsed.title,
                hour = parsed.hour,
                minute = parsed.minute,
                nextTriggerMillis = triggerMillis,
                repeatType = parsed.repeatType,
                isImportant = parsed.isImportant
            )
            val newId = db.reminderDao().upsert(entity)
            AlarmScheduler(this@MainActivity).scheduleExact(entity.copy(id = newId), triggerMillis)
            Toast.makeText(
                this@MainActivity,
                "Đã tạo nhắc việc: \${parsed.title} (%02d:%02d)".format(parsed.hour, parsed.minute),
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val db = (application as NhoGiupApplication).database
        val scheduler = AlarmScheduler(this)

        // Khởi tạo dữ liệu mẫu lần đầu nếu trống
        lifecycleScope.launch {
            if (db.checklistDao().observeChecklists().first().isEmpty()) {
                val workId = db.checklistDao().insertChecklist(ChecklistEntity(name = "Đi làm"))
                listOf("Chìa khóa nhà & xe", "Ví tiền & CCCD", "Điện thoại").forEach {
                    db.checklistDao().insertItem(ChecklistItemEntity(checklistId = workId, label = it))
                }
                val travelId = db.checklistDao().insertChecklist(ChecklistEntity(name = "Đi du lịch", reminderHour = 6, reminderMinute = 0))
                listOf("CCCD / Vé xe", "Sạc dự phòng", "Thuốc uống hằng ngày").forEach {
                    db.checklistDao().insertItem(ChecklistItemEntity(checklistId = travelId, label = it))
                }
            }
        }

        setContent {
            val settings by db.settingsDao().observeSettings()
                .collectAsState(initial = null)
            val reminders by db.reminderDao().observeAll()
                .collectAsState(initial = emptyList())
            val checklists by db.checklistDao().observeChecklists()
                .collectAsState(initial = emptyList())
            val itemLocations by db.itemLocationDao().observeAll()
                .collectAsState(initial = emptyList())

            val activeSettings = settings ?: AppSettingsEntity()
            var selectedTab by remember { mutableIntStateOf(0) }
            var selectedChecklistId by remember { mutableStateOf<Long?>(null) }
            var showAddDialog by remember { mutableStateOf(false) }

            val activeChecklistId = selectedChecklistId ?: checklists.firstOrNull()?.id
            val checklistItems by remember(activeChecklistId) {
                if (activeChecklistId != null) db.checklistDao().observeItems(activeChecklistId)
                else kotlinx.coroutines.flow.flowOf(emptyList())
            }.collectAsState(initial = emptyList())

            NhoGiupTheme(
                darkTheme = activeSettings.darkMode,
                fontScaleMultiplier = activeSettings.fontScale
            ) {
                if (!activeSettings.onboardingDone) {
                    OnboardingScreen(
                        currentFontScale = activeSettings.fontScale,
                        onRequestNotificationPermission = {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                requestNotifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
                            }
                        },
                        onOpenExactAlarmSettings = { PermissionsHelper.openExactAlarmSettings(this) },
                        onOpenBatterySettings = { PermissionsHelper.openBatteryOptimizationSettings(this) },
                        onSelectFontScale = { scale ->
                            lifecycleScope.launch {
                                db.settingsDao().save(activeSettings.copy(fontScale = scale))
                            }
                        },
                        onFinish = {
                            lifecycleScope.launch {
                                db.settingsDao().save(activeSettings.copy(onboardingDone = true))
                            }
                        }
                    )
                } else {
                    Scaffold(
                        bottomBar = {
                            NavigationBar {
                                NavigationBarItem(
                                    selected = selectedTab == 0,
                                    onClick = { selectedTab = 0 },
                                    icon = { Icon(Icons.Default.Home, contentDescription = null) },
                                    label = { Text("Hôm nay") }
                                )
                                NavigationBarItem(
                                    selected = selectedTab == 1,
                                    onClick = { selectedTab = 1 },
                                    icon = { Icon(Icons.Default.Checklist, contentDescription = null) },
                                    label = { Text("Ra khỏi nhà") }
                                )
                                NavigationBarItem(
                                    selected = selectedTab == 2,
                                    onClick = { selectedTab = 2 },
                                    icon = { Icon(Icons.Default.Search, contentDescription = null) },
                                    label = { Text("Tìm đồ") }
                                )
                                NavigationBarItem(
                                    selected = selectedTab == 3,
                                    onClick = { selectedTab = 3 },
                                    icon = { Icon(Icons.Default.Settings, contentDescription = null) },
                                    label = { Text("Cài đặt") }
                                )
                            }
                        }
                    ) { innerPadding ->
                        Surface(Modifier.padding(innerPadding)) {
                            when (selectedTab) {
                                0 -> HomeScreen(
                                    reminders = reminders,
                                    onMarkDone = { rem ->
                                        lifecycleScope.launch {
                                            scheduler.cancel(rem.id)
                                            db.reminderDao().updateStatusAndNag(rem.id, ReminderStatus.DONE, 0)
                                        }
                                    },
                                    onSnooze10 = { rem ->
                                        lifecycleScope.launch {
                                            db.reminderDao().updateStatusAndNag(rem.id, ReminderStatus.PENDING, rem.nagCount)
                                            scheduler.scheduleNextNag(rem, 10)
                                        }
                                    },
                                    onStartVoiceInput = { launchVietnameseSpeech() },
                                    onOpenAddDialog = { showAddDialog = true },
                                    emergencyName = activeSettings.emergencyName,
                                    emergencyPhone = activeSettings.emergencyPhone,
                                    emergencyThreshold = activeSettings.emergencyMissedThreshold,
                                    onCallRelative = {
                                        PermissionsHelper.openCallRelative(this@MainActivity, activeSettings.emergencyPhone)
                                    },
                                    onSmsRelative = {
                                        PermissionsHelper.openSmsRelative(
                                            this@MainActivity,
                                            activeSettings.emergencyPhone,
                                            "Nhờ gọi nhắc mình giúp: có việc quan trọng chưa hoàn thành."
                                        )
                                    }
                                )

                                1 -> ChecklistScreen(
                                    checklists = checklists,
                                    selectedChecklistId = activeChecklistId,
                                    items = checklistItems,
                                    onSelectChecklist = { selectedChecklistId = it },
                                    onToggleItem = { itemId, checked ->
                                        lifecycleScope.launch { db.checklistDao().setItemChecked(itemId, checked) }
                                    },
                                    onAddItem = { groupId, label ->
                                        lifecycleScope.launch {
                                            db.checklistDao().insertItem(ChecklistItemEntity(checklistId = groupId, label = label))
                                        }
                                    },
                                    onResetChecklist = { groupId ->
                                        lifecycleScope.launch { db.checklistDao().resetChecklist(groupId) }
                                    },
                                    onCreateChecklist = { name ->
                                        lifecycleScope.launch {
                                            val newId = db.checklistDao().insertChecklist(ChecklistEntity(name = name))
                                            selectedChecklistId = newId
                                        }
                                    }
                                )

                                2 -> ItemLocationScreen(
                                    items = itemLocations,
                                    onAddLocation = { name, loc ->
                                        lifecycleScope.launch {
                                            db.itemLocationDao().upsert(ItemLocationEntity(itemName = name, locationDesc = loc))
                                        }
                                    },
                                    onDeleteLocation = { entry ->
                                        lifecycleScope.launch { db.itemLocationDao().delete(entry) }
                                    }
                                )

                                else -> SettingsScreen(
                                    settings = activeSettings,
                                    onUpdate = { updated ->
                                        lifecycleScope.launch { db.settingsDao().save(updated) }
                                    },
                                    onOpenBatterySettings = { PermissionsHelper.openBatteryOptimizationSettings(this@MainActivity) },
                                    onExportBackup = {
                                        lifecycleScope.launch {
                                            val json = BackupJsonSerializer.exportToJson(reminders, itemLocations, activeSettings)
                                            val outFile = File(getExternalFilesDir(null), "nho_giup_backup.json")
                                            outFile.writeText(json)
                                            Toast.makeText(
                                                this@MainActivity,
                                                "Đã sao lưu tại: \${outFile.absolutePath}",
                                                Toast.LENGTH_LONG
                                            ).show()
                                        }
                                    }
                                )
                            }
                        }

                        if (showAddDialog) {
                            AddReminderDialog(
                                onDismiss = { showAddDialog = false },
                                onVoiceInput = { launchVietnameseSpeech() },
                                onSave = { title, hour, minute, repeatType, isImportant ->
                                    lifecycleScope.launch {
                                        val triggerMillis = AlarmScheduler.computeNextDailyMillis(hour, minute)
                                        val entity = ReminderEntity(
                                            title = title,
                                            hour = hour,
                                            minute = minute,
                                            nextTriggerMillis = triggerMillis,
                                            repeatType = repeatType,
                                            isImportant = isImportant
                                        )
                                        val newId = db.reminderDao().upsert(entity)
                                        scheduler.scheduleExact(entity.copy(id = newId), triggerMillis)
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    private fun launchVietnameseSpeech() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "vi-VN")
            putExtra(RecognizerIntent.EXTRA_PROMPT, "Nói: Nhắc tôi tắt bếp lúc 7 giờ tối...")
        }
        runCatching { voiceLauncher.launch(intent) }
    }
}
`,
  },
];
