import Foundation
import FamilyControls
import ManagedSettings

@available(iOS 16.0, *)
public class SharedDataStore {
    public static let shared = SharedDataStore()

    private let suiteName = "group.com.pk4pf.brain-lock"
    private let selectionKey = "familyActivitySelection"
    private let scheduleStartHourKey = "scheduleStartHour"
    private let scheduleStartMinuteKey = "scheduleStartMinute"
    private let scheduleEndHourKey = "scheduleEndHour"
    private let scheduleEndMinuteKey = "scheduleEndMinute"
    private let scheduleEnabledKey = "scheduleEnabled"

    private var defaults: UserDefaults? {
        UserDefaults(suiteName: suiteName)
    }

    // MARK: - Selection

    public var savedSelection: FamilyActivitySelection {
        get {
            guard let data = defaults?.data(forKey: selectionKey) else {
                return FamilyActivitySelection()
            }
            return (try? PropertyListDecoder().decode(
                FamilyActivitySelection.self, from: data
            )) ?? FamilyActivitySelection()
        }
        set {
            let data = try? PropertyListEncoder().encode(newValue)
            defaults?.set(data, forKey: selectionKey)
        }
    }

    // MARK: - Schedule

    public var scheduleStartHour: Int {
        get { defaults?.integer(forKey: scheduleStartHourKey) ?? 0 }
        set { defaults?.set(newValue, forKey: scheduleStartHourKey) }
    }

    public var scheduleStartMinute: Int {
        get { defaults?.integer(forKey: scheduleStartMinuteKey) ?? 0 }
        set { defaults?.set(newValue, forKey: scheduleStartMinuteKey) }
    }

    public var scheduleEndHour: Int {
        get { defaults?.integer(forKey: scheduleEndHourKey) ?? 23 }
        set { defaults?.set(newValue, forKey: scheduleEndHourKey) }
    }

    public var scheduleEndMinute: Int {
        get { defaults?.integer(forKey: scheduleEndMinuteKey) ?? 59 }
        set { defaults?.set(newValue, forKey: scheduleEndMinuteKey) }
    }

    public var scheduleEnabled: Bool {
        get { defaults?.bool(forKey: scheduleEnabledKey) ?? false }
        set { defaults?.set(newValue, forKey: scheduleEnabledKey) }
    }
}
