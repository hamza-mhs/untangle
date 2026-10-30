import type { Plan } from '@/services/purchases';

/** 10-phase1-onboarding §2.15: SAVE % of yearly against twelve months of monthly. */
export function savePercent(yearly: number, monthly: number): number {
  if (monthly <= 0) return 0;
  return Math.max(0, Math.round((1 - yearly / (monthly * 12)) * 100));
}

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

/** Price per week for a plan (yearly / 52, monthly × 12 / 52). */
export function weeklyAmount(plan: Pick<Plan, 'id' | 'price'>): number {
  const perYear = plan.id === 'monthly' ? plan.price * MONTHS_PER_YEAR : plan.price;
  return perYear / WEEKS_PER_YEAR;
}

/** Formats an amount in the store currency ("$0.58"). Falls back to "USD 0.58" without Intl. */
export function formatMoney(amount: number, currencyCode: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(
      amount,
    );
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function weeklyString(
  plan: Pick<Plan, 'id' | 'price' | 'currencyCode'>,
  locale?: string,
): string {
  return formatMoney(weeklyAmount(plan), plan.currencyCode, locale);
}

/** CTA copy: a trial offer says so, anything else is a plain subscribe. */
export function ctaKind(plan: Pick<Plan, 'hasTrial'>): 'trial' | 'subscribe' {
  return plan.hasTrial ? 'trial' : 'subscribe';
}
