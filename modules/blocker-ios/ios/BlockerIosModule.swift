import ActivityKit
import DeviceActivity
import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI
import WidgetKit

/// JS bridge for Screen Time blocking, shared widget state and the focus Live Activity.
/// SCAFFOLD: method shapes are final-ish, bodies are minimal. Every TODO(verify) needs a real
/// device + the FamilyControls entitlement to test (it does not work on the simulator).
public class BlockerIosModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BlockerIos")

    // MARK: Authorization

    Function("getAuthorizationStatus") { () -> String in
      switch AuthorizationCenter.shared.authorizationStatus {
      case .approved: return "approved"
      case .denied: return "denied"
      default: return "notDetermined"
      }
    }

    AsyncFunction("requestAuthorization") { () async throws -> String in
      try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
      return AuthorizationCenter.shared.authorizationStatus == .approved ? "approved" : "denied"
    }

    // MARK: App picker

    /// Presents FamilyActivityPicker. Resolves with an opaque token (base64 of the encoded
    /// FamilyActivitySelection) + item count, or nil if cancelled. The app never learns *which*
    /// apps were picked — that's by Apple's design.
    AsyncFunction("presentAppPicker") { (currentToken: String?, promise: Promise) in
      let initial = currentToken.flatMap(SelectionCodec.decode) ?? FamilyActivitySelection()
      PickerPresenter.present(initial: initial) { selection in
        guard let selection else { return promise.resolve(nil) }
        promise.resolve([
          "token": SelectionCodec.encode(selection) ?? "",
          "count": selection.applicationTokens.count + selection.categoryTokens.count
            + selection.webDomainTokens.count,
        ])
      }
    }.runOnQueue(.main)

    // MARK: Rules → DeviceActivity schedules

    /// `rulesJson`: [{ id, enabled, token, start: "HH:MM", end: "HH:MM", days: [0-6], strength }]
    /// Persists rules to the App Group (the monitor extension reads them) and (re)starts
    /// monitoring. TODO(verify): one DeviceActivityName per rule+weekday is needed for
    /// day-of-week schedules — currently schedules repeat daily.
    Function("applyRules") { (rulesJson: String) in
      AppGroup.defaults?.set(rulesJson, forKey: "rules")
      let center = DeviceActivityCenter()
      center.stopMonitoring()
      guard let data = rulesJson.data(using: .utf8),
        let rules = try? JSONDecoder().decode([RuleDTO].self, from: data)
      else { return }
      for rule in rules where rule.enabled {
        let schedule = DeviceActivitySchedule(
          intervalStart: rule.startComponents,
          intervalEnd: rule.endComponents,
          repeats: true)
        try? center.startMonitoring(DeviceActivityName(rule.id), during: schedule)
      }
    }

    // MARK: Focus session

    /// Shields everything until `endsAt` and starts the Live Activity. There is no "end early".
    Function("startFocus") { (endsAt: Double, lockedCount: Int) in
      let store = ManagedSettingsStore(named: .init("focus"))
      store.shield.applicationCategories = .all()
      store.shield.webDomainCategories = .all()
      LiveActivityController.start(endsAt: Date(timeIntervalSince1970: endsAt / 1000), lockedCount: lockedCount)
      // TODO(verify): also schedule a DeviceActivity interval ending at endsAt so the monitor
      // extension clears the shield even if the app is never reopened.
    }

    Function("endFocus") {
      ManagedSettingsStore(named: .init("focus")).clearAllSettings()
      LiveActivityController.end()
    }

    Function("clearAllShields") {
      ManagedSettingsStore().clearAllSettings()
      ManagedSettingsStore(named: .init("focus")).clearAllSettings()
    }

    // MARK: Shared state (widgets, shield, Live Activity)

    Function("writeSharedState") { (json: String) in
      AppGroup.defaults?.set(json, forKey: "widgetState")
      WidgetCenter.shared.reloadAllTimelines()
    }

    Function("getAppGroupId") { () -> String? in AppGroup.id }
  }
}

// MARK: - Helpers

enum AppGroup {
  /// `group.<main app bundle id>` — must match app.config.ts.
  static var id: String? { Bundle.main.bundleIdentifier.map { "group.\($0)" } }
  static var defaults: UserDefaults? { id.flatMap(UserDefaults.init(suiteName:)) }
}

enum SelectionCodec {
  static func encode(_ s: FamilyActivitySelection) -> String? {
    (try? PropertyListEncoder().encode(s))?.base64EncodedString()
  }
  static func decode(_ token: String) -> FamilyActivitySelection? {
    guard let data = Data(base64Encoded: token) else { return nil }
    return try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
  }
}

struct RuleDTO: Decodable {
  let id: String
  let enabled: Bool
  let token: String?
  let start: String
  let end: String
  let days: [Int]
  let strength: String

  var startComponents: DateComponents { Self.components(start) }
  var endComponents: DateComponents { Self.components(end) }
  static func components(_ hhmm: String) -> DateComponents {
    let parts = hhmm.split(separator: ":").compactMap { Int($0) }
    return DateComponents(hour: parts.first ?? 0, minute: parts.count > 1 ? parts[1] : 0)
  }
}

enum PickerPresenter {
  static func present(initial: FamilyActivitySelection, done: @escaping (FamilyActivitySelection?) -> Void) {
    guard let root = UIApplication.shared.connectedScenes
      .compactMap({ ($0 as? UIWindowScene)?.keyWindow?.rootViewController }).first
    else { return done(nil) }
    var top = root
    while let presented = top.presentedViewController { top = presented }

    var host: UIViewController?
    let view = PickerSheet(selection: initial) { result in
      host?.dismiss(animated: true)
      done(result)
    }
    host = UIHostingController(rootView: view)
    top.present(host!, animated: true)
  }
}

struct PickerSheet: View {
  @State var selection: FamilyActivitySelection
  let onFinish: (FamilyActivitySelection?) -> Void

  var body: some View {
    NavigationStack {
      FamilyActivityPicker(selection: $selection)
        .toolbar {
          ToolbarItem(placement: .cancellationAction) { Button("Cancel") { onFinish(nil) } }
          ToolbarItem(placement: .confirmationAction) { Button("Done") { onFinish(selection) } }
        }
    }
  }
}
