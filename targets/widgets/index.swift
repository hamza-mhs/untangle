import SwiftUI
import WidgetKit

@main
struct UntangleWidgetBundle: WidgetBundle {
  var body: some Widget {
    TodayWidget()
    FocusLiveActivity()
  }
}
