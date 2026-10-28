import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { PrimaryButton, Sheet, SheetList, Text } from '@/design/components';
import { space } from '@/design/tokens';
import { weekWithProParts } from '@/features/paywall/moments';
import { usePaywallStore } from '@/features/paywall/paywallStore';
import { TRIAL_DAYS, trialDayNumber } from '@/features/paywall/trial';
import { useTrialStore } from '@/features/paywall/trialStore';
import { passesLeftThisWeek } from '@/features/rules/emergencyPasses';
import { useRulesStore } from '@/features/rules/store';
import { useT } from '@/i18n';
import { blocking } from '@/services/blocking';

const WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * P02 · day 5 of 7 (Home sheet, first open). What changes on day 7, plus a personal line from
 * real counts with any zero dropped. "Remind me on day 7" shows it once more then.
 */
export default function Day5() {
  const t = useT();
  const trial = useTrialStore();
  const passLog = useRulesStore((s) => s.passLog);
  const remindLater = usePaywallStore((s) => s.remindLater);
  const [now] = useState(() => Date.now());
  const [counts, setCounts] = useState({ locksHeld: 0, opensResisted: 0, passesUnused: 0 });
  const day = trialDayNumber(trial, now) ?? 5;

  useEffect(() => {
    let alive = true;
    void blocking.getShieldEvents(now - WEEK).then((events) => {
      if (!alive) return;
      const closed = events.filter((e) => e.outcome === 'closed');
      setCounts({
        locksHeld: closed.filter((e) => e.strength === 'locked').length,
        opensResisted: closed.length,
        passesUnused: passesLeftThisWeek(passLog, now),
      });
    });
    return () => {
      alive = false;
    };
  }, [now, passLog]);

  const parts = weekWithProParts(counts);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));

  return (
    <Sheet
      testID="paywall.day5"
      size="large"
      overline={t('paywall.day5.overline', { day, total: TRIAL_DAYS })}
      title={t('paywall.day5.title', { count: TRIAL_DAYS - day + 1 })}
      sub={t('paywall.day5.sub')}
      actions={
        <>
          <PrimaryButton
            testID="paywall.day5.plans"
            label={t('paywall.day5.seePlans')}
            compact
            onPress={() => router.replace('/paywall?from=expiry')}
          />
          <PrimaryButton
            testID="paywall.day5.remind"
            label={t('paywall.day5.remind', { day: TRIAL_DAYS })}
            variant="outline"
            compact
            onPress={() => {
              remindLater();
              close();
            }}
          />
        </>
      }>
      <SheetList
        rows={[
          { id: 'bedtime', label: t('paywall.day5.bedtime'), value: t('paywall.day5.becomesEarn') },
          { id: 'web', label: t('paywall.day5.websites'), value: t('paywall.day5.pause') },
          {
            id: 'widgets',
            label: t('paywall.day5.widgets'),
            value: t('paywall.day5.widgetsStay', { day: TRIAL_DAYS }),
          },
        ]}
      />
      {parts.length ? (
        <Text variant="meta" tone="muted" style={styles.line}>
          {t('paywall.day5.weekLead')}
          {parts.map((k) => t(`paywall.day5.${k}`, { count: counts[k] })).join(', ')}.
        </Text>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  line: { marginTop: space.md },
});
