import type { FeatureRow } from '@/design/components';
import { t } from '@/i18n';

/** Free vs Pro rows for the FeatureTable (SPEC §3). Copy in i18n `paywall.features.*`. */
export function featureRows(): FeatureRow[] {
  return [
    {
      id: 'rules',
      feature: t('paywall.features.rules'),
      free: '2',
      pro: t('paywall.features.unlimited'),
    },
    { id: 'locked', feature: t('paywall.features.locked'), free: false, pro: true },
    { id: 'websites', feature: t('paywall.features.websites'), free: false, pro: true },
    { id: 'program', feature: t('paywall.features.program'), free: false, pro: true },
    { id: 'insights', feature: t('paywall.features.insights'), free: false, pro: true },
    { id: 'widgets', feature: t('paywall.features.widgets'), free: false, pro: true },
    { id: 'challenges', feature: t('paywall.features.challenges'), free: true, pro: true },
  ];
}
