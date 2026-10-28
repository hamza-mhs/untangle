import SwiftUI
import WidgetKit

/// PLACEHOLDER: home (small/medium) + Lock Screen (circular/rectangular) widget showing streak,
/// Clarity and today's challenges from the shared WidgetState.
struct TodayEntry: TimelineEntry {
  let date: Date
  let state: WidgetState
}

struct TodayProvider: TimelineProvider {
  func placeholder(in context: Context) -> TodayEntry { .init(date: .now, state: .placeholder) }

  func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
    completion(.init(date: .now, state: WidgetState.load() ?? .placeholder))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
    // The app calls WidgetCenter.reloadAllTimelines() after every write; hourly is a backstop.
    let entry = TodayEntry(date: .now, state: WidgetState.load() ?? .placeholder)
    completion(Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(3600))))
  }
}

struct TodayWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: TodayEntry

  var body: some View {
    switch family {
    case .accessoryCircular:
      Gauge(value: Double(entry.state.clarity), in: 0...100) { Text("C") }
        .gaugeStyle(.accessoryCircularCapacity)
    case .accessoryRectangular:
      VStack(alignment: .leading) {
        Text("\(entry.state.streak)d streak").font(.headline)
        Text("\(entry.state.challenges.filter(\.done).count)/3 challenges")
      }
    default:
      VStack(alignment: .leading, spacing: 6) {
        Text("\(entry.state.streak)").font(.system(size: 46, weight: .light)).monospacedDigit()
        Text("day streak").font(.caption).foregroundStyle(Color("secondaryText"))
        ForEach(entry.state.challenges, id: \.id) { c in
          Label(c.title, systemImage: c.done ? "checkmark.circle.fill" : "circle")
            .font(.caption2).lineLimit(1)
            .foregroundStyle(c.done ? Color("secondaryText") : .white)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
  }
}

struct TodayWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TodayWidget", provider: TodayProvider()) { entry in
      TodayWidgetView(entry: entry)
        .containerBackground(Color.black, for: .widget)
    }
    .configurationDisplayName("Today")
    .description("Streak, Clarity and today's challenges.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
  }
}
