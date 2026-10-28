import ActivityKit
import Foundation

/// MUST stay identical to modules/blocker-ios/ios/LiveActivity.swift — ActivityKit matches
/// the app's and the widget extension's types by name and Codable shape.
struct FocusActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var endsAt: Date
    var lockedCount: Int
  }
  var startedAt: Date
}

