Pod::Spec.new do |s|
  s.name           = 'BlockerIos'
  s.version        = '0.1.0'
  s.summary        = 'Untangle: Screen Time blocking, shared widget state, Live Activity'
  s.description    = 'FamilyControls / ManagedSettings / DeviceActivity bridge for Untangle.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  # FamilyControls .individual authorization needs iOS 16; Live Activities need 16.1.
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'FamilyControls', 'ManagedSettings', 'DeviceActivity', 'ActivityKit', 'WidgetKit', 'SwiftUI'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
