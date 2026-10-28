package com.todo.untangle.blocker

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Full-screen block screen. PLACEHOLDER native UI (Android lets us draw anything here, so it
 * can later match the design or host a React Native surface).
 * TODO: Pause = 10 s breath then "open for 5 min"; Earn = spend minutes; Locked = no unlock.
 */
class BlockActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val strength = intent.getStringExtra(EXTRA_STRENGTH) ?: "pause"

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setBackgroundColor(Color.BLACK)
      setPadding(64, 64, 64, 64)
    }
    root.addView(TextView(this).apply {
      text = if (strength == "focus") "Locked in" else "Untangle"
      textSize = 28f
      setTextColor(Color.WHITE)
      gravity = Gravity.CENTER
    })
    root.addView(TextView(this).apply {
      text = when (strength) {
        "focus" -> "This ends when the timer does."
        "locked" -> "Locked until this rule ends."
        "earn" -> "Spend earned minutes to open."
        else -> "Take a 10-second breath first."
      }
      textSize = 16f
      setTextColor(Color.parseColor("#8E8E93"))
      gravity = Gravity.CENTER
    })
    root.addView(Button(this).apply {
      text = "Close app"
      setBackgroundColor(Color.parseColor("#E9F21F"))
      setTextColor(Color.BLACK)
      setOnClickListener { goHome() }
    })
    setContentView(root)
  }

  @Deprecated("Back always goes home from the block screen")
  override fun onBackPressed() = goHome()

  private fun goHome() {
    startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    finish()
  }

  companion object {
    const val EXTRA_PACKAGE = "package"
    const val EXTRA_STRENGTH = "strength"
  }
}
