#!/usr/bin/env ruby
# Adds the BrainLockMonitor DeviceActivityMonitor extension target to the
# Xcode project. Idempotent: re-running has no effect if the target exists.
#
# Usage: ruby scripts/add-monitor-target.rb

require "xcodeproj"

PROJECT_PATH = File.expand_path("../ios/BrainLock.xcodeproj", __dir__)
TARGET_NAME = "BrainLockMonitor"
BUNDLE_ID = "com.pk4pf.brain-lock.monitor"
DEPLOYMENT_TARGET = "16.0"
SWIFT_VERSION = "5.0"
EXTENSION_DIR = File.expand_path("../ios/BrainLockMonitor", __dir__)

project = Xcodeproj::Project.open(PROJECT_PATH)

# Idempotency: if the target already exists, exit cleanly.
if project.targets.any? { |t| t.name == TARGET_NAME }
  puts "[add-monitor-target] Target '#{TARGET_NAME}' already exists. Nothing to do."
  exit 0
end

main_target = project.targets.find { |t| t.name == "BrainLock" } or
  abort("Could not find main 'BrainLock' target.")

main_bc = main_target.build_configurations.first
team = main_bc.build_settings["DEVELOPMENT_TEAM"]

# 1. Create the new app-extension target.
ext_target = project.new_target(
  :app_extension,
  TARGET_NAME,
  :ios,
  DEPLOYMENT_TARGET,
)

# 2. Wire up source / Info.plist / entitlements files in the project tree.
group = project.main_group.find_subpath(TARGET_NAME, true)
group.set_source_tree("SOURCE_ROOT")
group.set_path(TARGET_NAME)

# Add the Swift source file to the target's compile-sources phase.
swift_ref = group.new_reference("BrainLockDeviceActivityMonitor.swift")
swift_ref.last_known_file_type = "sourcecode.swift"
ext_target.source_build_phase.add_file_reference(swift_ref, true)

# Info.plist is referenced via INFOPLIST_FILE — file reference for navigation only.
group.new_reference("Info.plist")

# Entitlements are referenced via CODE_SIGN_ENTITLEMENTS — file reference for navigation only.
group.new_reference("BrainLockMonitor.entitlements")

# 3. Build settings for both Debug and Release configurations.
ext_target.build_configurations.each do |bc|
  s = bc.build_settings
  s["PRODUCT_BUNDLE_IDENTIFIER"] = BUNDLE_ID
  s["PRODUCT_NAME"] = "$(TARGET_NAME)"
  s["INFOPLIST_FILE"] = "#{TARGET_NAME}/Info.plist"
  s["CODE_SIGN_ENTITLEMENTS"] = "#{TARGET_NAME}/BrainLockMonitor.entitlements"
  s["IPHONEOS_DEPLOYMENT_TARGET"] = DEPLOYMENT_TARGET
  s["SWIFT_VERSION"] = SWIFT_VERSION
  s["TARGETED_DEVICE_FAMILY"] = "1,2"
  s["LD_RUNPATH_SEARCH_PATHS"] = "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"
  s["DEVELOPMENT_TEAM"] = team if team
  s["CODE_SIGN_STYLE"] = "Automatic"
  s["SKIP_INSTALL"] = "YES"
  s["GENERATE_INFOPLIST_FILE"] = "NO"
  s["CURRENT_PROJECT_VERSION"] = "1"
  s["MARKETING_VERSION"] = "1.0"
  s["ENABLE_BITCODE"] = "NO"
  # The DeviceActivity extension uses the same provisioning approach as the main app.
  # Family Controls + App Groups capabilities live in the .entitlements file.
end

# 4. Embed the extension in the main app via a "Copy Files" build phase.
embed_phase = main_target.copy_files_build_phases.find { |p| p.name == "Embed App Extensions" }
unless embed_phase
  embed_phase = main_target.new_copy_files_build_phase("Embed App Extensions")
  embed_phase.symbol_dst_subfolder_spec = :plug_ins
end
ext_product_ref = ext_target.product_reference
build_file = embed_phase.add_file_reference(ext_product_ref, true)
build_file.settings = { "ATTRIBUTES" => ["RemoveHeadersOnCopy"] }

# 5. Make the main app depend on the extension so it builds first.
main_target.add_dependency(ext_target)

project.save

puts "[add-monitor-target] Successfully added '#{TARGET_NAME}' target."
puts "  Bundle ID: #{BUNDLE_ID}"
puts "  Source: #{EXTENSION_DIR}"
puts ""
puts "Next steps:"
puts "  1. Open ios/BrainLock.xcworkspace in Xcode and verify the new target appears"
puts "  2. Confirm 'Family Controls' + 'App Groups' show up under Signing & Capabilities"
puts "  3. Bump buildNumber in app.config.js"
puts "  4. eas build --profile preview --platform ios"
