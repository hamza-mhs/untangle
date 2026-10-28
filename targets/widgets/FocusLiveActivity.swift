import ActivityKit
import SwiftUI
import WidgetKit

/// PLACEHOLDER: Lock Screen banner + Dynamic Island for a running focus session.
struct FocusLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: FocusActivityAttributes.self) { context in
      HStack {
        Image(systemName: "lock.fill").foregroundStyle(Color("primary"))
        VStack(alignment: .leading) {
          Text("Locked in").font(.headline)
          Text("\(context.state.lockedCount) apps locked").font(.caption)
            .foregroundStyle(Color("secondaryText"))
        }
        Spacer()
        Text(timerInterval: Date.now...context.state.endsAt, countsDown: true)
          .font(.system(size: 34, weight: .light)).monospacedDigit()
          .multilineTextAlignment(.trailing)
      }
      .padding()
      .activityBackgroundTint(.black)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Image(systemName: "lock.fill").foregroundStyle(Color("primary"))
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(timerInterval: Date.now...context.state.endsAt, countsDown: true).monospacedDigit()
        }
        DynamicIslandExpandedRegion(.bottom) {
          Text("\(context.state.lockedCount) apps locked").font(.caption)
        }
      } compactLeading: {
        Image(systemName: "lock.fill").foregroundStyle(Color("primary"))
      } compactTrailing: {
        Text(timerInterval: Date.now...context.state.endsAt, countsDown: true)
          .monospacedDigit().frame(width: 44)
      } minimal: {
        Image(systemName: "lock.fill").foregroundStyle(Color("primary"))
      }
    }
  }
}
