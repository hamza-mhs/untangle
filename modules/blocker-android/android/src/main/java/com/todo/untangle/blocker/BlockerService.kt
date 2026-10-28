package com.todo.untangle.blocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import java.util.Calendar

/**
 * Foreground service that watches the foreground app via UsageStatsManager and launches the
 * block screen when a blocked app comes to the front (during a rule window or a focus session).
 * Also shows the ongoing notification — a live countdown while focus is running.
 * SCAFFOLD: polling every second is simple but not battery-optimal. TODO(verify) on device.
 */
class BlockerService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var lastPackage: String? = null

  private val tick = object : Runnable {
    override fun run() {
      check()
      handler.postDelayed(this, POLL_MS)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    ensureChannels(this)
    ServiceCompat.startForeground(
      this, NOTIFICATION_ID, buildNotification(),
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE else 0,
    )
    handler.removeCallbacks(tick)
    handler.post(tick)
    return START_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(tick)
    super.onDestroy()
  }

  private fun check() {
    val prefs = SharedStore.prefs(this)
    val focusEndsAt = prefs.getLong(SharedStore.KEY_FOCUS_ENDS_AT, 0L)
    val now = System.currentTimeMillis()
    if (focusEndsAt in 1 until now) {
      prefs.edit().remove(SharedStore.KEY_FOCUS_ENDS_AT).apply()
      sync(this)
      return
    }
    val pkg = foregroundPackage() ?: return
    if (pkg == packageName || pkg == lastPackage) return
    lastPackage = pkg

    val focusActive = focusEndsAt > now
    val rules = RuleDTO.parseList(prefs.getString(SharedStore.KEY_RULES, null))
    val blockingRule = rules.firstOrNull { it.enabled && pkg in it.packages && isActive(it) }
    // TODO(verify): focus should block every app except an allow-list (phone, maps, ...).
    if (focusActive || blockingRule != null) {
      if (!Settings.canDrawOverlays(this)) return // can't launch from background without it
      startActivity(
        Intent(this, BlockActivity::class.java)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
          .putExtra(BlockActivity.EXTRA_PACKAGE, pkg)
          .putExtra(BlockActivity.EXTRA_STRENGTH, if (focusActive) "focus" else blockingRule!!.strength)
      )
    }
  }

  private fun foregroundPackage(): String? {
    val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val now = System.currentTimeMillis()
    val events = usm.queryEvents(now - 10_000, now)
    val e = UsageEvents.Event()
    var latest: String? = null
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      if (e.eventType == UsageEvents.Event.ACTIVITY_RESUMED) latest = e.packageName
    }
    return latest
  }

  private fun buildNotification(): Notification {
    val endsAt = SharedStore.prefs(this).getLong(SharedStore.KEY_FOCUS_ENDS_AT, 0L)
    val focus = endsAt > System.currentTimeMillis()
    val b = NotificationCompat.Builder(this, if (focus) CHANNEL_FOCUS else CHANNEL_BLOCKING)
      .setSmallIcon(android.R.drawable.ic_lock_idle_lock) // TODO: real monochrome icon
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setCategory(NotificationCompat.CATEGORY_PROGRESS)
    return if (focus) {
      b.setContentTitle("Locked in")
        .setContentText("Focus session running")
        .setUsesChronometer(true)
        .setChronometerCountDown(true)
        .setWhen(endsAt)
        .build()
    } else {
      b.setContentTitle("Untangle is blocking").setContentText("Rules are active").build()
    }
  }

  companion object {
    private const val POLL_MS = 1000L
    private const val NOTIFICATION_ID = 4201
    private const val CHANNEL_BLOCKING = "untangle.blocking"
    private const val CHANNEL_FOCUS = "untangle.focus"

    /** Start or stop the service depending on whether anything needs watching. */
    fun sync(context: Context) {
      val prefs = SharedStore.prefs(context)
      val anyRule = RuleDTO.parseList(prefs.getString(SharedStore.KEY_RULES, null)).any { it.enabled }
      val focus = prefs.getLong(SharedStore.KEY_FOCUS_ENDS_AT, 0L) > System.currentTimeMillis()
      val intent = Intent(context, BlockerService::class.java)
      if ((anyRule || focus) && BlockerAndroidModule.hasUsageAccess(context)) {
        androidx.core.content.ContextCompat.startForegroundService(context, intent)
      } else {
        context.stopService(intent)
      }
    }

    fun ensureChannels(context: Context) {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
      val nm = context.getSystemService(NotificationManager::class.java)
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL_BLOCKING, context.getString(R.string.untangle_channel_blocking), NotificationManager.IMPORTANCE_MIN)
      )
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL_FOCUS, context.getString(R.string.untangle_channel_focus), NotificationManager.IMPORTANCE_LOW)
      )
    }

    /** Same semantics as src/features/rules/schedule.ts (overnight windows belong to start day). */
    fun isActive(rule: RuleDTO, at: Calendar = Calendar.getInstance()): Boolean {
      fun mins(hhmm: String) = hhmm.split(":").let { it[0].toInt() * 60 + it[1].toInt() }
      val now = at.get(Calendar.HOUR_OF_DAY) * 60 + at.get(Calendar.MINUTE)
      val today = at.get(Calendar.DAY_OF_WEEK) - 1 // Calendar: Sunday = 1 → 0
      val yesterday = (today + 6) % 7
      val start = mins(rule.start)
      val end = mins(rule.end)
      return if (end > start) today in rule.days && now >= start && now < end
      else (today in rule.days && now >= start) || (yesterday in rule.days && now < end)
    }
  }
}
