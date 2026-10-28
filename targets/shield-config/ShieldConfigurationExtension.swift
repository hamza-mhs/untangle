import ManagedSettings
import ManagedSettingsUI
import UIKit

/// FShieldiOS: Apple's block screen allows only an icon, a title, a subtitle and two buttons
/// (no custom layout, no breath, no "why" question: those arrive as a local notification that
/// opens the app, sent by ShieldActionExtension).
///
/// Copy and the rule's strength come from the App Group, written by the app whenever rules or
/// rewards change (keys below). VERIFY (SPEC FShieldiOS): the extension can't present UI or open
/// the app; ShieldAction can only `.close` or `.defer`.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {
  override func configuration(shielding application: Application) -> ShieldConfiguration {
    make(name: application.localizedDisplayName)
  }

  override func configuration(shielding application: Application, in category: ActivityCategory)
    -> ShieldConfiguration
  {
    make(name: application.localizedDisplayName)
  }

  override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
    make(name: webDomain.domain)
  }

  private enum Key {
    /// "pause" | "earn" | "locked": the strictest active rule (Locked > Earn > Pause).
    static let strength = "shield.strength"
    /// e.g. "Close this and you're 40 pts from Dinner out." (already localized by the app).
    static let subtitle = "shield.subtitle"
    /// Localized labels, so the extension needs no string tables of its own.
    static let titleLocked = "shield.title.locked"
    static let titlePaused = "shield.title.paused"
    static let close = "shield.button.close"
    static let spend = "shield.button.spend"
  }

  private func make(name: String?) -> ShieldConfiguration {
    let store = SharedAppGroup.defaults
    let strength = store?.string(forKey: Key.strength) ?? "pause"
    let focusActive = WidgetState.load()?.focus.active == true
    let isLocked = focusActive || strength == "locked"
    let appName = name ?? ""
    let titleFormat =
      store?.string(forKey: isLocked ? Key.titleLocked : Key.titlePaused)
      ?? (isLocked ? "%@ is locked" : "%@ is paused")
    let subtitle = store?.string(forKey: Key.subtitle) ?? ""
    // Locked (and focus): no secondary at all. Pause/Earn: "Spend 10 min" defers to the app.
    let secondary: ShieldConfiguration.Label? =
      isLocked ? nil : .init(text: store?.string(forKey: Key.spend) ?? "Spend 10 min", color: accent)
    return ShieldConfiguration(
      backgroundBlurStyle: .systemUltraThinMaterialDark,
      backgroundColor: raised,
      icon: nil,
      title: .init(text: String(format: titleFormat, appName), color: .white),
      subtitle: .init(text: subtitle, color: subtitleColor),
      primaryButtonLabel: .init(text: store?.string(forKey: Key.close) ?? "Close", color: .black),
      primaryButtonBackgroundColor: accent,
      secondaryButtonLabel: secondary)
  }

  // Mirrors src/design/tokens/colors.ts (accent.primary, bg.raised, shield.subtitle).
  private let accent = UIColor(red: 0.914, green: 0.949, blue: 0.122, alpha: 1)
  private let raised = UIColor(red: 0.110, green: 0.110, blue: 0.118, alpha: 1)
  private let subtitleColor = UIColor(red: 0.682, green: 0.682, blue: 0.698, alpha: 1)
}
