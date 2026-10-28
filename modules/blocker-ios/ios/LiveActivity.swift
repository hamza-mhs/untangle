import ActivityKit
import Foundation

/// MUST stay identical to targets/_shared/FocusActivityAttributes.swift — ActivityKit matches
/// the app's and the widget extension's types by name and Codable shape.
struct FocusActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var endsAt: Date
    var lockedCount: Int
  }
  var startedAt: Date
}

enum LiveActivityController {
  static func start(endsAt: Date, lockedCount: Int) {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
    end()
    let state = FocusActivityAttributes.ContentState(endsAt: endsAt, lockedCount: lockedCount)
    _ = try? Activity.request(
      attributes: FocusActivityAttributes(startedAt: Date()),
      content: .init(state: state, staleDate: endsAt),
      pushType: nil)
  }

  static func end() {
    Task {
      for activity in Activity<FocusActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }
}
