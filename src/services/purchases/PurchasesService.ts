import { Linking, Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import { err, ok, type Result } from '@/lib/result';

import { useMocks } from '../nativeModules';
import { mapOfferingsError, mapPurchaseError, type PurchaseFailure } from './errors';
import {
  NO_ENTITLEMENT,
  PRO_ENTITLEMENT,
  type Entitlement,
  type Offering,
  type Plan,
  type PlanId,
} from './types';

/**
 * RevenueCat: the only SDK that talks to a server. No account: RevenueCat assigns an anonymous
 * app user id. Keys come from env (EXPO_PUBLIC_REVENUECAT_*; sandbox keys in dev).
 *
 * Google Play only. Offering `default` with $rc_annual (3-day free trial) and $rc_monthly; both
 * grant the `pro` entitlement. Prices always come from the store.
 *
 * A class because it owns state and a lifecycle (CODE_STANDARDS › Services).
 */
/** The RevenueCat offering the paywall shows. */
export const OFFERING_ID = 'default';

/** Public Android SDK key from .env.local (EXPO_PUBLIC_RC_ANDROID_KEY; the older name still works). */
export function revenueCatKey(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_RC_ANDROID_KEY ||
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ||
    undefined
  );
}

export class PurchasesService {
  private configured = false;
  private packages = new Map<string, PurchasesPackage>();

  /** Safe to call more than once. No-ops without a key (and under mocks). */
  configure(): boolean {
    if (this.configured) return true;
    const apiKey = revenueCatKey();
    if (!apiKey) {
      if (__DEV__ && !useMocks)
        console.warn('[purchases] No RevenueCat key set — see .env.example');
      return false;
    }
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey });
    this.configured = true;
    return true;
  }

  get isConfigured(): boolean {
    return this.configured;
  }

  async getOffering(): Promise<Result<Offering, 'offline' | 'error'>> {
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.all[OFFERING_ID] ?? offerings.current;
      if (!current) return err('error');
      const plans = current.availablePackages.flatMap((p): Plan[] => {
        const id = planIdOf(p.packageType);
        if (!id) return [];
        this.packages.set(p.identifier, p);
        return [
          {
            id,
            priceString: p.product.priceString,
            price: p.product.price,
            currencyCode: p.product.currencyCode,
            hasTrial: !!p.product.defaultOption?.freePhase || p.product.introPrice?.price === 0,
            pricePerMonthString: p.product.pricePerMonthString ?? null,
            packageId: p.identifier,
          },
        ];
      });
      return plans.length ? ok({ plans: sortPlans(plans), winBack: null }) : err('error');
    } catch (e) {
      return err(mapOfferingsError(e));
    }
  }

  async purchase(plan: Plan): Promise<Result<Entitlement, PurchaseFailure>> {
    const pkg = this.packages.get(plan.packageId);
    if (!pkg) return err('failed');
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return ok(toEntitlement(customerInfo));
    } catch (e) {
      return err(mapPurchaseError(e));
    }
  }

  async restore(): Promise<Result<Entitlement, 'none' | 'offline' | 'failed'>> {
    try {
      const entitlement = toEntitlement(await Purchases.restorePurchases());
      return entitlement.isActive ? ok(entitlement) : err('none');
    } catch (e) {
      const outcome = mapPurchaseError(e);
      return err(outcome === 'offline' ? 'offline' : 'failed');
    }
  }

  async getEntitlement(): Promise<Entitlement | null> {
    if (!this.configured) return null;
    try {
      return toEntitlement(await Purchases.getCustomerInfo());
    } catch {
      return null;
    }
  }

  /** Pushes on purchase, restore, renewal, expiry (E06 resolves itself through this). */
  onChange(listener: (e: Entitlement) => void): () => void {
    if (!this.configured) return () => {};
    const l = (info: CustomerInfo) => listener(toEntitlement(info));
    Purchases.addCustomerInfoUpdateListener(l);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(l);
    };
  }

  /** P09 / P10 / P11 "Fix": the store's own page. We can't cancel in-app. */
  async openManageSubscriptions(): Promise<void> {
    if (Platform.OS === 'ios' && this.configured) {
      try {
        await Purchases.showManageSubscriptions();
        return;
      } catch {
        // Fall through to the URL.
      }
    }
    await Linking.openURL(
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions',
    );
  }
}

function planIdOf(type: PACKAGE_TYPE): PlanId | null {
  if (type === PACKAGE_TYPE.ANNUAL) return 'yearly';
  if (type === PACKAGE_TYPE.MONTHLY) return 'monthly';
  if (type === PACKAGE_TYPE.LIFETIME) return 'lifetime';
  return null;
}

const ORDER: readonly PlanId[] = ['yearly', 'monthly', 'lifetime'];
export function sortPlans(plans: readonly Plan[]): Plan[] {
  return [...plans].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
}

/** CustomerInfo → our Entitlement. Exported for tests. */
export function toEntitlement(info: CustomerInfo): Entitlement {
  const active = info.entitlements.active[PRO_ENTITLEMENT];
  const any = active ?? info.entitlements.all?.[PRO_ENTITLEMENT];
  if (!any) return NO_ENTITLEMENT;
  const id = any.productIdentifier;
  const plan: PlanId | null = id.includes('lifetime')
    ? 'lifetime'
    : id.includes('year') || id.includes('annual')
      ? 'yearly'
      : id.includes('month')
        ? 'monthly'
        : null;
  return {
    isActive: !!active,
    plan,
    willRenew: any.willRenew,
    expiresAt: any.expirationDateMillis ?? null,
    isInGrace: !!active && any.billingIssueDetectedAtMillis !== null,
    isFamilyShared: any.ownershipType === 'FAMILY_SHARED',
    isTrial: !!active && any.periodType === 'TRIAL',
    endedAt: !active ? (any.expirationDateMillis ?? null) : null,
  };
}
