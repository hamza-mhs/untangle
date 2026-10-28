import Foundation
import ManagedSettings
import UserNotifications

/// FShieldiOS buttons. ShieldAction can only `.close` or `.defer` (no UI, can't open the app):
///   Close        → `.close`, logged as an opens-resisted event.
///   Spend 10 min → `.defer`, logged as a spend request in the App Group, plus a local
///                  notification that opens the app, which grants the time (and asks the
///                  breath / "why" question there).
/// Events land in the App Group under "shield.events" for Home's "Opens resisted" card.
class ShieldActionExtension: ShieldActionDelegate {
  override func handle(
    action: ShieldAction, for application: ApplicationToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    completionHandler(respond(action, appId: String(application.hashValue)))
  }

  override func handle(
    action: ShieldAction, for webDomain: WebDomainToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    completionHandler(respond(action, appId: String(webDomain.hashValue)))
  }

  override func handle(
    action: ShieldAction, for category: ActivityCategoryToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    completionHandler(respond(action, appId: String(category.hashValue)))
  }

  private func respond(_ action: ShieldAction, appId: String) -> ShieldActionResponse {
    let store = SharedAppGroup.defaults
    let strength = store?.string(forKey: "shield.strength") ?? "pause"
    let ruleId = store?.string(forKey: "shield.ruleId") ?? ""
    switch action {
    case .primaryButtonPressed:
      log(appId: appId, ruleId: ruleId, strength: strength, outcome: "closed")
      return .close
    case .secondaryButtonPressed:
      log(appId: appId, ruleId: ruleId, strength: strength, outcome: "spent")
      store?.set(Date().timeIntervalSince1970 * 1000, forKey: "shield.spendRequestedAt")
      notifyApp(store: store)
      return .defer
    @unknown default:
      return .close
    }
  }

  private func log(appId: String, ruleId: String, strength: String, outcome: String) {
    guard let store = SharedAppGroup.defaults else { return }
    var events = store.array(forKey: "shield.events") as? [[String: Any]] ?? []
    events.append([
      "at": Date().timeIntervalSince1970 * 1000, "appId": appId, "ruleId": ruleId,
      "strength": strength, "outcome": outcome,
    ])
    // Keep two weeks at most; the app copies them into SQLite on foreground.
    store.set(Array(events.suffix(2000)), forKey: "shield.events")
  }

  private func notifyApp(store: UserDefaults?) {
    let content = UNMutableNotificationContent()
    content.title = store?.string(forKey: "shield.notify.title") ?? "Spend 10 minutes?"
    content.body = store?.string(forKey: "shield.notify.body") ?? "Open Untangle to take a breath first."
    content.userInfo = ["url": "untangle://shield/spend"]
    let request = UNNotificationRequest(
      identifier: "shield.spend", content: content,
      trigger: UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false))
    UNUserNotificationCenter.current().add(request)
  }
}
