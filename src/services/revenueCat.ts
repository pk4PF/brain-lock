import Purchases, {
    LOG_LEVEL,
    type PurchasesOffering,
    type PurchasesPackage,
    type CustomerInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';

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
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({
        apiKey: Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android,
    });
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
    try {
        const offerings = await Purchases.getOfferings();
        return offerings.current;
    } catch (error) {
        console.warn('Failed to fetch RevenueCat offerings:', error);
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
