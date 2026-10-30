package com.todo.untangle.blocker

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import android.text.TextUtils
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * The JS bridge (02-android-platform §2.2), mirrored by src/native/untangleBlocker.types.ts.
 * JS edits locks and settings; this module writes them to the native store, which the
 * accessibility service enforces even while the app is closed.
 */
class UntangleBlockerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No React context")

  private val store get() = BlockerStore.get(context)

  override fun definition() = ModuleDefinition {
    Name("UntangleBlocker")

    Events("blocked", "usageTick", "serviceHealth")

    OnStartObserving {
      UntangleAccessibilityService.onBlocked = { payload -> sendEvent("blocked", payload) }
    }
    OnStopObserving {
      UntangleAccessibilityService.onBlocked = null
    }

    // MARK: permissions

    AsyncFunction("isAccessibilityEnabled") { isServiceEnabled() }

    AsyncFunction("openAccessibilitySettings") { open(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }

    AsyncFunction("hasUsageAccess") { UsageRepository(context).hasAccess() }

    AsyncFunction("openUsageAccessSettings") {
      // Some phones accept the package URI and jump straight to Untangle's toggle.
      val direct = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, Uri.parse("package:${context.packageName}"))
      if (!tryOpen(direct)) open(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
    }

    AsyncFunction("isIgnoringBatteryOptimizations") {
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(context.packageName)
    }

    AsyncFunction("openBatteryOptimizationSettings") {
      // The list screen: no REQUEST_IGNORE_BATTERY_OPTIMIZATIONS permission needed (§3).
      open(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
    }

    AsyncFunction("openOemAutostartSettings") {
      OEM_AUTOSTART.any { (pkg, cls) ->
        tryOpen(Intent().setComponent(ComponentName(pkg, cls)))
      }
    }

    AsyncFunction("openAppDetailsSettings") {
      open(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")))
    }

    AsyncFunction("getServiceHealth") {
      mapOf("enabled" to isServiceEnabled(), "lastHeartbeatAt" to store.lastHeartbeat()?.toDouble())
    }

    // MARK: apps & usage

    AsyncFunction("getInstalledApps") {
      AppCatalog(context).launchable().map {
        mapOf("packageName" to it.packageName, "label" to it.label, "category" to it.category)
      }
    }

    AsyncFunction("getAppIcon") { packageName: String -> AppCatalog(context).iconUri(packageName) }

    AsyncFunction("getUsageToday") {
      val repo = UsageRepository(context)
      if (!repo.hasAccess()) {
        return@AsyncFunction mapOf(
          "screenTimeMs" to 0.0, "pickups" to null, "perApp" to emptyList<Any>(), "pickupsByHour" to emptyList<Int>(),
        )
      }
      val d = repo.today()
      mapOf(
        "screenTimeMs" to d.screenTimeMs.toDouble(),
        "pickups" to d.pickups,
        "perApp" to perApp(d.perApp),
        "pickupsByHour" to d.pickupsByHour.toList(),
      )
    }

    AsyncFunction("getUsageRange") { fromDate: String, toDate: String ->
      val repo = UsageRepository(context)
      if (!repo.hasAccess()) return@AsyncFunction emptyList<Map<String, Any?>>()
      repo.range(fromDate, toDate).map { (date, d) ->
        mapOf(
          "date" to date,
          "screenTimeMs" to d.screenTimeMs.toDouble(),
          "pickups" to d.pickups,
          "perApp" to perApp(d.perApp),
        )
      }
    }

    // MARK: enforcement state

    AsyncFunction("setLocks") { locks: List<Map<String, Any?>> ->
      store.setLocks(locks.mapNotNull(::lockFromJs))
    }

    AsyncFunction("getLocks") { store.locksList().map(::lockToJs) }

    AsyncFunction("setSettings") { s: Map<String, Any?> ->
      store.setSettings(
        BlockerSettings(
          unlockMinutesGentle = (s["unlockMinutesGentle"] as? Number)?.toInt() ?: 5,
          unlockMinutesFirm = (s["unlockMinutesFirm"] as? Number)?.toInt() ?: 3,
          firmWaitSeconds = (s["firmWaitSeconds"] as? Number)?.toInt() ?: 30,
        ),
      )
    }

    AsyncFunction("startFocusSession") { endAt: Double, targetKeys: List<String> ->
      store.setFocus(FocusSession(endAt.toLong(), targetKeys.toSet()))
    }

    AsyncFunction("endFocusSession") { store.setFocus(null) }

    AsyncFunction("getTodayCounters") {
      store.todayCounters(BlockerStore.dayOf(System.currentTimeMillis())).mapValues { (_, c) ->
        mapOf("usedMs" to c.usedMs.toDouble(), "opens" to c.opens, "unlocksUsed" to c.unlocksUsed)
      }
    }

    AsyncFunction("grantUnlock") { targetKey: String, minutes: Int ->
      val now = System.currentTimeMillis()
      store.grantUnlock(BlockerStore.dayOf(now), targetKey, now + minutes * 60_000L)
    }

    AsyncFunction("openTarget") { targetKey: String ->
      UntangleAccessibilityService.instance?.expectReturn(targetKey)
      val intent = if (targetKey.startsWith("app:")) {
        context.packageManager.getLaunchIntentForPackage(targetKey.removePrefix("app:"))
      } else {
        Intent(Intent.ACTION_VIEW, Uri.parse("https://${targetKey.removePrefix("site:")}"))
      }
      intent?.let { open(it) }
    }

    AsyncFunction("goHome") {
      val done = UntangleAccessibilityService.instance?.goHome() ?: false
      if (!done) open(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME))
    }
  }

  private fun isServiceEnabled(): Boolean {
    val enabled = Settings.Secure.getString(
      context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
    ) ?: return false
    val ours = ComponentName(context, UntangleAccessibilityService::class.java)
    val splitter = TextUtils.SimpleStringSplitter(':').apply { setString(enabled) }
    return splitter.any { ComponentName.unflattenFromString(it) == ours }
  }

  private fun open(intent: Intent) {
    context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }

  private fun tryOpen(intent: Intent): Boolean {
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    if (intent.resolveActivity(context.packageManager) == null) return false
    return runCatching { context.startActivity(intent) }.isSuccess
  }

  private fun perApp(m: Map<String, Long>) =
    m.entries.sortedByDescending { it.value }.map { mapOf("packageName" to it.key, "ms" to it.value.toDouble()) }

  private fun lockFromJs(m: Map<String, Any?>): Lock? {
    val target = m["target"] as? Map<*, *> ?: return null
    val (key, label) = when (target["kind"]) {
      "app" -> {
        val pkg = target["packageName"] as? String ?: return null
        appKey(pkg) to ((target["label"] as? String) ?: pkg)
      }
      "site" -> {
        val domain = target["domain"] as? String ?: return null
        siteKey(domain) to domain
      }
      else -> return null
    }
    return Lock(
      id = m["id"] as? String ?: return null,
      targetKey = key,
      label = label,
      dailyMinutes = (m["dailyMinutes"] as? Number)?.toInt(),
      dailyOpens = (m["dailyOpens"] as? Number)?.toInt(),
      strictness = Strictness.parse(m["strictness"] as? String),
      enabled = m["enabled"] as? Boolean ?: true,
      createdAt = (m["createdAt"] as? Number)?.toLong() ?: 0L,
    )
  }

  private fun lockToJs(l: Lock): Map<String, Any?> = mapOf(
    "id" to l.id,
    "target" to if (l.targetKey.startsWith("app:")) {
      mapOf("kind" to "app", "packageName" to l.targetKey.removePrefix("app:"), "label" to l.label)
    } else {
      mapOf("kind" to "site", "domain" to l.targetKey.removePrefix("site:"))
    },
    "dailyMinutes" to l.dailyMinutes,
    "dailyOpens" to l.dailyOpens,
    "strictness" to l.strictness.js(),
    "enabled" to l.enabled,
    "createdAt" to l.createdAt.toDouble(),
  )

  private companion object {
    /** Known autostart screens per maker (02-android-platform §6). VERIFY ON DEVICE. */
    val OEM_AUTOSTART = listOf(
      "com.miui.securitycenter" to "com.miui.permcenter.autostart.AutoStartManagementActivity",
      "com.coloros.safecenter" to "com.coloros.safecenter.permission.startup.StartupAppListActivity",
      "com.oppo.safe" to "com.oppo.safe.permission.startup.StartupAppListActivity",
      "com.vivo.permissionmanager" to "com.vivo.permissionmanager.activity.BgStartUpManagerActivity",
      "com.iqoo.secure" to "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity",
      "com.huawei.systemmanager" to "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity",
      "com.letv.android.letvsafe" to "com.letv.android.letvsafe.AutobootManageActivity",
      "com.asus.mobilemanager" to "com.asus.mobilemanager.entry.FunctionActivity",
      "com.samsung.android.lool" to "com.samsung.android.sm.battery.ui.BatteryActivity",
    )
  }
}
