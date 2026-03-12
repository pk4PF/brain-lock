import Purchases, {
    LOG_LEVEL,
    type PurchasesOffering,
    type PurchasesPackage,
    type CustomerInfo,
} from 'react-native-purchases';
import { LogBox, Platform } from 'react-native';

// Suppress expected RevenueCat error when products aren't configured yet
LogBox.ignoreLogs([/\[RevenueCat\].*Error fetching offerings/]);

// Replace these with your actual RevenueCat API keys from the dashboard
const API_KEYS = {
    ios: 'appl_CzBZCAflGPDZgiifGbqLQUAXdem',
    android: 'goog_XXXXXXXXXXXXXXXXXXXXXXXX',
};

export async function initRevenueCat(): Promise<void> {
    if (API_KEYS.ios === 'appl_XXXXXXXXXXXXXXXXXXXXXXXX') {
        console.warn('REVENUECAT API KEY MISSING: Please replace API_KEYS.ios in src/services/revenueCat.ts with your actual Public App-Specific API Key from RevenueCat.');
        // We do not return here, we just emit a huge warning. In development, it would be useful.
    }

    if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.WARN);
    }

    await Purchases.configure({
        apiKey: Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android,
    });
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
    try {
        if (__DEV__) console.log('[RevenueCat] Fetching offerings...');
        const offerings = await Purchases.getOfferings();
        if (__DEV__) {
            console.log('[RevenueCat] Offerings:', {
                hasCurrentOffering: !!offerings.current,
                offeringId: offerings.current?.identifier,
                packageCount: offerings.current?.availablePackages.length ?? 0,
            });
        }
        return offerings.current;
    } catch (error) {
        if (__DEV__) console.warn('[RevenueCat] Failed to fetch offerings:', error);
        return null;
    }
}

export async function purchasePackage(
    pkg: PurchasesPackage
): Promise<CustomerInfo> {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
}

export function checkPremiumStatus(customerInfo: CustomerInfo): boolean {
    return customerInfo.entitlements.active['premium'] !== undefined;
}

export async function getCurrentCustomerInfo(): Promise<CustomerInfo> {
    return Purchases.getCustomerInfo();
}
