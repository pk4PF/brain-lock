import Foundation
import FamilyControls
import ManagedSettings

@available(iOS 16.0, *)
public class SharedDataStore {
    public static let shared = SharedDataStore()

    private let suiteName = "group.com.pk4pf.brain-lock"
    private let selectionKey = "familyActivitySelection"
    private let appsUnlockedKey = "appsUnlocked"
    private let unlockExpiresAtKey = "unlockExpiresAt"

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

    // MARK: - Unlock State
    //
    // Apps are unlocked iff `unlockExpiresAt` is in the future. The bool flag
    // is kept as a fast-read marker for JS code paths, but the truth source
    // for the DeviceActivityMonitor extension is the timestamp.

    public var appsUnlocked: Bool {
        get {
            guard let expiry = unlockExpiresAt else { return false }
            return Date() < expiry
        }
        set {
            defaults?.set(newValue, forKey: appsUnlockedKey)
            if !newValue {
                defaults?.removeObject(forKey: unlockExpiresAtKey)
            }
        }
    }

    public var unlockExpiresAt: Date? {
        get { defaults?.object(forKey: unlockExpiresAtKey) as? Date }
        set {
            if let v = newValue {
                defaults?.set(v, forKey: unlockExpiresAtKey)
            } else {
                defaults?.removeObject(forKey: unlockExpiresAtKey)
            }
        }
    }
}
