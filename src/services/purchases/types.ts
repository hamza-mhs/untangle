/** The store-agnostic shapes the paywall works with (no RevenueCat types leak past services). */

export type PlanId = 'yearly' | 'monthly' | 'lifetime';

export type Plan = {
  id: PlanId;
  /** Store-formatted, e.g. "$29.99" — never formatted by us (SPEC P03). */
  priceString: string;
  /** "$2.50" for yearly, when the store gives it. */
  pricePerMonthString: string | null;
  /** RevenueCat package identifier, kept to purchase it. */
  packageId: string;
};

export type Offering = { plans: Plan[]; winBack: { priceString: string } | null };

export const PRO_ENTITLEMENT = 'pro';

/** What the app needs to know about the `pro` entitlement. */
export type Entitlement = {
  isActive: boolean;
  plan: PlanId | null;
  willRenew: boolean;
  /** Next renewal or expiry (ms); null for lifetime. */
  expiresAt: number | null;
  /** Store billing retry / grace (P11): Pro stays on. */
  isInGrace: boolean;
  /** Shared through Family Sharing: show "Pro · via Family", hide Cancel (EDGE_CASES). */
  isFamilyShared: boolean;
  /** When Pro last ended (for P12 win-back), if it did. */
  endedAt: number | null;
};

export const NO_ENTITLEMENT: Entitlement = {
  isActive: false,
  plan: null,
  willRenew: false,
  expiresAt: null,
  isInGrace: false,
  isFamilyShared: false,
  endedAt: null,
};
