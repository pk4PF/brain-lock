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

// Pricing model: annual-anchored (the dominant, default plan) + weekly as the
// low-commitment alternative. Winback is a genuinely discounted FIRST-YEAR
// annual (≈50% off) shown only on the final-offer screen when the user tries
// to leave the paywall.
const WEEKLY_PRICE_FALLBACK = '£9.99';
const ANNUAL_PRICE_FALLBACK = '£49.99';
const WINBACK_PRICE_FALLBACK = '£24.99';

export type PlanKey = 'weekly' | 'annual' | 'winback';

export interface PaywallPurchaseState {
  /** RevenueCat weekly package, or null while loading / unavailable. */
  weekly: PurchasesPackage | null;
  /** RevenueCat annual package, or null while loading / unavailable. */
  annual: PurchasesPackage | null;
  /** RevenueCat winback package (discounted first-year annual), or null. */
  winback: PurchasesPackage | null;
  /** Currently selected plan. Defaults to 'annual'. */
  selectedPlan: PlanKey;
  setSelectedPlan: (plan: PlanKey) => void;
  /** True while offerings are being fetched. */
  loading: boolean;
  /** True while a purchase or restore is in flight. */
  purchasing: boolean;
  /** Localised price label for weekly (£9.99). */
  weeklyPrice: string;
  /** Localised price label for annual (£49.99). */
  annualPrice: string;
  /** Localised price label for the winback rate (£24.99 first-year annual). */
  winbackPrice: string;
  /** Localised price label for whichever plan is currently selected. */
  selectedPrice: string;
  /** Honest discount % of annual vs paying weekly all year (annual is far cheaper). */
  annualSavingsPct: number;
  /** Effective monthly equivalent of the annual plan (e.g. "£4.17/mo"). */
  annualPerMonth: string;
  /** Effective weekly equivalent of the annual plan (e.g. "£0.96/wk"). */
  annualPerWeek: string;
  /** Start the purchase flow on the selected plan. Calls onSuccess if it completes, onCancel if the user dismisses Apple Pay. */
  purchase: (onSuccess: () => void, onCancel?: () => void) => Promise<void>;
  /** Restore previous purchases. Calls onSuccess if found. */
  restore: (onSuccess: () => void) => Promise<void>;
}

const numeric = (s: string) => Number(s.replace(/[^\d.]/g, '')) || 0;

/**
 * Centralised purchase plumbing for the onboarding paywall, the final-offer
 * winback, and the in-app PaywallModal. Looks up weekly / annual / winback
 * packages, handles purchase/restore, analytics, and a dev fallback.
 *
 * Pass a `source` so analytics can distinguish triggers.
 */
export function usePaywallPurchase(opts: {
  visible: boolean;
  source: 'onboarding' | 'modal' | 'final-offer';
}): PaywallPurchaseState {
  const { visible, source } = opts;
  const { setSubscription } = useStore();

  const [weekly, setWeekly] = useState<PurchasesPackage | null>(null);
  const [annual, setAnnual] = useState<PurchasesPackage | null>(null);
  const [winback, setWinback] = useState<PurchasesPackage | null>(null);
  // Winback is the default selection on the final-offer screen; annual elsewhere.
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(
    source === 'final-offer' ? 'winback' : 'annual',
  );
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
        if (cancelled || !offering) return;
        const id = (p: PurchasesPackage) => p.product.identifier.toLowerCase();
        setWeekly(
          offering.availablePackages.find(
            (p) => p.packageType === 'WEEKLY' || id(p).includes('week'),
          ) ?? null,
        );
        const isWinback = (p: PurchasesPackage) =>
          id(p).includes('winback') || id(p).includes('win-back') || id(p).includes('win_back');
        setAnnual(
          offering.availablePackages.find(
            (p) => !isWinback(p) && (p.packageType === 'ANNUAL' || id(p).includes('annual') || id(p).includes('year')),
          ) ?? null,
        );
        setWinback(
          offering.availablePackages.find(isWinback) ?? null,
        );
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

  const weeklyPrice = weekly?.product.priceString ?? WEEKLY_PRICE_FALLBACK;
  const annualPrice = annual?.product.priceString ?? ANNUAL_PRICE_FALLBACK;
  const winbackPrice = winback?.product.priceString ?? WINBACK_PRICE_FALLBACK;
  const selectedPrice =
    selectedPlan === 'weekly' ? weeklyPrice
    : selectedPlan === 'winback' ? winbackPrice
    : annualPrice;

  // Honest savings: annual vs paying the weekly rate for a full year.
  const weeklyNumeric = weekly?.product.price ?? numeric(WEEKLY_PRICE_FALLBACK);
  const annualNumeric = annual?.product.price ?? numeric(ANNUAL_PRICE_FALLBACK);
  const yearlyAtWeekly = weeklyNumeric * 52;
  const annualSavingsPct =
    yearlyAtWeekly > 0
      ? Math.max(0, Math.round((1 - annualNumeric / yearlyAtWeekly) * 100))
      : 0;

  const currencySymbol = annualPrice.replace(/[\d.,\s]/g, '') || '£';
  const annualPerMonth = `${currencySymbol}${(annualNumeric / 12).toFixed(2)}/mo`;
  const annualPerWeek = `${currencySymbol}${(annualNumeric / 52).toFixed(2)}/wk`;

  const purchase = useCallback(
    async (onSuccess: () => void, onCancel?: () => void) => {
      const pkg = selectedPlan === 'weekly' ? weekly : selectedPlan === 'winback' ? winback : annual;
      track(Events.PurchaseStarted, { plan: selectedPlan, source });
      if (!pkg) {
        if (__DEV__) {
          setSubscription(selectedPlan);
          track(Events.PurchaseCompleted, { plan: selectedPlan, dev: true, source });
          onSuccess();
        } else {
          Alert.alert('Unable to load plan', 'Please check your connection and try again.');
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
          track(Events.PurchaseCompleted, { plan: selectedPlan, fallback: true, source });
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
    [weekly, annual, winback, selectedPlan, setSubscription, source],
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
    weekly,
    annual,
    winback,
    selectedPlan,
    setSelectedPlan,
    loading,
    purchasing,
    weeklyPrice,
    annualPrice,
    winbackPrice,
    selectedPrice,
    annualSavingsPct,
    annualPerMonth,
    annualPerWeek,
    purchase,
    restore,
  };
}
