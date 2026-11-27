import type { AndroidSourceFile } from './gradleAndManifest';

export const DATA_AND_DOMAIN_KT_FILES: AndroidSourceFile[] = [
  {
    path: 'app/src/main/java/com/nhogiup/app/domain/model/DomainModels.kt',
    packageGroup: 'domain',
    language: 'kotlin',
    summary: 'Enum kiểu lặp lại, trạng thái nhắc việc, cỡ chữ và chế độ giao diện',
    content: `package com.nhogiup.app.domain.model

enum class RepeatType {
    ONCE,
    DAILY,
    WEEKDAYS,
    MONTHLY
}

enum class ReminderStatus {
    PENDING,
    OVERDUE,
    DONE,
    SKIPPED
}

enum class TextScaleMode(val scaleFactor: Float) {
    NORMAL(1.0f),
    LARGE(1.18f),
    EXTRA_LARGE(1.35f)
}

enum class ThemePreference {
    SYSTEM,
    LIGHT,
    DARK
}

data class ParsedVoiceReminder(
    val title: String,
    val hour: Int,
    val minute: Int,
    val isTomorrow: Boolean,
    val repeatType: RepeatType,
    val isImportant: Boolean
)
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/domain/parser/VietnameseVoiceParser.kt',
    packageGroup: 'domain',
    language: 'kotlin',
    summary: 'Bộ phân tích câu nói tiếng Việt offline ("nhắc tôi tắt bếp lúc 7 giờ tối")',
    content: `package com.nhogiup.app.domain.parser

import com.nhogiup.app.domain.model.ParsedVoiceReminder
import com.nhogiup.app.domain.model.RepeatType
import java.time.LocalTime

/**
 * Bộ phân tích lệnh giọng nói tiếng Việt chạy hoàn toàn offline.
 * Hỗ trợ các mẫu câu tự nhiên: "nhắc tôi tắt bếp lúc 7 giờ tối",
 * "uống thuốc lúc 8h30 sáng mỗi ngày", "khóa cửa sau 15 phút".
 */
object VietnameseVoiceParser {

    private val importantKeywords = listOf(
        "tắt bếp", "bếp ga", "uống thuốc", "khóa cửa", "rút điện",
        "bàn ủi", "bác sĩ", "khám bệnh", "đón con", "quan trọng"
    )

    fun parse(rawInput: String, now: LocalTime = LocalTime.now()): ParsedVoiceReminder {
        val original = rawInput.trim()
        var text = original

        val repeatType = when {
            Regex("(mỗi ngày|hằng ngày|hàng ngày)", RegexOption.IGNORE_CASE).containsMatchIn(text) -> {
                text = text.replace(Regex("(mỗi ngày|hằng ngày|hàng ngày)", RegexOption.IGNORE_CASE), " ")
                RepeatType.DAILY
            }
            Regex("(hằng tháng|hàng tháng|mỗi tháng)", RegexOption.IGNORE_CASE).containsMatchIn(text) -> {
                text = text.replace(Regex("(hằng tháng|hàng tháng|mỗi tháng)", RegexOption.IGNORE_CASE), " ")
                RepeatType.MONTHLY
            }
            else -> RepeatType.ONCE
        }

        val isTomorrow = Regex("(ngày mai|mai\\\\b)", RegexOption.IGNORE_CASE).containsMatchIn(text)
        if (isTomorrow) {
            text = text.replace(Regex("(vào\\\\s+)?ngày mai", RegexOption.IGNORE_CASE), " ")
        }

        var hour: Int? = null
        var minute = 0

        // 1. Thời gian tương đối: "sau 15 phút"
        val relMin = Regex("sau\\\\s+(\\\\d{1,3})\\\\s*(phút|phut|p)", RegexOption.IGNORE_CASE).find(text)
        if (relMin != null) {
            val mins = relMin.groupValues[1].toLongOrNull()?.coerceIn(1, 720) ?: 10L
            val target = now.plusMinutes(mins)
            hour = target.hour
            minute = target.minute
            text = text.replace(relMin.value, " ")
        } else {
            // 2. Thời gian tuyệt đối: "lúc 7 giờ tối", "8h30 sáng", "7 giờ rưỡi tối"
            val absRegex = Regex(
                "(?:vào\\\\s+lúc|lúc|vào)?\\\\s*(\\\\d{1,2})\\\\s*(?:giờ|gio|h|:)\\\\s*(?:(rưỡi|ruoi)|(\\\\d{1,2})\\\\s*(?:phút|phut)?)?\\\\s*(sáng|trưa|chiều|tối|đêm)?",
                RegexOption.IGNORE_CASE
            )
            val match = absRegex.find(text)
            if (match != null) {
                var parsedHour = match.groupValues[1].toIntOrNull() ?: now.hour
                val parsedMinute = when {
                    match.groupValues[2].isNotEmpty() -> 30
                    match.groupValues[3].isNotEmpty() -> match.groupValues[3].toIntOrNull() ?: 0
                    else -> 0
                }
                val period = match.groupValues[4].lowercase()
                if ((period == "tối" || period == "chiều") && parsedHour in 1..11) {
                    parsedHour += 12
                } else if (period == "sáng" && parsedHour == 12) {
                    parsedHour = 0
                }
                if (parsedHour in 0..23 && parsedMinute in 0..59) {
                    hour = parsedHour
                    minute = parsedMinute
                    text = text.replace(match.value, " ")
                }
            }
        }

        val fallback = now.plusMinutes(30)
        val finalHour = hour ?: fallback.hour
        val finalMinute = if (hour != null) minute else fallback.minute

        val cleanedTitle = text
            .replace(Regex("^(hãy\\\\s+)?(nhắc\\\\s+(tôi|mình|giúp|nhớ)?|nhớ\\\\s+)", RegexOption.IGNORE_CASE), "")
            .replace(Regex("\\\\s+"), " ")
            .trim(' ', ',', '.', '-', ':')
            .ifEmpty { original.ifEmpty { "Việc cần nhớ" } }
            .replaceFirstChar { it.uppercase() }

        val isImportant = importantKeywords.any { original.lowercase().contains(it) }

        return ParsedVoiceReminder(
            title = cleanedTitle,
            hour = finalHour,
            minute = finalMinute,
            isTomorrow = isTomorrow,
            repeatType = repeatType,
            isImportant = isImportant
        )
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/domain/scheduler/QuietHoursEvaluator.kt',
    packageGroup: 'domain',
    language: 'kotlin',
    summary: 'Kiểm tra giờ yên tĩnh ban đêm và quy tắc vượt rào cho việc quan trọng',
    content: `package com.nhogiup.app.domain.scheduler

import java.time.LocalTime

object QuietHoursEvaluator {

    /**
     * Trả về true nếu thời điểm hiện tại nằm trong giờ yên tĩnh và nhắc việc không đánh dấu Quan trọng.
     * Xử lý đúng khung giờ qua đêm (ví dụ 22:00 đến 06:30 sáng hôm sau).
     */
    fun shouldSuppress(
        now: LocalTime,
        enabled: Boolean,
        startHour: Int,
        startMinute: Int,
        endHour: Int,
        endMinute: Int,
        isImportant: Boolean
    ): Boolean {
        if (!enabled || isImportant) return false
        val currentMins = now.hour * 60 + now.minute
        val startMins = startHour * 60 + startMinute
        val endMins = endHour * 60 + endMinute

        if (startMins == endMins) return false
        return if (startMins < endMins) {
            currentMins in startMins until endMins
        } else {
            currentMins >= startMins || currentMins < endMins
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/data/entity/Entities.kt',
    packageGroup: 'data',
    language: 'kotlin',
    summary: 'Các Room Entity: ReminderEntity, ChecklistEntity, ChecklistItemEntity, ItemLocationEntity, AppSettingsEntity',
    content: `package com.nhogiup.app.data.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.nhogiup.app.domain.model.ReminderStatus
import com.nhogiup.app.domain.model.RepeatType

@Entity(tableName = "reminders")
data class ReminderEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val title: String,
    val note: String = "",
    val hour: Int,
    val minute: Int,
    val nextTriggerMillis: Long,
    val repeatType: RepeatType = RepeatType.ONCE,
    val repeatDaysCsv: String = "", // Ví dụ: "1,3,5" cho Thứ 2, 4, 6
    val isImportant: Boolean = false,
    val status: ReminderStatus = ReminderStatus.PENDING,
    val nagCount: Int = 0,
    val nagIntervalMinutes: Int = 10,
    val maxNagCount: Int = 5,
    val createdAtMillis: Long = System.currentTimeMillis()
)

@Entity(tableName = "checklists")
data class ChecklistEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val name: String,
    val reminderHour: Int = 7,
    val reminderMinute: Int = 30,
    val reminderEnabled: Boolean = true
)

@Entity(
    tableName = "checklist_items",
    foreignKeys = [
        ForeignKey(
            entity = ChecklistEntity::class,
            parentColumns = ["id"],
            childColumns = ["checklistId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("checklistId")]
)
data class ChecklistItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val checklistId: Long,
    val label: String,
    val isChecked: Boolean = false
)

@Entity(tableName = "item_locations")
data class ItemLocationEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val itemName: String,
    val locationDesc: String,
    val photoPath: String? = null,
    val updatedAtMillis: Long = System.currentTimeMillis()
)

@Entity(tableName = "app_settings")
data class AppSettingsEntity(
    @PrimaryKey val id: Int = 1,
    val darkMode: Boolean = false,
    val fontScale: Float = 1.15f,
    val soundEnabled: Boolean = true,
    val vibrationEnabled: Boolean = true,
    val defaultNagIntervalMinutes: Int = 10,
    val defaultMaxNagCount: Int = 5,
    val quietHoursEnabled: Boolean = true,
    val quietStartHour: Int = 22,
    val quietStartMinute: Int = 0,
    val quietEndHour: Int = 6,
    val quietEndMinute: Int = 30,
    val emergencyEnabled: Boolean = false,
    val emergencyName: String = "",
    val emergencyPhone: String = "",
    val emergencyMissedThreshold: Int = 3,
    val onboardingDone: Boolean = false
)
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/data/dao/Daos.kt',
    packageGroup: 'data',
    language: 'kotlin',
    summary: 'Room DAO truy vấn reactive Flow cho nhắc việc, danh sách kiểm tra, đồ vật và cài đặt',
    content: `package com.nhogiup.app.data.dao

import androidx.room.*
import com.nhogiup.app.data.entity.*
import com.nhogiup.app.domain.model.ReminderStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface ReminderDao {
    @Query("SELECT * FROM reminders ORDER BY CASE status WHEN 'OVERDUE' THEN 0 WHEN 'PENDING' THEN 1 ELSE 2 END, hour ASC, minute ASC")
    fun observeAll(): Flow<List<ReminderEntity>>

    @Query("SELECT * FROM reminders WHERE status IN ('PENDING', 'OVERDUE')")
    suspend fun getActiveReminders(): List<ReminderEntity>

    @Query("SELECT * FROM reminders WHERE id = :id")
    suspend fun getById(id: Long): ReminderEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(reminder: ReminderEntity): Long

    @Query("UPDATE reminders SET status = :status, nagCount = :nagCount WHERE id = :id")
    suspend fun updateStatusAndNag(id: Long, status: ReminderStatus, nagCount: Int)

    @Delete
    suspend fun delete(reminder: ReminderEntity)
}

@Dao
interface ChecklistDao {
    @Query("SELECT * FROM checklists ORDER BY id ASC")
    fun observeChecklists(): Flow<List<ChecklistEntity>>

    @Query("SELECT * FROM checklist_items WHERE checklistId = :checklistId ORDER BY id ASC")
    fun observeItems(checklistId: Long): Flow<List<ChecklistItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChecklist(entity: ChecklistEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItem(item: ChecklistItemEntity): Long

    @Query("UPDATE checklist_items SET isChecked = :checked WHERE id = :itemId")
    suspend fun setItemChecked(itemId: Long, checked: Boolean)

    @Query("UPDATE checklist_items SET isChecked = 0 WHERE checklistId = :checklistId")
    suspend fun resetChecklist(checklistId: Long)
}

@Dao
interface ItemLocationDao {
    @Query("SELECT * FROM item_locations ORDER BY updatedAtMillis DESC")
    fun observeAll(): Flow<List<ItemLocationEntity>>

    @Query("SELECT * FROM item_locations WHERE itemName LIKE '%' || :query || '%' OR locationDesc LIKE '%' || :query || '%' ORDER BY updatedAtMillis DESC")
    fun search(query: String): Flow<List<ItemLocationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(item: ItemLocationEntity): Long

    @Delete
    suspend fun delete(item: ItemLocationEntity)
}

@Dao
interface SettingsDao {
    @Query("SELECT * FROM app_settings WHERE id = 1")
    fun observeSettings(): Flow<AppSettingsEntity?>

    @Query("SELECT * FROM app_settings WHERE id = 1")
    suspend fun getSettingsOnce(): AppSettingsEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(settings: AppSettingsEntity)
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/data/database/NhoGiupDatabase.kt',
    packageGroup: 'data',
    language: 'kotlin',
    summary: 'Room Database offline kèm TypeConverter và khởi tạo singleton',
    content: `package com.nhogiup.app.data.database

import android.content.Context
import androidx.room.*
import com.nhogiup.app.data.dao.*
import com.nhogiup.app.data.entity.*
import com.nhogiup.app.domain.model.ReminderStatus
import com.nhogiup.app.domain.model.RepeatType

class NhoGiupConverters {
    @TypeConverter fun fromRepeatType(v: RepeatType): String = v.name
    @TypeConverter fun toRepeatType(v: String): RepeatType = RepeatType.valueOf(v)
    @TypeConverter fun fromStatus(v: ReminderStatus): String = v.name
    @TypeConverter fun toStatus(v: String): ReminderStatus = ReminderStatus.valueOf(v)
}

@Database(
    entities = [
        ReminderEntity::class,
        ChecklistEntity::class,
        ChecklistItemEntity::class,
        ItemLocationEntity::class,
        AppSettingsEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(NhoGiupConverters::class)
abstract class NhoGiupDatabase : RoomDatabase() {
    abstract fun reminderDao(): ReminderDao
    abstract fun checklistDao(): ChecklistDao
    abstract fun itemLocationDao(): ItemLocationDao
    abstract fun settingsDao(): SettingsDao

    companion object {
        @Volatile private var INSTANCE: NhoGiupDatabase? = null

        fun getInstance(context: Context): NhoGiupDatabase {
            return INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(
                    context.applicationContext,
                    NhoGiupDatabase::class.java,
                    "nho_giup_offline.db"
                ).build().also { INSTANCE = it }
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/data/repository/BackupJsonSerializer.kt',
    packageGroup: 'data',
    language: 'kotlin',
    summary: 'Sao lưu và khôi phục toàn bộ dữ liệu offline ra tệp JSON',
    content: `package com.nhogiup.app.data.repository

import com.nhogiup.app.data.entity.*
import com.nhogiup.app.domain.model.ReminderStatus
import com.nhogiup.app.domain.model.RepeatType
import org.json.JSONArray
import org.json.JSONObject

/** Xuất / nhập toàn bộ dữ liệu Nhớ Giúp dưới dạng JSON không cần Internet. */
object BackupJsonSerializer {

    fun exportToJson(
        reminders: List<ReminderEntity>,
        items: List<ItemLocationEntity>,
        settings: AppSettingsEntity
    ): String {
        val root = JSONObject()
        root.put("version", 1)
        root.put("exportedAt", System.currentTimeMillis())

        val remArray = JSONArray()
        reminders.forEach { r ->
            remArray.put(JSONObject().apply {
                put("title", r.title)
                put("note", r.note)
                put("hour", r.hour)
                put("minute", r.minute)
                put("repeatType", r.repeatType.name)
                put("isImportant", r.isImportant)
                put("nagIntervalMinutes", r.nagIntervalMinutes)
                put("maxNagCount", r.maxNagCount)
            })
        }
        root.put("reminders", remArray)

        val locArray = JSONArray()
        items.forEach { loc ->
            locArray.put(JSONObject().apply {
                put("itemName", loc.itemName)
                put("locationDesc", loc.locationDesc)
                put("photoPath", loc.photoPath ?: "")
            })
        }
        root.put("itemLocations", locArray)

        root.put("settings", JSONObject().apply {
            put("darkMode", settings.darkMode)
            put("fontScale", settings.fontScale.toDouble())
            put("defaultNagIntervalMinutes", settings.defaultNagIntervalMinutes)
            put("defaultMaxNagCount", settings.defaultMaxNagCount)
            put("emergencyName", settings.emergencyName)
            put("emergencyPhone", settings.emergencyPhone)
        })

        return root.toString(2)
    }

    fun parseRemindersFromJson(jsonText: String): List<ReminderEntity> {
        val root = JSONObject(jsonText)
        val arr = root.optJSONArray("reminders") ?: return emptyList()
        return buildList {
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                add(
                    ReminderEntity(
                        title = obj.getString("title"),
                        note = obj.optString("note", ""),
                        hour = obj.optInt("hour", 8),
                        minute = obj.optInt("minute", 0),
                        nextTriggerMillis = System.currentTimeMillis() + 3600_000L,
                        repeatType = runCatching {
                            RepeatType.valueOf(obj.optString("repeatType", "ONCE"))
                        }.getOrDefault(RepeatType.ONCE),
                        isImportant = obj.optBoolean("isImportant", false),
                        status = ReminderStatus.PENDING,
                        nagIntervalMinutes = obj.optInt("nagIntervalMinutes", 10),
                        maxNagCount = obj.optInt("maxNagCount", 5)
                    )
                )
            }
        }
    }
}
`,
  },
];
