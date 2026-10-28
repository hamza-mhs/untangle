package com.todo.untangle.blocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.util.Base64
import androidx.glance.appwidget.updateAll
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

/**
 * JS bridge: permissions, installed apps, rules → watcher service, focus notification, shared
 * state for widgets. SCAFFOLD — needs a real device to exercise usage access.
 */
class BlockerAndroidModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No React context")

  override fun definition() = ModuleDefinition {
    Name("BlockerAndroid")

    // MARK: Permissions

    Function("getPermissions") {
      mapOf(
        "usageAccess" to hasUsageAccess(context),
        "overlay" to Settings.canDrawOverlays(context),
      )
    }

    Function("openUsageAccessSettings") {
      context.startActivity(
        Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }

    Function("openOverlaySettings") {
      context.startActivity(
        Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }

    // MARK: Installed apps

    /** Launchable apps (excluding ourselves) with a PNG data-URI icon. */
    AsyncFunction("getInstalledApps") {
      val pm = context.packageManager
      val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      pm.queryIntentActivities(launcher, 0)
        .filter { it.activityInfo.packageName != context.packageName }
        .distinctBy { it.activityInfo.packageName }
        .map { info ->
          mapOf(
            "packageName" to info.activityInfo.packageName,
            "label" to info.loadLabel(pm).toString(),
            "icon" to iconDataUri(info.loadIcon(pm)),
          )
        }
        .sortedBy { (it["label"] as String).lowercase() }
    }

    // MARK: Rules

    /** `rulesJson`: [{ id, enabled, packages, start, end, days, strength }] */
    Function("applyRules") { rulesJson: String ->
      SharedStore.prefs(context).edit().putString(SharedStore.KEY_RULES, rulesJson).apply()
      BlockerService.sync(context)
    }

    // MARK: Focus

    Function("startFocus") { endsAt: Double, _: Int ->
      SharedStore.prefs(context).edit().putLong(SharedStore.KEY_FOCUS_ENDS_AT, endsAt.toLong()).apply()
      BlockerService.sync(context)
    }

    Function("endFocus") {
      SharedStore.prefs(context).edit().remove(SharedStore.KEY_FOCUS_ENDS_AT).apply()
      BlockerService.sync(context)
    }

    // MARK: Shared state

    AsyncFunction("writeSharedState") Coroutine { json: String ->
      SharedStore.prefs(context).edit().putString(WidgetState.KEY, json).apply()
      TangleWidget().updateAll(context)
    }
  }

  companion object {
    fun hasUsageAccess(context: Context): Boolean {
      val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      } else {
        @Suppress("DEPRECATION")
        ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      }
      return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun iconDataUri(drawable: android.graphics.drawable.Drawable): String {
      val size = 96
      val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap)
      drawable.setBounds(0, 0, size, size)
      drawable.draw(canvas)
      val out = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
      return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    }
  }
}
