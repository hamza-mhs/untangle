import DeviceActivity
import SwiftUI

/// Screen-time numbers can ONLY be rendered here. The app can't read raw usage: it embeds
/// `DeviceActivityReport(.totalActivity, filter:)` and iOS draws this extension's view inside
/// it, sandboxed (no network, no writing data back to the app or App Group).
@main
struct UntangleReport: DeviceActivityReportExtension {
  var body: some DeviceActivityReportScene {
    TotalActivityReport { totalActivity in
      TotalActivityView(totalActivity: totalActivity)
    }
  }
}

extension DeviceActivityReport.Context {
  static let totalActivity = Self("Total Activity")
}

struct TotalActivityReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .totalActivity
  let content: (String) -> TotalActivityView

  func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async
    -> String
  {
    let formatter = DateComponentsFormatter()
    formatter.allowedUnits = [.hour, .minute]
    formatter.unitsStyle = .abbreviated
    let total = await data.flatMap { $0.activitySegments }
      .reduce(0) { $0 + $1.totalActivityDuration }
    return formatter.string(from: total) ?? "0m"
  }
}

/// PLACEHOLDER UI
struct TotalActivityView: View {
  let totalActivity: String

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text("Screen time today").font(.footnote).foregroundStyle(.secondary)
      Text(totalActivity).font(.system(size: 46, weight: .light)).monospacedDigit()
    }
  }
}
