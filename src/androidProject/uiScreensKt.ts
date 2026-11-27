import type { AndroidSourceFile } from './gradleAndManifest';

export const UI_SCREENS_KT_FILES: AndroidSourceFile[] = [
  {
    path: 'app/src/main/java/com/nhogiup/app/ui/screens/OnboardingScreen.kt',
    packageGroup: 'ui',
    language: 'kotlin',
    summary: 'Màn hình hướng dẫn lần đầu tối đa 3 bước: giới thiệu, xin quyền từng bước và chọn cỡ chữ',
    content: `package com.nhogiup.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun OnboardingScreen(
    currentFontScale: Float,
    onRequestNotificationPermission: () -> Unit,
    onOpenExactAlarmSettings: () -> Unit,
    onOpenBatterySettings: () -> Unit,
    onSelectFontScale: (Float) -> Unit,
    onFinish: () -> Unit
) {
    var step by remember { mutableIntStateOf(1) }

    Surface(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Bước $step / 3",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                    TextButton(onClick = onFinish) { Text("Bỏ qua") }
                }

                when (step) {
                    1 -> {
                        Text(
                            text = "Chào mừng đến với Nhớ Giúp",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Ứng dụng nhắc việc kiên trì dành cho người hay quên. Hoạt động hoàn toàn offline, không cần đăng nhập.",
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }

                    2 -> {
                        Text(
                            text = "Cấp quyền để báo thức luôn đúng giờ",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text("Bấm từng nút dưới đây để máy nhắc việc kể cả khi tắt màn hình:")

                        ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("1. Quyền Thông báo (Android 13+)", fontWeight = FontWeight.Bold)
                                Text("Hiện bảng nhắc có nút Đã xong ngay ngoài màn hình khóa.")
                                Button(onClick = onRequestNotificationPermission) {
                                    Text("Cấp quyền Thông báo")
                                }
                            }
                        }

                        ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("2. Báo thức chính xác từng phút", fontWeight = FontWeight.Bold)
                                Text("Giúp uống thuốc, tắt bếp đúng giờ không bị trễ.")
                                OutlinedButton(onClick = onOpenExactAlarmSettings) {
                                    Text("Mở quyền Báo thức chính xác")
                                }
                            }
                        }

                        ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("3. Tắt tối ưu pin cho Nhớ Giúp", fontWeight = FontWeight.Bold)
                                Text("Tránh việc máy tự tắt app chạy ngầm ban đêm.")
                                OutlinedButton(onClick = onOpenBatterySettings) {
                                    Text("Chọn Không hạn chế pin")
                                }
                            }
                        }
                    }

                    else -> {
                        Text(
                            text = "Chọn cỡ chữ dễ đọc nhất",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        listOf(
                            1.0f to "Vừa",
                            1.18f to "Lớn (Khuyên dùng)",
                            1.35f to "Rất lớn"
                        ).forEach { (scale, label) ->
                            val selected = currentFontScale == scale
                            OutlinedButton(
                                onClick = { onSelectFontScale(scale) },
                                modifier = Modifier.fillMaxWidth().height(56.dp),
                                colors = if (selected) {
                                    ButtonDefaults.buttonColors()
                                } else {
                                    ButtonDefaults.outlinedButtonColors()
                                }
                            ) {
                                Text(label, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            Button(
                onClick = { if (step < 3) step++ else onFinish() },
                modifier = Modifier.fillMaxWidth().height(56.dp)
            ) {
                Text(
                    text = if (step < 3) "Tiếp tục" else "Bắt đầu sử dụng",
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/ui/screens/AddReminderDialog.kt',
    packageGroup: 'ui',
    language: 'kotlin',
    summary: 'Hộp thoại thêm nhắc việc tối đa 3 bước: nhập/nói nội dung, chọn giờ & lặp lại, xác nhận',
    content: `package com.nhogiup.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nhogiup.app.domain.model.RepeatType

@Composable
fun AddReminderDialog(
    onDismiss: () -> Unit,
    onVoiceInput: () -> Unit,
    onSave: (title: String, hour: Int, minute: Int, repeatType: RepeatType, isImportant: Boolean) -> Unit
) {
    var step by remember { mutableIntStateOf(1) }
    var title by remember { mutableStateOf("") }
    var hour by remember { mutableIntStateOf(19) }
    var minute by remember { mutableIntStateOf(0) }
    var repeatType by remember { mutableStateOf(RepeatType.ONCE) }
    var isImportant by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = when (step) {
                    1 -> "Bước 1/3: Bạn cần nhớ gì?"
                    2 -> "Bước 2/3: Chọn giờ & lặp lại"
                    else -> "Bước 3/3: Xác nhận lưu"
                },
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                when (step) {
                    1 -> {
                        FilledTonalButton(
                            onClick = {
                                onDismiss()
                                onVoiceInput()
                            },
                            modifier = Modifier.fillMaxWidth().height(52.dp)
                        ) {
                            Icon(Icons.Default.Mic, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Nói bằng giọng nói tiếng Việt")
                        }
                        OutlinedTextField(
                            value = title,
                            onValueChange = { title = it },
                            label = { Text("Nội dung nhắc việc") },
                            placeholder = { Text("Ví dụ: Tắt bếp, Uống thuốc...") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    2 -> {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(onClick = { hour = (hour + 23) % 24 }) { Text("-1g") }
                            Text(
                                text = "%02d:%02d".format(hour, minute),
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold
                            )
                            OutlinedButton(onClick = { hour = (hour + 1) % 24 }) { Text("+1g") }
                            OutlinedButton(onClick = { minute = (minute + 15) % 60 }) { Text("+15p") }
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf(
                                RepeatType.ONCE to "1 lần",
                                RepeatType.DAILY to "Hằng ngày",
                                RepeatType.MONTHLY to "Hằng tháng"
                            ).forEach { (type, label) ->
                                FilterChip(
                                    selected = repeatType == type,
                                    onClick = { repeatType = type },
                                    label = { Text(label) }
                                )
                            }
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Việc quan trọng (vượt giờ yên tĩnh)")
                            Switch(checked = isImportant, onCheckedChange = { isImportant = it })
                        }
                    }

                    else -> {
                        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Text("Giờ nhắc: %02d:%02d".format(hour, minute))
                        Text("Nhắc kiên trì mỗi 10 phút cho tới khi bấm Đã xong.")
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    when (step) {
                        1 -> if (title.isNotBlank()) step = 2
                        2 -> step = 3
                        else -> {
                            onSave(title.trim(), hour, minute, repeatType, isImportant)
                            onDismiss()
                        }
                    }
                }
            ) {
                Text(if (step < 3) "Tiếp" else "Lưu")
            }
        },
        dismissButton = {
            TextButton(onClick = { if (step > 1) step-- else onDismiss() }) {
                Text(if (step > 1) "Quay lại" else "Hủy")
            }
        }
    )
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/ui/screens/ChecklistScreen.kt',
    packageGroup: 'ui',
    language: 'kotlin',
    summary: 'Màn hình Trước khi ra khỏi nhà: nhiều danh sách (Đi làm, Đi học, Đi du lịch) và nút làm mới',
    content: `package com.nhogiup.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nhogiup.app.data.entity.ChecklistEntity
import com.nhogiup.app.data.entity.ChecklistItemEntity

@Composable
fun ChecklistScreen(
    checklists: List<ChecklistEntity>,
    selectedChecklistId: Long?,
    items: List<ChecklistItemEntity>,
    onSelectChecklist: (Long) -> Unit,
    onToggleItem: (Long, Boolean) -> Unit,
    onAddItem: (Long, String) -> Unit,
    onResetChecklist: (Long) -> Unit,
    onCreateChecklist: (String) -> Unit
) {
    var newItemText by remember { mutableStateOf("") }
    var newGroupText by remember { mutableStateOf("") }
    val activeId = selectedChecklistId ?: checklists.firstOrNull()?.id

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Trước khi ra khỏi nhà",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(checklists, key = { it.id }) { group ->
                    FilterChip(
                        selected = group.id == activeId,
                        onClick = { onSelectChecklist(group.id) },
                        label = { Text(group.name) }
                    )
                }
            }
        }

        if (activeId != null) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val checked = items.count { it.isChecked }
                    Text("Đã kiểm tra $checked / \${items.size} món", fontWeight = FontWeight.SemiBold)
                    TextButton(onClick = { onResetChecklist(activeId) }) {
                        Icon(Icons.Default.Refresh, contentDescription = null)
                        Spacer(Modifier.width(4.dp))
                        Text("Làm mới")
                    }
                }
            }

            items(items, key = { it.id }) { item ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = item.isChecked,
                            onCheckedChange = { onToggleItem(item.id, it) }
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(item.label, style = MaterialTheme.typography.titleMedium)
                    }
                }
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = newItemText,
                        onValueChange = { newItemText = it },
                        placeholder = { Text("Thêm món cần mang...") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    Button(
                        onClick = {
                            if (newItemText.isNotBlank()) {
                                onAddItem(activeId, newItemText.trim())
                                newItemText = ""
                            }
                        },
                        modifier = Modifier.height(56.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Thêm món")
                    }
                }
            }
        }

        item {
            HorizontalDivider(Modifier.padding(vertical = 8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = newGroupText,
                    onValueChange = { newGroupText = it },
                    placeholder = { Text("Tạo danh sách mới (vd: Đi khám)...") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedButton(
                    onClick = {
                        if (newGroupText.isNotBlank()) {
                            onCreateChecklist(newGroupText.trim())
                            newGroupText = ""
                        }
                    },
                    modifier = Modifier.height(56.dp)
                ) {
                    Text("Tạo")
                }
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/ui/screens/ItemLocationScreen.kt',
    packageGroup: 'ui',
    language: 'kotlin',
    summary: 'Màn hình Tôi để đồ ở đâu?: ghi nhanh vị trí, tìm kiếm tức thì và xóa mục',
    content: `package com.nhogiup.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nhogiup.app.data.entity.ItemLocationEntity

@Composable
fun ItemLocationScreen(
    items: List<ItemLocationEntity>,
    onAddLocation: (itemName: String, locationDesc: String) -> Unit,
    onDeleteLocation: (ItemLocationEntity) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var itemName by remember { mutableStateOf("") }
    var locationDesc by remember { mutableStateOf("") }

    val filtered = remember(items, searchQuery) {
        if (searchQuery.isBlank()) items
        else items.filter {
            it.itemName.contains(searchQuery, ignoreCase = true) ||
                it.locationDesc.contains(searchQuery, ignoreCase = true)
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Tôi để đồ ở đâu?",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                placeholder = { Text("Tìm nhanh (vd: chìa khóa, kính, ví)...") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
        }

        item {
            ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Ghi nhanh vị trí đồ vật", fontWeight = FontWeight.Bold)
                    OutlinedTextField(
                        value = itemName,
                        onValueChange = { itemName = it },
                        label = { Text("Tên đồ vật") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = locationDesc,
                        onValueChange = { locationDesc = it },
                        label = { Text("Để ở đâu?") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Button(
                        onClick = {
                            if (itemName.isNotBlank() && locationDesc.isNotBlank()) {
                                onAddLocation(itemName.trim(), locationDesc.trim())
                                itemName = ""
                                locationDesc = ""
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(50.dp)
                    ) {
                        Text("Lưu vị trí")
                    }
                }
            }
        }

        items(filtered, key = { it.id }) { entry ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(entry.itemName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(entry.locationDesc, color = MaterialTheme.colorScheme.primary)
                    }
                    IconButton(onClick = { onDeleteLocation(entry) }) {
                        Icon(Icons.Default.Delete, contentDescription = "Xóa")
                    }
                }
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/ui/screens/SettingsScreen.kt',
    packageGroup: 'ui',
    language: 'kotlin',
    summary: 'Màn hình Cài đặt: Sáng/Tối, cỡ chữ, độ kiên trì, giờ yên tĩnh, người thân và tắt tối ưu pin',
    content: `package com.nhogiup.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nhogiup.app.data.entity.AppSettingsEntity

@Composable
fun SettingsScreen(
    settings: AppSettingsEntity,
    onUpdate: (AppSettingsEntity) -> Unit,
    onOpenBatterySettings: () -> Unit,
    onExportBackup: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text("Cài đặt", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        }

        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Chế độ Tối", style = MaterialTheme.typography.titleMedium)
                        Switch(
                            checked = settings.darkMode,
                            onCheckedChange = { onUpdate(settings.copy(darkMode = it)) }
                        )
                    }

                    Text("Cỡ chữ", fontWeight = FontWeight.SemiBold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(1.0f to "Vừa", 1.18f to "Lớn", 1.35f to "Rất lớn").forEach { (s, label) ->
                            FilterChip(
                                selected = settings.fontScale == s,
                                onClick = { onUpdate(settings.copy(fontScale = s)) },
                                label = { Text(label) }
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Giờ yên tĩnh (22:00 – 06:30)")
                        Switch(
                            checked = settings.quietHoursEnabled,
                            onCheckedChange = { onUpdate(settings.copy(quietHoursEnabled = it)) }
                        )
                    }
                }
            }
        }

        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Người thân hỗ trợ", fontWeight = FontWeight.Bold)
                    OutlinedTextField(
                        value = settings.emergencyName,
                        onValueChange = { onUpdate(settings.copy(emergencyName = it)) },
                        label = { Text("Tên người thân") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = settings.emergencyPhone,
                        onValueChange = { onUpdate(settings.copy(emergencyPhone = it)) },
                        label = { Text("Số điện thoại") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }
        }

        item {
            Button(
                onClick = onExportBackup,
                modifier = Modifier.fillMaxWidth().height(52.dp)
            ) {
                Text("Sao lưu dữ liệu ra file JSON")
            }
        }

        item {
            OutlinedButton(
                onClick = onOpenBatterySettings,
                modifier = Modifier.fillMaxWidth().height(52.dp)
            ) {
                Text("Mở cài đặt Tắt tối ưu pin Android")
            }
        }
    }
}
`,
  },
];
