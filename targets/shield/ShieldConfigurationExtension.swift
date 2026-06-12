import ManagedSettings
import ManagedSettingsUI
import UIKit

// Brand palette.
private let brandOrange = UIColor(red: 0.949, green: 0.400, blue: 0.055, alpha: 1.0) // #F2660E
// Slightly deeper orange for text on white — reads cleaner than #F2660E on white.
private let deepOrange = UIColor(red: 0.831, green: 0.325, blue: 0.039, alpha: 1.0)  // #D4530A

// Principal class name MUST be `ShieldConfigurationExtension` — the
// @bacons/apple-targets generated Info.plist points NSExtensionPrincipalClass
// at $(PRODUCT_MODULE_NAME).ShieldConfigurationExtension.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {

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
        // No blur style → solid, true-to-brand orange background (the blur
        // style was compositing the orange over the dark app snapshot and
        // turning it muddy brown).
        ShieldConfiguration(
            backgroundBlurStyle: nil,
            backgroundColor: brandOrange,
            icon: UIImage(named: "ShieldIcon"),
            title: ShieldConfiguration.Label(
                text: "This app is locked.",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Pass a test to earn it back.",
                color: UIColor.white.withAlphaComponent(0.92)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Open Brainlock",
                color: deepOrange
            ),
            primaryButtonBackgroundColor: .white,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Go back",
                color: UIColor.white.withAlphaComponent(0.9)
            )
        )
    }
}
