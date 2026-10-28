package com.todo.untangle.blocker

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider

/** PLACEHOLDER Jetpack Glance home-screen widget reading the shared WidgetState. */
class TangleWidget : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val state = WidgetState.load(context) ?: WidgetState.placeholder
    provideContent { Content(state) }
  }

  @Composable
  private fun Content(state: WidgetState) {
    val white = ColorProvider(Color.White)
    val grey = ColorProvider(Color(0xFF8E8E93))
    Column(
      modifier = GlanceModifier.fillMaxSize().background(Color.Black).padding(12.dp),
    ) {
      Text("${state.streak}", style = TextStyle(color = white, fontSize = 40.sp, fontWeight = FontWeight.Normal))
      Text("day streak · Clarity ${state.clarity}", style = TextStyle(color = grey, fontSize = 12.sp))
      state.challenges.take(3).forEach { c ->
        Text(
          (if (c.done) "✓ " else "○ ") + c.title,
          style = TextStyle(color = if (c.done) grey else white, fontSize = 12.sp),
          maxLines = 1,
        )
      }
      if (state.focus.active) {
        Text("Locked in", style = TextStyle(color = ColorProvider(Color(0xFFE9F21F)), fontSize = 12.sp))
      }
    }
  }
}

class TangleWidgetReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = TangleWidget()
}
