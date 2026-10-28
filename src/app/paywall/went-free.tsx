import { router } from 'expo-router';

import { PrimaryButton, Sheet, SheetList } from '@/design/components';
import { useRulesStore } from '@/features/rules/store';
import { useT } from '@/i18n';

/**
 * P06 · you're on free (after day 7 with no purchase, or a lapse). Runs the downgrade once:
 * Locked → Earn, the 2 most recently used rules stay on, the rest pause (never deleted).
 */
export default function WentFree() {
  const t = useT();
  const result = useRulesStore((s) => s.lastDowngrade) ?? { softened: [], kept: [], paused: [] };
  const rules = useRulesStore((s) => s.rules);
  const nameOf = (ids: string[]) =>
    ids
      .map((id) => rules.find((r) => r.id === id)?.name)
      .filter(Boolean)
      .join(', ');

  const rows = [
    ...(result.softened.length
      ? [
          {
            id: 'softened',
            label: nameOf(result.softened),
            value: t('paywall.wentFree.lockedToEarn'),
            valueTone: 'accent' as const,
          },
        ]
      : []),
    ...(result.kept.length
      ? [
          {
            id: 'kept',
            label: nameOf(result.kept),
            value: t('paywall.wentFree.kept'),
            valueTone: 'success' as const,
          },
        ]
      : []),
    ...(result.paused.length
      ? [{ id: 'paused', label: nameOf(result.paused), value: t('paywall.wentFree.paused') }]
      : []),
    {
      id: 'web',
      label: t('paywall.wentFree.websites'),
      value: t('paywall.wentFree.websitesPaused'),
    },
    {
      id: 'points',
      label: t('paywall.wentFree.points'),
      value: t('paywall.wentFree.allKept'),
      valueTone: 'success' as const,
    },
  ];

  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));

  return (
    <Sheet
      testID="paywall.wentFree"
      size="large"
      title={t('paywall.wentFree.title')}
      body={t('paywall.wentFree.body')}
      actions={
        <>
          <PrimaryButton
            testID="paywall.wentFree.ok"
            label={t('paywall.wentFree.gotIt')}
            variant="light"
            compact
            onPress={close}
          />
          <PrimaryButton
            testID="paywall.wentFree.choose"
            label={t('paywall.wentFree.choose')}
            variant="outline"
            compact
            onPress={() => router.replace('/block')}
          />
        </>
      }>
      <SheetList rows={rows} />
    </Sheet>
  );
}
