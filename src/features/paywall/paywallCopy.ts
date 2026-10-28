import { t } from '@/i18n';

/**
 * `?from=` → headline copy (P13). Unknown or missing sources get the general paywall (P03).
 * Sources: bedtime (a Bedtime rule moment), locked (Locked strength gate), rules (rule
 * limit), insights, widgets, expiry (day 7), settings.
 */
export const PAYWALL_SOURCES = [
  'bedtime',
  'locked',
  'rules',
  'insights',
  'widgets',
  'expiry',
  'settings',
] as const;
export type PaywallSource = (typeof PAYWALL_SOURCES)[number];

export function parseSource(from: unknown): PaywallSource | null {
  return typeof from === 'string' && (PAYWALL_SOURCES as readonly string[]).includes(from)
    ? (from as PaywallSource)
    : null;
}

/** Contextual (P13) vs the general table paywall (P03). */
export function isContextual(source: PaywallSource | null): boolean {
  return source !== null && source !== 'expiry' && source !== 'settings';
}

export type ContextCopy = {
  headline: string;
  body: string;
  benefits: { id: string; title: string; sub: string; tone: 'accent' | 'sky' | 'pink' }[];
};

export function contextCopy(source: PaywallSource, bedtimeEnd?: string): ContextCopy {
  const benefits: ContextCopy['benefits'] = [
    {
      id: 'locked',
      title: t('paywall.context.benefitLocked'),
      sub: t('paywall.context.benefitLockedSub'),
      tone: 'accent',
    },
    {
      id: 'rules',
      title: t('paywall.context.benefitRules'),
      sub: t('paywall.context.benefitRulesSub'),
      tone: 'sky',
    },
    {
      id: 'insights',
      title: t('paywall.context.benefitInsights'),
      sub: t('paywall.context.benefitInsightsSub'),
      tone: 'pink',
    },
  ];
  return {
    headline: t(`paywall.context.${source}.headline`),
    body: t(`paywall.context.${source}.body`, { time: bedtimeEnd ?? '07:00' }),
    benefits,
  };
}
