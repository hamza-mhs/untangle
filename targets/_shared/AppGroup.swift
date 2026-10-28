import Foundation

/// App Group shared by the app and every extension: `group.<main app bundle id>`.
/// Extensions derive the main bundle id by dropping their own last component
/// (com.TODO.untangle.dev.widgets → com.TODO.untangle.dev).
enum SharedAppGroup {
  static var id: String {
    let bundleId = Bundle.main.bundleIdentifier ?? ""
    let isExtension = Bundle.main.bundleURL.pathExtension == "appex"
    let main = isExtension ? bundleId.split(separator: ".").dropLast().joined(separator: ".") : bundleId
    return "group.\(main)"
  }
  static var defaults: UserDefaults? { UserDefaults(suiteName: id) }
}
