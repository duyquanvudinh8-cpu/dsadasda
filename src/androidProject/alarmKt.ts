import type { AndroidSourceFile } from './gradleAndManifest';

export const ALARM_KT_FILES: AndroidSourceFile[] = [
  {
    path: 'app/src/main/java/com/nhogiup/app/alarm/AlarmScheduler.kt',
    packageGroup: 'alarm',
    language: 'kotlin',
    summary: 'Lên lịch báo thức chính xác bằng AlarmManager.setExactAndAllowWhileIdle và nhắc lại kiên trì',
    content: `package com.nhogiup.app.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.nhogiup.app.data.entity.ReminderEntity
import java.util.Calendar

/**
 * Đặt báo thức chính xác hoạt động cả khi điện thoại ở chế độ Doze (ngủ sâu).
 */
class AlarmScheduler(private val context: Context) {

    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    fun scheduleExact(reminder: ReminderEntity, triggerAtMillis: Long) {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra(EXTRA_REMINDER_ID, reminder.id)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            reminder.id.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val canUseExact = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }

        if (canUseExact) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent
            )
        } else {
            // Dự phòng an toàn nếu người dùng chưa bật quyền Exact Alarm
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent
            )
        }
    }

    fun scheduleNextNag(reminder: ReminderEntity, intervalMinutes: Int) {
        val nextMillis = System.currentTimeMillis() + intervalMinutes * 60_000L
        scheduleExact(reminder, nextMillis)
    }

    fun cancel(reminderId: Long) {
        val intent = Intent(context, AlarmReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            reminderId.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pendingIntent)
    }

    companion object {
        const val EXTRA_REMINDER_ID = "extra_reminder_id"

        fun computeNextDailyMillis(hour: Int, minute: Int, forceTomorrow: Boolean = false): Long {
            val cal = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                if (forceTomorrow || timeInMillis <= System.currentTimeMillis()) {
                    add(Calendar.DAY_OF_YEAR, 1)
                }
            }
            return cal.timeInMillis
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/alarm/NotificationHelper.kt',
    packageGroup: 'alarm',
    language: 'kotlin',
    summary: 'Tạo kênh thông báo và hiển thị 3 nút hành động: Đã xong, Nhắc lại sau 10 phút, Bỏ qua hôm nay',
    content: `package com.nhogiup.app.alarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.nhogiup.app.MainActivity
import com.nhogiup.app.R
import com.nhogiup.app.data.entity.ReminderEntity

object NotificationHelper {

    const val CHANNEL_NORMAL = "nhogiup_normal_reminders"
    const val CHANNEL_CRITICAL = "nhogiup_critical_reminders"

    fun ensureChannels(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val normalChannel = NotificationChannel(
            CHANNEL_NORMAL,
            context.getString(R.string.channel_normal_name),
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            enableVibration(true)
            description = "Thông báo nhắc việc hằng ngày"
        }

        val criticalChannel = NotificationChannel(
            CHANNEL_CRITICAL,
            context.getString(R.string.channel_critical_name),
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            enableVibration(true)
            setBypassDnd(true)
            description = "Nhắc việc quan trọng (uống thuốc, tắt bếp, khóa cửa)"
        }

        manager.createNotificationChannel(normalChannel)
        manager.createNotificationChannel(criticalChannel)
    }

    fun showReminderNotification(context: Context, reminder: ReminderEntity, nagAttempt: Int) {
        ensureChannels(context)
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = if (reminder.isImportant) CHANNEL_CRITICAL else CHANNEL_NORMAL

        val openAppIntent = PendingIntent.getActivity(
            context,
            reminder.id.toInt(),
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val doneIntent = actionPendingIntent(context, reminder.id, NotificationActionReceiver.ACTION_DONE, 1)
        val snoozeIntent = actionPendingIntent(context, reminder.id, NotificationActionReceiver.ACTION_SNOOZE_10, 2)
        val skipIntent = actionPendingIntent(context, reminder.id, NotificationActionReceiver.ACTION_SKIP_TODAY, 3)

        val subtitle = if (nagAttempt > 1) {
            "Nhắc lại lần $nagAttempt/\${reminder.maxNagCount} — Chạm Đã xong khi bạn hoàn thành"
        } else {
            reminder.note.ifEmpty { "Đến giờ thực hiện việc này" }
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(reminder.title)
            .setContentText(subtitle)
            .setStyle(NotificationCompat.BigTextStyle().bigText(subtitle))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setOngoing(reminder.isImportant)
            .setContentIntent(openAppIntent)
            .addAction(0, context.getString(R.string.action_done), doneIntent)
            .addAction(0, context.getString(R.string.action_snooze_10), snoozeIntent)
            .addAction(0, context.getString(R.string.action_skip_today), skipIntent)
            .build()

        manager.notify(reminder.id.toInt(), notification)
    }

    fun dismiss(context: Context, reminderId: Long) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(reminderId.toInt())
    }

    private fun actionPendingIntent(
        context: Context,
        reminderId: Long,
        action: String,
        salt: Int
    ): PendingIntent {
        val intent = Intent(context, NotificationActionReceiver::class.java).apply {
            this.action = action
            putExtra(AlarmScheduler.EXTRA_REMINDER_ID, reminderId)
        }
        return PendingIntent.getBroadcast(
            context,
            (reminderId * 10 + salt).toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/alarm/AlarmReceiver.kt',
    packageGroup: 'alarm',
    language: 'kotlin',
    summary: 'Nhận báo thức, kiểm tra giờ yên tĩnh, phát thông báo và tự động đặt lịch nhắc lại kiên trì sau 10 phút',
    content: `package com.nhogiup.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.nhogiup.app.data.database.NhoGiupDatabase
import com.nhogiup.app.domain.model.ReminderStatus
import com.nhogiup.app.domain.scheduler.QuietHoursEvaluator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalTime

class AlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val reminderId = intent.getLongExtra(AlarmScheduler.EXTRA_REMINDER_ID, -1L)
        if (reminderId <= 0L) return

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = NhoGiupDatabase.getInstance(context)
                val reminder = db.reminderDao().getById(reminderId) ?: return@launch
                if (reminder.status == ReminderStatus.DONE || reminder.status == ReminderStatus.SKIPPED) {
                    return@launch
                }

                val settings = db.settingsDao().getSettingsOnce()
                val suppressed = settings != null && QuietHoursEvaluator.shouldSuppress(
                    now = LocalTime.now(),
                    enabled = settings.quietHoursEnabled,
                    startHour = settings.quietStartHour,
                    startMinute = settings.quietStartMinute,
                    endHour = settings.quietEndHour,
                    endMinute = settings.quietEndMinute,
                    isImportant = reminder.isImportant
                )

                val scheduler = AlarmScheduler(context)
                if (suppressed) {
                    // Trì hoãn sang cuối giờ yên tĩnh
                    val wakeMillis = AlarmScheduler.computeNextDailyMillis(
                        settings!!.quietEndHour,
                        settings.quietEndMinute
                    )
                    scheduler.scheduleExact(reminder, wakeMillis)
                    return@launch
                }

                val nextNag = reminder.nagCount + 1
                db.reminderDao().updateStatusAndNag(reminder.id, ReminderStatus.OVERDUE, nextNag)
                NotificationHelper.showReminderNotification(context, reminder, nextNag)

                // Tự động hẹn nhắc lại kiên trì nếu chưa đạt số lần tối đa
                if (nextNag < reminder.maxNagCount) {
                    val interval = reminder.nagIntervalMinutes.coerceAtLeast(1)
                    scheduler.scheduleNextNag(reminder, interval)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/alarm/NotificationActionReceiver.kt',
    packageGroup: 'alarm',
    language: 'kotlin',
    summary: 'Xử lý trực tiếp 3 nút trên thanh thông báo mà không cần mở ứng dụng',
    content: `package com.nhogiup.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.nhogiup.app.data.database.NhoGiupDatabase
import com.nhogiup.app.domain.model.ReminderStatus
import com.nhogiup.app.domain.model.RepeatType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class NotificationActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val reminderId = intent.getLongExtra(AlarmScheduler.EXTRA_REMINDER_ID, -1L)
        if (reminderId <= 0L) return

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = NhoGiupDatabase.getInstance(context)
                val reminder = db.reminderDao().getById(reminderId) ?: return@launch
                val scheduler = AlarmScheduler(context)

                when (intent.action) {
                    ACTION_DONE -> {
                        scheduler.cancel(reminderId)
                        NotificationHelper.dismiss(context, reminderId)
                        db.reminderDao().updateStatusAndNag(reminderId, ReminderStatus.DONE, 0)
                        if (reminder.repeatType == RepeatType.DAILY) {
                            val nextDay = AlarmScheduler.computeNextDailyMillis(
                                reminder.hour,
                                reminder.minute,
                                forceTomorrow = true
                            )
                            scheduler.scheduleExact(reminder, nextDay)
                        }
                    }

                    ACTION_SNOOZE_10 -> {
                        NotificationHelper.dismiss(context, reminderId)
                        db.reminderDao().updateStatusAndNag(reminderId, ReminderStatus.PENDING, reminder.nagCount)
                        scheduler.scheduleNextNag(reminder, 10)
                    }

                    ACTION_SKIP_TODAY -> {
                        scheduler.cancel(reminderId)
                        NotificationHelper.dismiss(context, reminderId)
                        db.reminderDao().updateStatusAndNag(reminderId, ReminderStatus.SKIPPED, 0)
                    }
                }
            } finally {
                pendingResult.finish()
            }
        }
    }

    companion object {
        const val ACTION_DONE = "com.nhogiup.app.ACTION_DONE"
        const val ACTION_SNOOZE_10 = "com.nhogiup.app.ACTION_SNOOZE_10"
        const val ACTION_SKIP_TODAY = "com.nhogiup.app.ACTION_SKIP_TODAY"
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/nhogiup/app/alarm/BootCompletedReceiver.kt',
    packageGroup: 'alarm',
    language: 'kotlin',
    summary: 'Khôi phục toàn bộ báo thức sau khi điện thoại khởi động lại (BOOT_COMPLETED)',
    content: `package com.nhogiup.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.nhogiup.app.data.database.NhoGiupDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Tự động chạy khi điện thoại khởi động lại để đặt lại toàn bộ báo thức trong Room.
 */
class BootCompletedReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_LOCKED_BOOT_COMPLETED &&
            action != Intent.ACTION_MY_PACKAGE_REPLACED
        ) return

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = NhoGiupDatabase.getInstance(context)
                val activeReminders = db.reminderDao().getActiveReminders()
                val scheduler = AlarmScheduler(context)

                activeReminders.forEach { reminder ->
                    val triggerMillis = if (reminder.nextTriggerMillis > System.currentTimeMillis()) {
                        reminder.nextTriggerMillis
                    } else {
                        AlarmScheduler.computeNextDailyMillis(reminder.hour, reminder.minute)
                    }
                    scheduler.scheduleExact(reminder, triggerMillis)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
`,
  },
];
