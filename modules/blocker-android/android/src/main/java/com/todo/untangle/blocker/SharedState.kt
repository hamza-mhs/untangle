package com.todo.untangle.blocker

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * Kotlin mirror of shared/widgetState.ts. Keep field names identical (a Jest test checks).
 * Readers ignore unknown fields so newer app versions don't break older widgets.
 */
data class WidgetChallenge(val id: String, val title: String, val done: Boolean)

data class FocusInfo(val active: Boolean, val endsAt: Long?, val lockedCount: Int)

data class WidgetState(
  val version: Int,
  val tangleProgress: Double,
  val clarity: Int,
  val streak: Int,
  val challenges: List<WidgetChallenge>,
  val focus: FocusInfo,
  val rulesActive: Int,
  val blockingHealthy: Boolean,
  val updatedAt: Long,
) {
  companion object {
    const val KEY = "widgetState"

    val placeholder = WidgetState(
      version = 1, tangleProgress = 0.0, clarity = 0, streak = 0, challenges = emptyList(),
      focus = FocusInfo(false, null, 0), rulesActive = 0, blockingHealthy = true, updatedAt = 0,
    )

    fun parse(json: String): WidgetState? = runCatching {
      val o = JSONObject(json)
      val f = o.getJSONObject("focus")
      val list = o.optJSONArray("challenges") ?: JSONArray()
      WidgetState(
        version = o.getInt("version"),
        tangleProgress = o.getDouble("tangleProgress"),
        clarity = o.getInt("clarity"),
        streak = o.getInt("streak"),
        challenges = (0 until list.length()).map {
          val c = list.getJSONObject(it)
          WidgetChallenge(c.getString("id"), c.getString("title"), c.getBoolean("done"))
        },
        focus = FocusInfo(
          active = f.getBoolean("active"),
          endsAt = if (f.isNull("endsAt")) null else f.getLong("endsAt"),
          lockedCount = f.getInt("lockedCount"),
        ),
        rulesActive = o.getInt("rulesActive"),
        blockingHealthy = o.getBoolean("blockingHealthy"),
        updatedAt = o.getLong("updatedAt"),
      )
    }.getOrNull()

    fun load(context: Context): WidgetState? =
      SharedStore.prefs(context).getString(KEY, null)?.let(::parse)
  }
}

/** Shared storage read by the service, block screen and widgets. */
object SharedStore {
  private const val FILE = "untangle.shared"
  const val KEY_RULES = "rules"
  const val KEY_FOCUS_ENDS_AT = "focusEndsAt"

  fun prefs(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE)
}

/** Mirror of the JS rule payload sent to applyRules. */
data class RuleDTO(
  val id: String,
  val enabled: Boolean,
  val packages: List<String>,
  val start: String,
  val end: String,
  val days: List<Int>,
  val strength: String,
) {
  companion object {
    fun parseList(json: String?): List<RuleDTO> = runCatching {
      val arr = JSONArray(json ?: "[]")
      (0 until arr.length()).map { i ->
        val o = arr.getJSONObject(i)
        val pkgs = o.optJSONArray("packages") ?: JSONArray()
        val days = o.optJSONArray("days") ?: JSONArray()
        RuleDTO(
          id = o.getString("id"),
          enabled = o.getBoolean("enabled"),
          packages = (0 until pkgs.length()).map(pkgs::getString),
          start = o.getString("start"),
          end = o.getString("end"),
          days = (0 until days.length()).map(days::getInt),
          strength = o.getString("strength"),
        )
      }
    }.getOrDefault(emptyList())
  }
}
