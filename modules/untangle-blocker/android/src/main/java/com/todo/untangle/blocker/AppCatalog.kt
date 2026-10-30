package com.todo.untangle.blocker

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.os.Build
import java.io.File
import java.io.FileOutputStream

/**
 * Installed launchable apps (the launcher query in the manifest; no QUERY_ALL_PACKAGES) and
 * their icons, cached as PNG files so JS can show them by file:// URI.
 */
class AppCatalog(private val context: Context) {
  data class App(val packageName: String, val label: String, val category: String?)

  fun launchable(): List<App> {
    val pm = context.packageManager
    val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    return pm.queryIntentActivities(launcher, 0)
      .map { it.activityInfo }
      .filter { it.packageName != context.packageName }
      .distinctBy { it.packageName }
      .map { info ->
        App(info.packageName, info.loadLabel(pm).toString(), categoryName(info.applicationInfo))
      }
      .sortedBy { it.label.lowercase() }
  }

  fun isInstalled(packageName: String): Boolean =
    runCatching { context.packageManager.getApplicationInfo(packageName, 0) }.isSuccess

  fun label(packageName: String): String? = runCatching {
    val pm = context.packageManager
    pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
  }.getOrNull()

  /** file:// URI of a cached 96 px PNG, or null when the app has no readable icon. */
  fun iconUri(packageName: String): String? {
    val dir = File(context.cacheDir, "app-icons").apply { mkdirs() }
    val file = File(dir, "$packageName.png")
    if (file.exists() && file.length() > 0) return file.toURI().toString()
    return runCatching {
      val drawable = context.packageManager.getApplicationIcon(packageName)
      FileOutputStream(file).use { toBitmap(drawable).compress(Bitmap.CompressFormat.PNG, 100, it) }
      file.toURI().toString()
    }.getOrNull()
  }

  private fun toBitmap(d: Drawable, px: Int = 96): Bitmap {
    val bmp = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bmp)
    d.setBounds(0, 0, px, px)
    d.draw(canvas)
    return bmp
  }

  private fun categoryName(info: ApplicationInfo): String? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return null
    return when (info.category) {
      ApplicationInfo.CATEGORY_GAME -> "game"
      ApplicationInfo.CATEGORY_AUDIO -> "audio"
      ApplicationInfo.CATEGORY_VIDEO -> "video"
      ApplicationInfo.CATEGORY_IMAGE -> "image"
      ApplicationInfo.CATEGORY_SOCIAL -> "social"
      ApplicationInfo.CATEGORY_NEWS -> "news"
      ApplicationInfo.CATEGORY_MAPS -> "maps"
      ApplicationInfo.CATEGORY_PRODUCTIVITY -> "productivity"
      else -> null
    }
  }
}
