import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings

/// Runs (in its own process) when a rule's schedule starts/ends. Applies or clears the shield
/// for that rule using the selection the app saved to the App Group.
/// PLACEHOLDER: strength-specific behaviour (Pause/Earn/Locked) is decided in the shield
/// action extension; this only toggles shields.
class DeviceActivityMonitorExtension: DeviceActivityMonitor {
  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)
    guard let selection = Self.selection(forRule: activity.rawValue) else { return }
    let store = ManagedSettingsStore(named: .init(activity.rawValue))
    store.shield.applications =
      selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
    store.shield.applicationCategories =
      selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens)
    store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    ManagedSettingsStore(named: .init(activity.rawValue)).clearAllSettings()
  }

  private struct RuleDTO: Decodable {
    let id: String
    let token: String?
  }

  static func selection(forRule id: String) -> FamilyActivitySelection? {
    guard let json = SharedAppGroup.defaults?.string(forKey: "rules"),
      let rules = try? JSONDecoder().decode([RuleDTO].self, from: Data(json.utf8)),
      let token = rules.first(where: { $0.id == id })?.token,
      let data = Data(base64Encoded: token)
    else { return nil }
    return try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
  }
}
