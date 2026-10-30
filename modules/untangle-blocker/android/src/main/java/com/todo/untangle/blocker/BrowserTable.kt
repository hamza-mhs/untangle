package com.todo.untangle.blocker

/**
 * Supported browsers and their address-bar view ids (02-android-platform §4.4). VERIFY ON
 * DEVICE: ids change between browser versions; fixing one is a one-line change here.
 */
object BrowserTable {
  val URL_BAR_IDS: Map<String, List<String>> = mapOf(
    "com.android.chrome" to listOf("com.android.chrome:id/url_bar"),
    "com.sec.android.app.sbrowser" to listOf("com.sec.android.app.sbrowser:id/location_bar_edit_text"),
    "org.mozilla.firefox" to listOf(
      "org.mozilla.firefox:id/mozac_browser_toolbar_url_view",
      "org.mozilla.firefox:id/url_bar_title",
    ),
    "com.microsoft.emmx" to listOf("com.microsoft.emmx:id/url_bar"),
    "com.brave.browser" to listOf("com.brave.browser:id/url_bar"),
    "com.opera.browser" to listOf("com.opera.browser:id/url_field"),
  )

  fun isBrowser(packageName: String): Boolean = URL_BAR_IDS.containsKey(packageName)
}
