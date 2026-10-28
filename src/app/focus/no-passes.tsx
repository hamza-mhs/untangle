import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { PrimaryButton, Sheet, Text } from '@/design/components';
import { space } from '@/design/tokens';
import { useFocusStore } from '@/features/focus/store';
import { passesThisWeek } from '@/features/rules/emergencyPasses';
import { useRulesStore } from '@/features/rules/store';
import { useT } from '@/i18n';
import { formatClock, formatWeekday } from '@/lib/format';

/** E10 · no passes left. They reset Monday 00:00 local. A plain-text log of the ones used. */
export default function NoPasses() {
  const t = useT();
  const passLog = useRulesStore((s) => s.passLog);
  const session = useFocusStore((s) => s.session);
  const [now] = useState(() => Date.now());
  const used = passesThisWeek(passLog, now);
  const endsAt = session.status === 'running' ? formatClock(session.endsAt) : null;
  return (
    <Sheet
      testID="focus.noPasses"
      title={t('focus.noPasses.title')}
      body={endsAt ? t('focus.noPasses.bodyWithEnd', { time: endsAt }) : t('focus.noPasses.body')}
      actions={
        <PrimaryButton
          testID="focus.noPasses.keep"
          label={t('focus.emergency.keep')}
          compact
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/today'))}
        />
      }>
      {used.length ? (
        <Text variant="meta" tone="muted" style={styles.log}>
          {used
            .map((p) =>
              t('focus.noPasses.used', {
                day: formatWeekday(p.at),
                reason: t(`focus.emergency.reasons.${p.reason}`),
              }),
            )
            .join('\n')}
        </Text>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  log: { marginTop: space.lg },
});
