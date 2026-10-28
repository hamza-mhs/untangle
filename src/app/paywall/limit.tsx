import { router } from 'expo-router';

import { PressableScale, PrimaryButton, Sheet, SheetList, Text } from '@/design/components';
import { space } from '@/design/tokens';
import { MAX_FREE_RULES } from '@/features/rules/rules';
import { useRulesStore } from '@/features/rules/store';
import { useT } from '@/i18n';

/** P08 · "+ New rule" with both free rules in use: edit one, or go unlimited with Pro. */
export default function Limit() {
  const t = useT();
  const rules = useRulesStore((s) => s.rules.filter((r) => !r.isPausedByPlan));
  const edit = (id: string) => router.replace({ pathname: '/rule/[id]', params: { id } });
  return (
    <Sheet
      testID="paywall.limit"
      title={t('paywall.limit.title', { used: rules.length, total: MAX_FREE_RULES })}
      body={t('paywall.limit.body')}
      actions={
        <>
          <PrimaryButton
            testID="paywall.limit.pro"
            label={t('paywall.limit.unlimited')}
            compact
            onPress={() => router.replace('/paywall?from=rules')}
          />
          <PrimaryButton
            testID="paywall.limit.edit"
            label={t('paywall.limit.editRule')}
            variant="outline"
            compact
            onPress={() => (rules[0] ? edit(rules[0].id) : router.back())}
          />
        </>
      }>
      <SheetList
        rows={rules.slice(0, MAX_FREE_RULES).map((r) => ({
          id: r.id,
          label: t('paywall.limit.row', {
            name: r.name,
            strength: t(`strength.${r.strength}.title`),
          }),
          value: (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t('paywall.limit.editA11y', { name: r.name })}
              hitSlop={space.md}
              onPress={() => edit(r.id)}>
              <Text variant="label.strong" tone="accent">
                {t('common.edit')}
              </Text>
            </PressableScale>
          ),
        }))}
      />
    </Sheet>
  );
}
