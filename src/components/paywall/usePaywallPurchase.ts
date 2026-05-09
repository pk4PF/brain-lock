import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { type PurchasesPackage } from 'react-native-purchases';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkPremiumStatus,
  getCurrentCustomerInfo,
} from '../../services/revenueCat';
import { useStore } from '../../store/useStore';
import { track, Events } from '../../services/analytics';

const MONTHLY_PRICE_FALLBACK = '£12.99';
const ANNUAL_PRICE_FALLBACK = '£24.99';
const ANNUAL_BASE_PRICE_FALLBACK = '£49.99';

export type PlanKey = 'monthly' | 'annual';

export interface PaywallPurchaseState {
  /** RevenueCat monthly package, or null while loading / unavailable. */
  monthly: PurchasesPackage | null;
  /** RevenueCat annual package, or null while loading / unavailable. */
  annual: PurchasesPackage | null;
  /** Currently selected plan. Defaults to 'annual'. */
  selectedPlan: PlanKey;
  setSelectedPlan: (plan: PlanKey) => void;
  /** True while offerings are being fetched. */
  loading: boolean;
  /** True while a purchase or restore is in flight. */
  purchasing: boolean;
  /** Localised price label for monthly (£12.99). */
  monthlyPrice: string;
  /** Localised price label for annual - intro price (£24.99) when offered, else base. */
  annualPrice: string;
  /** Localised label for annual base price (£49.99) - used as a strikethrough. */
  annualBasePrice: string;
  /** True when the user is being shown an introductory offer on the annual plan. */
  hasAnnualIntro: boolean;
  /** Localised price label for whichever plan is currently selected. */
  selectedPrice: string;
  /** Discount % the annual plan offers vs paying monthly all year. */
  annualSavingsPct: number;
  /** Effective monthly equivalent of the annual plan (e.g. "£4.17/mo"). */
  annualPerMonth: string;
  /** Start the purchase flow on the selected plan. Calls onSuccess if it completes, onCancel if the user dismisses Apple Pay. */
  purchase: (onSuccess: () => void, onCancel?: () => void) => Promise<void>;
  /** Restore previous purchases. Calls onSuccess if found. */
  restore: (onSuccess: () => void) => Promise<void>;
}

/**
 * Centralised purchase plumbing for both the onboarding paywall and the in-app
 * PaywallModal. Encapsulates RevenueCat package lookup (monthly + annual),
 * purchase/restore, analytics, dev fallback, and a default-to-annual selection
 * model.
 *
 * Pass a `source` so analytics can distinguish onboarding vs modal triggers.
 */
export function usePaywallPurchase(opts: {
  visible: boolean;
  source: 'onboarding' | 'modal' | 'final-offer';
}): PaywallPurchaseState {
  const { visible, source } = opts;
  const { setSubscription } = useStore();

  const [monthly, setMonthly] = useState<PurchasesPackage | null>(null);
  const [annual, setAnnual] = useState<PurchasesPackage | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('annual');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    track(Events.PaywallShown, { source });
    (async () => {
      try {
        const offering = await getOfferings();
        if (cancelled) return;
        if (offering) {
          const m =
            offering.availablePackages.find(
              (p) =>
                p.packageType === 'MONTHLY' ||
                p.product.identifier.toLowerCase().includes('monthly') ||
                p.product.identifier.toLowerCase().includes('month'),
            ) ?? null;
          const a =
            offering.availablePackages.find(
              (p) =>
                p.packageType === 'ANNUAL' ||
                p.product.identifier.toLowerCase().includes('annual') ||
                p.product.identifier.toLowerCase().includes('year'),
            ) ?? null;
          setMonthly(m);
          setAnnual(a);
        }
      } catch (err) {
        if (__DEV__) console.warn('[Paywall] Failed to load offerings:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, source]);

  const monthlyPrice = monthly?.product.priceString ?? MONTHLY_PRICE_FALLBACK;

  // For yearly we display the introductory offer price (£24.99) when it
  // exists on the product, falling back to the base price. Apple's intro
  // offer is what new users actually pay year 1; year 2 onward renews at
  // the base price.
  const annualIntro = (annual?.product as any)?.introPrice;
  const annualBasePrice = annual?.product.priceString ?? ANNUAL_BASE_PRICE_FALLBACK;
  const annualPrice = annualIntro?.priceString ?? annual?.product.priceString ?? ANNUAL_PRICE_FALLBACK;
  const selectedPrice = selectedPlan === 'monthly' ? monthlyPrice : annualPrice;

  // Compute % savings of annual (intro if present) vs paying monthly all year.
  const monthlyNumeric = monthly?.product.price ?? Number(MONTHLY_PRICE_FALLBACK.replace(/[^\d.]/g, '')) ?? 12.99;
  const annualNumeric =
    annualIntro?.price ??
    annual?.product.price ??
    Number(ANNUAL_PRICE_FALLBACK.replace(/[^\d.]/g, '')) ??
    24.99;
  const yearlyAtMonthly = monthlyNumeric * 12;
  const annualSavingsPct =
    yearlyAtMonthly > 0
      ? Math.max(0, Math.round((1 - annualNumeric / yearlyAtMonthly) * 100))
      : 0;

  // Derive a "/mo" label for the annual plan, in the same currency symbol as priceString.
  const currencySymbol = (annual?.product.priceString ?? annualPrice).replace(/[\d.,\s]/g, '') || '£';
  const annualPerMonth = `${currencySymbol}${(annualNumeric / 12).toFixed(2)}/mo`;

  const purchase = useCallback(
    async (onSuccess: () => void, onCancel?: () => void) => {
      const pkg = selectedPlan === 'monthly' ? monthly : annual;
      track(Events.PurchaseStarted, { plan: selectedPlan, source });
      if (!pkg) {
        if (__DEV__) {
          // Dev fallback when RevenueCat isn't configured locally
          setSubscription(selectedPlan);
          track(Events.PurchaseCompleted, {
            plan: selectedPlan,
            dev: true,
            source,
          });
          onSuccess();
        } else {
          Alert.alert(
            'Unable to load plan',
            'Please check your connection and try again.',
          );
        }
        return;
      }
      setPurchasing(true);
      try {
        let customerInfo = await purchasePackage(pkg);
        if (checkPremiumStatus(customerInfo)) {
          setSubscription(selectedPlan);
          track(Events.PurchaseCompleted, { plan: selectedPlan, source });
          onSuccess();
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
        customerInfo = await getCurrentCustomerInfo();
        if (checkPremiumStatus(customerInfo)) {
          setSubscription(selectedPlan);
          track(Events.PurchaseCompleted, { plan: selectedPlan, source });
          onSuccess();
        } else {
          setSubscription(selectedPlan);
          track(Events.PurchaseCompleted, {
            plan: selectedPlan,
            fallback: true,
            source,
          });
          onSuccess();
        }
      } catch (err: any) {
        track(Events.PurchaseFailed, {
          plan: selectedPlan,
          cancelled: !!err?.userCancelled,
          source,
        });
        if (err?.userCancelled) {
          onCancel?.();
        } else {
          Alert.alert('Purchase failed', 'Please try again later.');
        }
      } finally {
        setPurchasing(false);
      }
    },
    [monthly, annual, selectedPlan, setSubscription, source],
  );

  const restore = useCallback(
    async (onSuccess: () => void) => {
      track(Events.RestoreAttempted, { source });
      setPurchasing(true);
      try {
        const customerInfo = await restorePurchases();
        if (checkPremiumStatus(customerInfo)) {
          setSubscription('restored');
          Alert.alert('Restored!', 'Your premium access has been restored.');
          onSuccess();
        } else {
          Alert.alert(
            'No purchases found',
            "We couldn't find any previous purchases on this account.",
          );
        }
      } catch {
        Alert.alert('Restore failed', 'Please try again later.');
      } finally {
        setPurchasing(false);
      }
    },
    [setSubscription, source],
  );

  return {
    monthly,
    annual,
    selectedPlan,
    setSelectedPlan,
    loading,
    purchasing,
    monthlyPrice,
    annualPrice,
    annualBasePrice,
    hasAnnualIntro: !!annualIntro,
    selectedPrice,
    annualSavingsPct,
    annualPerMonth,
    purchase,
    restore,
  };
}
