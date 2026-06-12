import ManagedSettings
import UIKit

// Principal class name MUST be `ShieldActionExtension` — the
// @bacons/apple-targets generated Info.plist points NSExtensionPrincipalClass
// at $(PRODUCT_MODULE_NAME).ShieldActionExtension.
class ShieldActionExtension: ShieldActionDelegate {

    override func handle(action: ShieldAction,
                         for application: ApplicationToken,
                         completionHandler: @escaping (ShieldActionResponse) -> Void) {
        respond(to: action, completionHandler: completionHandler)
    }

    override func handle(action: ShieldAction,
                         for webDomain: WebDomainToken,
                         completionHandler: @escaping (ShieldActionResponse) -> Void) {
        respond(to: action, completionHandler: completionHandler)
    }

    override func handle(action: ShieldAction,
                         for category: ActivityCategoryToken,
                         completionHandler: @escaping (ShieldActionResponse) -> Void) {
        respond(to: action, completionHandler: completionHandler)
    }

    private func respond(to action: ShieldAction,
                         completionHandler: @escaping (ShieldActionResponse) -> Void) {
        switch action {
        case .primaryButtonPressed:
            // iOS does NOT allow a shield action extension to launch another
            // app directly (no openURL in this sandbox). `.close` is the only
            // useful response: it dismisses the locked app and drops the user
            // on the Home Screen, where the Brainlock icon is one tap away.
            // (`.defer` just silently reloads the shield — which is why the
            // button appeared to do nothing.)
            completionHandler(.close)
        case .secondaryButtonPressed:
            // "Go back" — also leave the locked app and return Home.
            completionHandler(.close)
        @unknown default:
            completionHandler(.close)
        }
    }
}
