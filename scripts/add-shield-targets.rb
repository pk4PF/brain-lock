#!/usr/bin/env ruby
# Adds the BrainLockShield (Shield Configuration) and BrainLockShieldAction
# (Shield Action) extension targets to the Xcode project. Idempotent.
#
# Why two targets: Apple defines shield-configuration and shield-action as two
# separate extension points. Each requires its own bundle.
#
# Usage: ruby scripts/add-shield-targets.rb

require "xcodeproj"

PROJECT_PATH = File.expand_path("../ios/BrainLock.xcodeproj", __dir__)
DEPLOYMENT_TARGET = "16.0"
SWIFT_VERSION = "5.0"
APP_GROUP = "group.com.pk4pf.brain-lock"

EXTENSIONS = [
  {
    target_name: "BrainLockShield",
    bundle_id:   "com.pk4pf.brain-lock.shield",
    swift_file:  "BrainLockShieldDataSource.swift",
    entitlements: "BrainLockShield.entitlements",
  },
  {
    target_name: "BrainLockShieldAction",
    bundle_id:   "com.pk4pf.brain-lock.shieldaction",
    swift_file:  "BrainLockShieldActionHandler.swift",
    entitlements: "BrainLockShieldAction.entitlements",
  },
]

project = Xcodeproj::Project.open(PROJECT_PATH)

main_target = project.targets.find { |t| t.name == "BrainLock" } or
  abort("Could not find main 'BrainLock' target.")
main_bc = main_target.build_configurations.first
team = main_bc.build_settings["DEVELOPMENT_TEAM"]

# Reuse the existing "Embed App Extensions" copy phase added by the monitor target.
embed_phase = main_target.copy_files_build_phases.find { |p| p.name == "Embed App Extensions" }
unless embed_phase
  embed_phase = main_target.new_copy_files_build_phase("Embed App Extensions")
  embed_phase.symbol_dst_subfolder_spec = :plug_ins
end

EXTENSIONS.each do |ext|
  if project.targets.any? { |t| t.name == ext[:target_name] }
    puts "[add-shield-targets] '#{ext[:target_name]}' already exists. Skipping."
    next
  end

  ext_target = project.new_target(:app_extension, ext[:target_name], :ios, DEPLOYMENT_TARGET)

  group = project.main_group.find_subpath(ext[:target_name], true)
  group.set_source_tree("SOURCE_ROOT")
  group.set_path(ext[:target_name])

  swift_ref = group.new_reference(ext[:swift_file])
  swift_ref.last_known_file_type = "sourcecode.swift"
  ext_target.source_build_phase.add_file_reference(swift_ref, true)

  group.new_reference("Info.plist")
  group.new_reference(ext[:entitlements])

  ext_target.build_configurations.each do |bc|
    s = bc.build_settings
    s["PRODUCT_BUNDLE_IDENTIFIER"] = ext[:bundle_id]
    s["PRODUCT_NAME"] = "$(TARGET_NAME)"
    s["INFOPLIST_FILE"] = "#{ext[:target_name]}/Info.plist"
    s["CODE_SIGN_ENTITLEMENTS"] = "#{ext[:target_name]}/#{ext[:entitlements]}"
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
  end

  build_file = embed_phase.add_file_reference(ext_target.product_reference, true)
  build_file.settings = { "ATTRIBUTES" => ["RemoveHeadersOnCopy"] }

  main_target.add_dependency(ext_target)

  puts "[add-shield-targets] Added '#{ext[:target_name]}' (#{ext[:bundle_id]})."
end

project.save

puts ""
puts "Done. Verify in Xcode:"
puts "  - Open ios/BrainLock.xcworkspace"
puts "  - For each new target, Signing & Capabilities should show:"
puts "    - Family Controls"
puts "    - App Groups (#{APP_GROUP})"
puts "  - Build > Clean, then run on a real device (simulator can't test FamilyControls)"
