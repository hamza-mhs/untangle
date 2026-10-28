package com.todo.untangle.blocker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Restarts the watcher after a reboot if rules are enabled. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED) BlockerService.sync(context)
  }
}
