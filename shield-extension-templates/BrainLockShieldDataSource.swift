import ManagedSettings
import ManagedSettingsUI
import UIKit

// Brand colour: #E53935 (DESIGN.md `accent`).
private let accentRed = UIColor(red: 0.898, green: 0.224, blue: 0.208, alpha: 1.0)

class BrainLockShieldDataSource: ShieldConfigurationDataSource {

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        brainLockShield()
    }

    override func configuration(shielding application: Application,
                                in category: ActivityCategory) -> ShieldConfiguration {
        brainLockShield()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        brainLockShield()
    }

    override func configuration(shielding webDomain: WebDomain,
                                in category: ActivityCategory) -> ShieldConfiguration {
        brainLockShield()
    }

    private func brainLockShield() -> ShieldConfiguration {
        ShieldConfiguration(
            backgroundBlurStyle: .systemMaterial,
            backgroundColor: accentRed,
            icon: UIImage(named: "ShieldIcon"),
            title: ShieldConfiguration.Label(
                text: "Locked by Brainlock",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Earn brain cells in Brainlock to unlock.",
                color: UIColor.white.withAlphaComponent(0.85)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Open Brainlock",
                color: accentRed
            ),
            primaryButtonBackgroundColor: .white,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Close",
                color: UIColor.white.withAlphaComponent(0.9)
            )
        )
    }
}
