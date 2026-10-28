import { router, useLocalSearchParams } from 'expo-router';

import { PrimaryButton, Sheet } from '@/design/components';
import { useT } from '@/i18n';
import { formatRuleTime } from '@/lib/format';

/** "This rule is locked until 12:00. You can edit it after." (FRuleEdit, active Locked rule). */
export default function RuleLocked() {
  const t = useT();
  const { until } = useLocalSearchParams<{ until?: string }>();
  const time = until ? formatRuleTime(until) : '';
  return (
    <Sheet
      testID="rule.locked"
      icon="lock"
      title={t('rules.locked.title')}
      body={t('rules.locked.body', { time })}
      actions={
        <PrimaryButton
          label={t('common.ok')}
          variant="light"
          compact
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/block'))}
        />
      }
    />
  );
}
