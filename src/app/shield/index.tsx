import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTile, Chip, Icon, PrimaryButton, PressableScale, Text } from '@/design/components';
import { color, layout, radius, rounded, size, space } from '@/design/tokens';
import { BreathRing } from '@/features/rules/components/BreathRing';
import { initialsOf } from '@/features/rules/present';
import { EARN_SPEND_MINUTES, PAUSE_BREATH_SECONDS } from '@/features/rules/strengths';
import { useScoringStore } from '@/features/scoring/store';
import { DevSkip } from '@/features/dev/DevSkip';
import { useT } from '@/i18n';
import { formatRuleTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { blocking, type ShieldEvent } from '@/services/blocking';

const S = layout.screen;
const REASONS = ['bored', 'habit', 'need', 'avoiding'] as const;

/**
 * FShield · Android full-screen block, opened by the native watcher service with
 * `untangle://shield?app=…&appId=…&rule=…&strength=…&opens=…&stay=…&until=…`.
 *   Pause:  10 s breath, then "Spend 10 min" (from earned minutes) unlocks.
 *   Earn:   no breath; "Spend 10 min" from earned minutes, disabled at 0.
 *   Locked: no secondary, only "Close", plus "Unlocks at 12:00".
 * The "why" chips log a trigger with the event.
 */
export default function Shield() {
  const t = useT();
  const p = useLocalSearchParams<{
    app?: string;
    appId?: string;
    rule?: string;
    strength?: string;
    opens?: string;
    stay?: string;
    until?: string;
  }>();
  const appName = p.app ?? t('shield.thisApp');
  const strength = p.strength === 'locked' || p.strength === 'earn' ? p.strength : 'pause';
  const minutesLeft = useScoringStore((s) => s.minutes);
  const [isBreathDone, setIsBreathDone] = useState(strength !== 'pause');
  const [reason, setReason] = useState<NonNullable<ShieldEvent['reason']> | null>(null);
  const canSpend = minutesLeft >= EARN_SPEND_MINUTES;

  const leave = () => {
    if (router.canGoBack()) router.back();
    else BackHandler.exitApp();
  };

  const handleClose = () => {
    haptics.tap();
    blocking.resolveShield({
      appId: p.appId ?? '',
      ruleId: p.rule ?? '',
      outcome: 'closed',
      ...(reason ? { reason } : {}),
    });
    leave();
  };

  const handleSpend = () => {
    const entry = useScoringStore.getState().spendMinutes(EARN_SPEND_MINUTES);
    if (!entry) {
      haptics.warning();
      return;
    }
    blocking.resolveShield({
      appId: p.appId ?? '',
      ruleId: p.rule ?? '',
      outcome: 'spent',
      spendMinutes: EARN_SPEND_MINUTES,
      ...(reason ? { reason } : {}),
    });
    leave();
  };

  const opens = Number(p.opens);
  const stay = Number(p.stay);

  return (
    <>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.center}>
            <AppTile
              app={{ id: 'shield', initials: initialsOf(appName), name: appName }}
              size="hero"
            />
            <Text variant="title.s" align="center" accessibilityRole="header" style={styles.title}>
              {t(strength === 'locked' ? 'shield.locked' : 'shield.paused', { app: appName })}
            </Text>
            {opens > 0 ? (
              <Text variant="body.lead" tone="secondary" align="center" style={styles.sub}>
                {stay > 0
                  ? t('shield.historyWithStay', { ordinal: opens, minutes: stay })
                  : t('shield.history', { ordinal: opens })}
              </Text>
            ) : null}
            {strength === 'pause' ? (
              <View style={styles.ring}>
                <BreathRing seconds={PAUSE_BREATH_SECONDS} onDone={() => setIsBreathDone(true)} />
              </View>
            ) : strength === 'locked' && p.until ? (
              <Text variant="label" tone="muted" style={styles.ring}>
                {t('shield.unlocksAt', { time: formatRuleTime(p.until) })}
              </Text>
            ) : null}
            <Text variant="meta" tone="muted" style={styles.why}>
              {t('shield.why')}
            </Text>
            <View style={styles.chips}>
              {REASONS.map((r) => (
                <Chip
                  key={r}
                  testID={`shield.reason.${r}`}
                  label={t(`shield.reasons.${r}`)}
                  surface="canvas"
                  selected={reason === r}
                  onPress={() => setReason(r)}
                />
              ))}
            </View>
          </View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('shield.swapA11y')}
            onPress={() => router.replace('/challenges')}
            style={styles.swap}>
            <View style={styles.swapTile}>
              <Icon name="reading" size={size.icon.sm} color={color.text.onAccent} />
            </View>
            <View style={styles.flex}>
              <Text variant="label.strong">{t('shield.swapTitle')}</Text>
              <Text variant="caption" tone="muted">
                {t('shield.swapSub', { points: 15 })}
              </Text>
            </View>
            <Text variant="label.strong" tone="accent">
              {t('common.start')}
            </Text>
          </PressableScale>
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            testID="shield.close"
            label={t('shield.close', { app: appName })}
            compact
            onPress={handleClose}
          />
          {strength === 'locked' ? null : (
            <PrimaryButton
              testID="shield.spend"
              label={
                canSpend
                  ? t('shield.spend', { minutes: EARN_SPEND_MINUTES, left: minutesLeft })
                  : t('shield.noMinutes')
              }
              variant="outline"
              compact
              disabled={!isBreathDone || !canSpend}
              onPress={handleSpend}
            />
          )}
        </View>
      </SafeAreaView>
      <DevSkip label="DEV · Skip breath" onSkip={() => setIsBreathDone(true)} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  content: { paddingHorizontal: S.x, paddingTop: space.huge, paddingBottom: space.xl },
  center: { alignItems: 'center' },
  title: { marginTop: space.lg },
  sub: { marginTop: space.sm, paddingHorizontal: space.xxl },
  ring: { marginTop: space.xxl },
  why: { marginTop: space.xxl },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.md,
  },
  swap: {
    marginTop: space.xxl,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingVertical: S.cardPaddingY,
    paddingHorizontal: S.cardPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  swapTile: {
    width: size.suggestionTile,
    height: size.suggestionTile,
    ...rounded(size.appTile.xl.radius),
    backgroundColor: color.mood.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  footer: {
    gap: layout.state.actionsGap,
    paddingHorizontal: S.x,
    paddingBottom: layout.onboarding.footerBottom,
  },
});
