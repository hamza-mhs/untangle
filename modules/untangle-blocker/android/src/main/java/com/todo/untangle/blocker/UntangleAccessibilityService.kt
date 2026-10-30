package com.todo.untangle.blocker

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Watches which app (and, in supported browsers, which site) is in front, counts time and opens
 * for locked targets, and opens the pause screen when a lock says so (02-android-platform §1).
 *
 * Battery: no polling. The only timers are the 15 s accumulate tick while a target is in front,
 * one `nextCheckAt`, and a 60 s heartbeat while the screen is on (§4.5).
 */
class UntangleAccessibilityService : AccessibilityService() {
  private lateinit var store: BlockerStore
  private lateinit var tracker: Tracker
  private val main = Handler(Looper.getMainLooper())
  private var homePackages: Set<String> = emptySet()
  private var lastUrlReadAt = 0L
  private var lastPackage: String? = null
  private var lastBlockKey: String? = null
  private var lastBlockAt = 0L
  /** Set by grantUnlock + openTarget: the next arrival of this target is not a new open. */
  private var returningKey: String? = null

  private val tick = object : Runnable {
    override fun run() {
      handle(tracker.onTick(System.currentTimeMillis()))
      if (tracker.current != null) main.postDelayed(this, TICK_MS)
    }
  }
  private val nextCheck = Runnable { handle(tracker.onTick(System.currentTimeMillis())) }
  private val heartbeat = object : Runnable {
    override fun run() {
      store.heartbeat(System.currentTimeMillis())
      main.postDelayed(this, HEARTBEAT_MS)
    }
  }

  private val screenReceiver = object : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
      val now = System.currentTimeMillis()
      when (i.action) {
        Intent.ACTION_SCREEN_OFF -> {
          tracker.onScreenOff(now)
          main.removeCallbacks(tick)
          main.removeCallbacks(heartbeat)
        }
        Intent.ACTION_USER_PRESENT, Intent.ACTION_SCREEN_ON -> {
          handle(tracker.onScreenOn(now))
          main.removeCallbacks(heartbeat)
          main.post(heartbeat)
          if (tracker.current != null) {
            main.removeCallbacks(tick)
            main.postDelayed(tick, TICK_MS)
          }
        }
      }
    }
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    store = BlockerStore.get(this)
    tracker = Tracker(store, BlockerStore::dayOf)
    homePackages = resolveHomePackages()
    instance = this
    registerReceiver(screenReceiver, IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_OFF)
      addAction(Intent.ACTION_SCREEN_ON)
      addAction(Intent.ACTION_USER_PRESENT)
    })
    main.post(heartbeat)
  }

  override fun onDestroy() {
    instance = null
    main.removeCallbacksAndMessages(null)
    runCatching { unregisterReceiver(screenReceiver) }
    if (::tracker.isInitialized) tracker.flush(System.currentTimeMillis())
    super.onDestroy()
  }

  override fun onInterrupt() {}

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val e = event ?: return
    val pkg = e.packageName?.toString() ?: return
    when (e.eventType) {
      AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> onWindow(pkg)
      AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
        // Only browsers matter here, and at most every 500 ms (§4.4).
        if (pkg == lastPackage && BrowserTable.isBrowser(pkg)) {
          val t = SystemClock.uptimeMillis()
          if (t - lastUrlReadAt >= URL_THROTTLE_MS) {
            lastUrlReadAt = t
            onWindow(pkg)
          }
        }
      }
    }
  }

  private fun onWindow(pkg: String) {
    if (ignored(pkg)) return
    lastPackage = pkg
    val key = targetFor(pkg)
    val now = System.currentTimeMillis()
    val fromPause = key != null && key == returningKey
    if (fromPause) returningKey = null
    val decision = tracker.onForeground(key, now, fromPause)
    main.removeCallbacks(tick)
    if (tracker.current != null) main.postDelayed(tick, TICK_MS)
    handle(decision)
  }

  /** Our own app (pause screen included), system UI and the keyboard never change the target. */
  private fun ignored(pkg: String): Boolean {
    if (pkg == "com.android.systemui") return true
    val ime = Settings.Secure.getString(contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD)
    return ime != null && ime.startsWith("$pkg/")
  }

  private fun targetFor(pkg: String): String? {
    if (pkg == packageName || homePackages.contains(pkg)) return null
    if (BrowserTable.isBrowser(pkg)) {
      val domain = readUrl(pkg)?.let(Domains::registrable) ?: return null
      // Subdomains match their parent lock: registrable() already maps m.reddit.com → reddit.com.
      return siteKey(domain)
    }
    return appKey(pkg)
  }

  private fun readUrl(pkg: String): String? {
    val root = rootInActiveWindow ?: return null
    val ids = BrowserTable.URL_BAR_IDS[pkg] ?: return null
    for (id in ids) {
      val nodes: List<AccessibilityNodeInfo> = root.findAccessibilityNodeInfosByViewId(id) ?: continue
      val text = nodes.firstOrNull()?.text?.toString()
      if (!text.isNullOrBlank()) return text
    }
    return null
  }

  private fun handle(d: Decision?) {
    main.removeCallbacks(nextCheck)
    when (d) {
      is Decision.Allow -> d.nextCheckAt?.let {
        main.postDelayed(nextCheck, (it - System.currentTimeMillis()).coerceAtLeast(0) + 50)
      }
      is Decision.Block -> tracker.current?.let { showPause(it, d.reason) }
      null -> {}
    }
  }

  /** §4.3: the pause screen opens over the blocked app (deep link into the app, v1 fallback). */
  private fun showPause(key: String, reason: BlockReason) {
    val now = SystemClock.uptimeMillis()
    if (key == lastBlockKey && now - lastBlockAt < BLOCK_DEBOUNCE_MS) return
    lastBlockKey = key
    lastBlockAt = now
    val day = BlockerStore.dayOf(System.currentTimeMillis())
    val lock = store.locks[key]
    val c = store.counters(day, key)
    val uri = Uri.parse("$SCHEME://pause").buildUpon()
      .appendQueryParameter("targetKey", key)
      .appendQueryParameter("reason", reason.name.lowercase())
      .appendQueryParameter("label", lock?.label ?: key.substringAfter(':'))
      .appendQueryParameter("lockId", lock?.id ?: "")
      .appendQueryParameter("strictness", (lock?.strictness ?: Strictness.GENTLE).js())
      .appendQueryParameter("opensToday", c.opens.toString())
      .appendQueryParameter("usedMs", c.usedMs.toString())
      .appendQueryParameter("minutesAllowed", lock?.dailyMinutes?.toString() ?: "")
      .appendQueryParameter("opensAllowed", lock?.dailyOpens?.toString() ?: "")
      .appendQueryParameter("unlocksUsed", c.unlocksUsed.toString())
      .build()
    val intent = Intent(Intent.ACTION_VIEW, uri).setPackage(packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_NO_ANIMATION)
    runCatching { startActivity(intent) }
    onBlocked?.invoke(mapOf("targetKey" to key, "reason" to reason.name.lowercase()))
  }

  private fun resolveHomePackages(): Set<String> {
    val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
    return packageManager.queryIntentActivities(home, 0).map { it.activityInfo.packageName }.toSet()
  }

  fun goHome(): Boolean = performGlobalAction(GLOBAL_ACTION_HOME)

  fun expectReturn(key: String) {
    returningKey = key
    lastBlockKey = null
  }

  fun currentKey(): String? = if (::tracker.isInitialized) tracker.current else null

  companion object {
    private const val TICK_MS = 15_000L
    private const val HEARTBEAT_MS = 60_000L
    private const val URL_THROTTLE_MS = 500L
    private const val BLOCK_DEBOUNCE_MS = 1_500L
    /** The app's URL scheme (app.config.ts `scheme`). */
    const val SCHEME = "untangle"

    @Volatile var instance: UntangleAccessibilityService? = null
      private set

    /** Set by the JS bridge while the app is running. */
    @Volatile var onBlocked: ((Map<String, Any?>) -> Unit)? = null
  }
}
