import Foundation

/// Swift mirror of shared/widgetState.ts. Keep field names identical (a Jest test checks).
struct WidgetState: Codable {
  struct Challenge: Codable, Hashable {
    var id: String
    var title: String
    var done: Bool
  }
  struct Focus: Codable {
    var active: Bool
    var endsAt: Double?
    var lockedCount: Int
  }

  var version: Int
  var tangleProgress: Double
  var clarity: Int
  var streak: Int
  var challenges: [Challenge]
  var focus: Focus
  var rulesActive: Int
  var blockingHealthy: Bool
  var updatedAt: Double

  static let key = "widgetState"

  static let placeholder = WidgetState(
    version: 1, tangleProgress: 0.33, clarity: 62, streak: 4,
    challenges: [
      .init(id: "a", title: "Walk 2,000 steps", done: true),
      .init(id: "b", title: "Lock in for 25 minutes", done: false),
      .init(id: "c", title: "Phone-free dinner", done: false),
    ],
    focus: .init(active: false, endsAt: nil, lockedCount: 0),
    rulesActive: 1, blockingHealthy: true, updatedAt: 0)

  static func load() -> WidgetState? {
    guard let json = SharedAppGroup.defaults?.string(forKey: key),
      let data = json.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(WidgetState.self, from: data)
  }
}
