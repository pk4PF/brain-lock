Pod::Spec.new do |s|
  s.name           = 'ScreenTimeModule'
  s.version        = '1.0.0'
  s.summary        = 'Screen Time API integration for BrainLock'
  s.description    = 'Native module bridging iOS Screen Time APIs (FamilyControls, DeviceActivity, ManagedSettings) to React Native via Expo Modules'
  s.homepage       = 'https://github.com/placeholder'
  s.license        = 'MIT'
  s.author         = 'BrainLock'
  s.platform       = :ios, '16.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
  s.frameworks = 'FamilyControls', 'DeviceActivity', 'ManagedSettings'

  s.swift_version = '5.0'
end
