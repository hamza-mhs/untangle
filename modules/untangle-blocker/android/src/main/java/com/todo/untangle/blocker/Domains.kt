package com.todo.untangle.blocker

/**
 * Address-bar text → registrable domain. Same rules as src/features/locks/domain.ts (keep them
 * in step): strip scheme, "www.", credentials, port, path; keep the registrable part.
 */
object Domains {
  private val MULTI_PART = setOf(
    "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "ltd.uk", "plc.uk", "net.uk",
    "com.au", "net.au", "org.au", "edu.au", "gov.au", "co.nz", "org.nz", "net.nz",
    "co.in", "net.in", "org.in", "firm.in", "gen.in", "ind.in", "com.br", "net.br", "org.br",
    "co.jp", "ne.jp", "or.jp", "ac.jp", "co.kr", "or.kr", "com.cn", "net.cn", "org.cn",
    "com.mx", "com.ar", "com.tr", "com.sg", "com.my", "com.hk", "com.tw", "com.pk", "com.ng",
    "com.eg", "com.sa", "com.ph", "com.vn", "com.co", "com.pe", "com.ua",
    "co.za", "co.id", "co.il", "co.th", "co.ke",
    "github.io", "blogspot.com", "herokuapp.com", "vercel.app", "netlify.app", "pages.dev",
  )
  private val LABEL = Regex("^(?!-)[a-z0-9-]{1,63}(?<!-)$")
  private val TLD = Regex("^[a-z]{2,63}$|^xn--[a-z0-9-]{1,59}$")

  fun registrable(input: String?): String? {
    var s = input?.trim()?.lowercase() ?: return null
    if (s.isEmpty() || s.contains(' ')) return null
    s = s.replace(Regex("^[a-z][a-z0-9+.-]*://"), "")
    s = s.split('/', '?', '#').first()
    s = s.replace(Regex("^[^@]*@"), "").replace(Regex(":\\d+$"), "").removeSuffix(".")
    if (s.startsWith("www.")) s = s.substring(4)
    val labels = s.split('.')
    if (labels.size < 2 || !labels.all { LABEL.matches(it) }) return null
    if (!TLD.matches(labels.last())) return null
    val keep = if (MULTI_PART.contains(labels.takeLast(2).joinToString("."))) 3 else 2
    if (labels.size < keep) return null
    return labels.takeLast(keep).joinToString(".")
  }
}
