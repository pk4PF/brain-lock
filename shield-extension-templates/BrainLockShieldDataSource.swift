import ManagedSettings
import ManagedSettingsUI
import UIKit

// Brand orange — warm, high-energy, matches the app accent.
private let brandOrange = UIColor(red: 0.949, green: 0.400, blue: 0.055, alpha: 1.0) // #F2660E

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
            backgroundBlurStyle: .systemThickMaterial,
            backgroundColor: brandOrange,
            icon: UIImage(named: "ShieldIcon"),
            title: ShieldConfiguration.Label(
                text: "This app is locked.",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Pass a test in Brainlock to unlock it.",
                color: UIColor.white.withAlphaComponent(0.85)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Open Brainlock",
                color: brandOrange
            ),
            primaryButtonBackgroundColor: .white,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Go back",
                color: UIColor.white.withAlphaComponent(0.9)
            )
        )
    }
}
