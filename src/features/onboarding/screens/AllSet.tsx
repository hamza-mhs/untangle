import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Icon, PressableScale, Text } from '@/design/components';
import { ShieldCheck } from '@/design/illustrations';
import { color, motion, radius, size, space } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';
import { useT } from '@/i18n';
import { useLocksStore } from '@/features/locks';

import { OnboardingFrame } from '../components/OnboardingFrame';
import { appNamesSummary } from '../logic';
import { useOnboardingStore } from '../onboardingStore';
import { askFor, usePermissionFlow } from '../permissionFlow';
import type { Permission } from '../permissions';

/** Checklist ticks appear one after another (§2.19). */
const TICK_STAGGER_MS = 150;
const SHIELD = 72;

function CheckRow({
  index,
  label,
  on,
  offLabel,
  onFix,
  testID,
}: {
  index: number;
  label: string;
  on: boolean;
  offLabel: string;
  onFix?: () => void;
  testID: string;
}) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced)
      p.set(withDelay(index * TICK_STAGGER_MS, withTiming(1, { duration: motion.duration.fast })));
  }, [index, p, reduced]);
  const style = useAnimatedStyle(() => ({
    opacity: p.get(),
    transform: [{ scale: 0.6 + 0.4 * p.get() }],
  }));
  const body = (
    <>
      <Animated.View style={[styles.check, on ? styles.checkOn : styles.checkOff, style]}>
        {on ? <Icon name="check" size={size.icon.xs} color={color.text.onLight} /> : null}
      </Animated.View>
      <Text variant="bodyStrong" style={styles.flex}>
        {label}
      </Text>
      {on ? null : (
        <Text variant="caption" tone="warning">
          {offLabel}
        </Text>
      )}
    </>
  );
  if (on || !onFix) {
    return (
      <View
        testID={testID}
        style={styles.checkRow}
        accessible
        accessibilityLabel={on ? label : `${label}, ${offLabel}`}>
        {body}
      </View>
    );
  }
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${offLabel}`}
      onPress={onFix}
      style={styles.checkRow}>
      {body}
    </PressableScale>
  );
}

/** §2.19 You're all set. Onboarding completes when the user leaves this screen. */
export function AllSetScreen() {
  const t = useT();
  const granted = usePermissionFlow((s) => s.granted);
  const complete = useOnboardingStore((s) => s.complete);
  const locks = useLocksStore((s) => s.locks);
  const apps = locks.filter((l) => l.target.kind === 'app');
  const names = locks.map((l) => (l.target.kind === 'app' ? l.target.label : l.target.domain));

  useFocusEffect(
    useCallback(() => {
      void usePermissionFlow.getState().refresh();
    }, []),
  );

  const summary = appNamesSummary(names);
  const list =
    summary.more > 0
      ? t('onboarding.allSet.namesMore', {
          a: summary.shown[0],
          b: summary.shown[1],
          count: summary.more,
        })
      : summary.shown.length === 1
        ? (summary.shown[0] ?? '')
        : summary.shown.length === 2
          ? t('onboarding.allSet.namesTwo', { a: summary.shown[0], b: summary.shown[1] })
          : t('onboarding.allSet.namesThree', {
              a: summary.shown[0],
              b: summary.shown[1],
              c: summary.shown[2],
            });

  // Completing flips the root guard to the tabs, so it happens on the way out.
  // The first training round arrives with the games (Batch 3.1); until then both go Home.
  const leave = () => {
    complete();
    router.replace('/');
  };

  const rows: { key: Permission; label: string }[] = [
    { key: 'accessibility', label: t('onboarding.allSet.rows.accessibility') },
    { key: 'usage', label: t('onboarding.allSet.rows.usage') },
    { key: 'battery', label: t('onboarding.allSet.rows.battery') },
  ];

  return (
    <OnboardingFrame
      step="all-set"
      layout="story"
      glow={color.signal.success}
      title={t('onboarding.allSet.title')}
      body={names.length ? t('onboarding.allSet.body', { list }) : t('onboarding.allSet.bodyNone')}
      cta={{ label: t('onboarding.allSet.cta'), onPress: leave, variant: 'brand' }}
      secondary={{
        label: t('onboarding.allSet.home'),
        onPress: leave,
        testID: 'onboarding.all-set.home',
      }}>
      <View style={styles.top}>
        <View style={styles.shield}>
          <ShieldCheck />
        </View>
        <View style={styles.rows}>
          {rows.map((r, i) => (
            <CheckRow
              key={r.key}
              testID={`onboarding.allSet.${r.key}`}
              index={i}
              label={r.label}
              on={granted[r.key]}
              offLabel={t('onboarding.allSet.off')}
              onFix={() => void askFor(r.key)}
            />
          ))}
          <CheckRow
            testID="onboarding.allSet.blocked"
            index={rows.length}
            label={t('onboarding.allSet.rows.blocked', { count: apps.length })}
            on={apps.length > 0}
            offLabel={t('onboarding.allSet.off')}
          />
        </View>
      </View>
    </OnboardingFrame>
  );
}

const CHECK = 20;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flex: 1, gap: space['2xl'], paddingTop: space.lg },
  shield: { width: SHIELD, height: SHIELD },
  rows: { gap: space.md },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.touch - space.md,
  },
  check: {
    width: CHECK,
    height: CHECK,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: color.signal.success },
  checkOff: { backgroundColor: color.signal.warning },
});
