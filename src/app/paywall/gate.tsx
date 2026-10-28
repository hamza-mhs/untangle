import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton, Sheet, Text } from '@/design/components';
import { color, pill, size, space } from '@/design/tokens';
import { useRuleDraftStore } from '@/features/rules/draftStore';
import { useT } from '@/i18n';
import { blocking } from '@/services/blocking';

const WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * P07 · Locked is a Pro strength (picking Locked on free). The personal line comes from shield
 * logs ("You've opened TikTok in a Pause rule 9 times this week"); with no data it's dropped.
 * "Use Earn instead" sets the editor's strength to Earn and goes back.
 */
export default function Gate() {
  const t = useT();
  const [opens, setOpens] = useState(0);
  useEffect(() => {
    let alive = true;
    void blocking.getShieldEvents(Date.now() - WEEK).then((events) => {
      if (alive)
        setOpens(events.filter((e) => e.strength === 'pause' && e.outcome === 'opened').length);
    });
    return () => {
      alive = false;
    };
  }, []);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/block'));

  return (
    <Sheet
      testID="paywall.gate"
      icon="lock"
      iconTone="accent"
      title={t('paywall.gate.title')}
      sub={t('paywall.gate.sub')}
      actions={
        <>
          <PrimaryButton
            testID="paywall.gate.plans"
            label={t('paywall.gate.seePlans')}
            compact
            onPress={() => router.replace('/paywall?from=locked')}
          />
          <PrimaryButton
            testID="paywall.gate.earn"
            label={t('paywall.gate.useEarn')}
            variant="outline"
            compact
            onPress={() => {
              useRuleDraftStore.getState().patch({ strength: 'earn' });
              back();
            }}
          />
        </>
      }>
      {opens > 0 ? (
        <Text variant="label" tone="secondary" style={styles.line}>
          {t('paywall.gate.line', { count: opens })}
        </Text>
      ) : null}
      <View
        style={styles.pills}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <View style={styles.pill}>
          <Text variant="meta.strong">{t('paywall.gate.pauseFree')}</Text>
        </View>
        <View style={styles.pill}>
          <Text variant="meta.strong">{t('paywall.gate.earnFree')}</Text>
        </View>
        <View style={[styles.pill, styles.pillPro]}>
          <Text variant="meta.strong" tone="onAccent">
            {t('paywall.gate.lockedPro')}
          </Text>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  line: { marginTop: space.lg },
  pills: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  pill: {
    height: size.durationChip - space.sm,
    ...pill(size.durationChip - space.sm),
    paddingHorizontal: space.lg - 1,
    justifyContent: 'center',
    backgroundColor: color.bg.raisedHigh,
  },
  pillPro: { backgroundColor: color.accent.primary },
});
