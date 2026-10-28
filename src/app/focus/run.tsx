import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTileRow, Countdown, Icon, PrimaryButton, ProgressBar, Text } from '@/design/components';
import { color, layout, pill, radius, rounded, size, space } from '@/design/tokens';
import { focusSelection } from '@/features/focus/focusApps';
import { earnedMinutesFor } from '@/features/focus/machine';
import { useFocusStore } from '@/features/focus/store';
import { FOCUS_SUGGESTIONS } from '@/features/focus/suggestions';
import { passesLeftThisWeek } from '@/features/rules/emergencyPasses';
import { selectionTiles } from '@/features/rules/present';
import { useRulesStore } from '@/features/rules/store';
import { DevSkip } from '@/features/dev/DevSkip';
import { useT } from '@/i18n';
import { formatClock } from '@/lib/format';

const S = layout.screen;
const SHOWN_TILES = 6;

/**
 * FFocusRun (fullScreenModal, no gestures, Android back = no-op). The session lives in the OS;
 * this screen only shows it. Killing the app doesn't end it: on relaunch the store rehydrates
 * from `endsAt`, and this screen redirects to Focus done once it's over.
 */
export default function FocusRun() {
  const t = useT();
  const session = useFocusStore((s) => s.session);
  const own = useFocusStore((s) => s.selection);
  const rules = useRulesStore((s) => s.rules);
  const passLog = useRulesStore((s) => s.passLog);
  const progress = useSharedValue(0);
  const [now] = useState(() => Date.now());

  // Android back: swallowed while the session runs (it can't be stopped early).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const startedAt = session.status === 'running' ? session.startedAt : 0;
  const endsAt = session.status === 'running' ? session.endsAt : 0;
  useEffect(() => {
    if (session.status === 'done') router.replace('/focus/done');
  }, [session.status]);
  useFrameCallback(() => {
    if (endsAt === 0) return;
    progress.set(Math.min(1, Math.max(0, (Date.now() - startedAt) / (endsAt - startedAt))));
  });

  if (session.status !== 'running') {
    return <Redirect href={session.status === 'done' ? '/focus/done' : '/today'} />;
  }

  const selection = focusSelection(rules, own);
  const tiles = selection ? selectionTiles({ id: 'focus', apps: selection }) : [];
  const passesLeft = passesLeftThisWeek(passLog, now);

  return (
    <>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.top}>
            <View style={styles.lockedPill}>
              <Icon
                name={session.isTimerOnly ? 'lockOpen' : 'lock'}
                size={size.icon.xs - 2}
                color={color.text.onAccent}
              />
              <Text variant="meta.strong" tone="onAccent">
                {t(session.isTimerOnly ? 'focus.run.timerOnly' : 'focus.run.locked')}
              </Text>
            </View>
            <Text variant="meta" tone="muted">
              {t('focus.run.lockInMinutes', { minutes: session.minutes })}
            </Text>
          </View>
          <Text variant="meta" tone="muted" style={styles.timeLeft}>
            {t('focus.run.timeLeft')}
          </Text>
          <View style={styles.tiles}>
            <Countdown
              testID="focus.run.countdown"
              endsAt={session.endsAt}
              format="tiles"
              onEnd={() => useFocusStore.getState().dispatch({ type: 'tick', now: Date.now() })}
            />
          </View>
          <Text variant="body" style={styles.endsAt}>
            {t('focus.run.endsAt', { time: formatClock(session.endsAt) })}
          </Text>
          <View style={styles.progress}>
            <ProgressBar progress={progress} track="canvas" thickness="thick" />
          </View>
          {session.isTimerOnly ? null : (
            <>
              <View style={styles.label}>
                <Text variant="label" tone="muted">
                  {t('focus.run.lockedNow')}
                </Text>
                <Text variant="label" tone="muted">
                  {t('focus.run.apps', { count: session.lockedCount })}
                </Text>
              </View>
              <AppTileRow apps={tiles} total={session.lockedCount} max={SHOWN_TILES} size="xxl" />
            </>
          )}
          <View style={styles.label}>
            <Text variant="label" tone="muted">
              {t('focus.run.useTheTime')}
            </Text>
          </View>
          <View style={styles.group}>
            {FOCUS_SUGGESTIONS.map((s, i) => (
              <View
                key={s.id}
                style={[styles.suggestion, i > 0 && styles.separator]}
                accessible
                accessibilityLabel={`${t(`focus.suggestions.${s.id}.title`)}, ${t(
                  `focus.suggestions.${s.id}.sub`,
                )}, +${s.points}`}>
                <View style={[styles.suggestionTile, tileTones[s.tone]]}>
                  <Icon name={s.icon} size={size.icon.xs} color={color.text.onAccent} />
                </View>
                <View style={styles.flex}>
                  <Text variant="body">{t(`focus.suggestions.${s.id}.title`)}</Text>
                  <Text variant="caption" tone="muted">
                    {t(`focus.suggestions.${s.id}.sub`)}
                  </Text>
                </View>
                <Text variant="label.strong" tone={s.tone}>
                  +{s.points}
                </Text>
              </View>
            ))}
          </View>
          {session.isTimerOnly ? null : (
            <Text variant="meta" tone="muted" align="center" style={styles.earn}>
              {t('focus.run.youllEarn', { minutes: earnedMinutesFor(session.minutes) })}
            </Text>
          )}
        </ScrollView>
        {session.isTimerOnly ? null : (
          <View style={styles.footer}>
            <PrimaryButton
              testID="focus.run.emergency"
              label={t('focus.run.emergency', { count: passesLeft })}
              variant="outline"
              compact
              onPress={() => router.push(passesLeft > 0 ? '/focus/emergency' : '/focus/no-passes')}
            />
          </View>
        )}
      </SafeAreaView>
      <DevSkip
        label="DEV · End session"
        onSkip={() => useFocusStore.getState().dispatch({ type: 'tick', now: endsAt })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  content: { paddingHorizontal: S.x, paddingTop: S.top, paddingBottom: space.xl },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lockedPill: {
    height: size.pillButton,
    ...pill(size.pillButton),
    paddingHorizontal: space.md + 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    backgroundColor: color.accent.primary,
  },
  timeLeft: { marginTop: space.xxl + 6, paddingHorizontal: S.titleX - S.x },
  tiles: { marginTop: space.md },
  endsAt: { marginTop: space.lg, paddingHorizontal: S.titleX - S.x },
  progress: { marginTop: space.sm + 2, paddingHorizontal: S.titleX - S.x },
  label: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.xxl + 2,
    marginBottom: space.sm,
    paddingHorizontal: S.labelX - S.x,
  },
  group: { ...rounded(radius.m), backgroundColor: color.bg.raised, overflow: 'hidden' },
  suggestion: {
    height: size.suggestionRow,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  separator: { borderTopWidth: size.hairline, borderTopColor: color.border.hairline },
  suggestionTile: {
    width: size.iconTile,
    height: size.iconTile,
    ...rounded(size.appTile.m.radius),
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  earn: { marginTop: space.xxl },
  footer: { paddingHorizontal: S.x, paddingBottom: layout.onboarding.footerBottom },
});

const tileTones = StyleSheet.create({
  pink: { backgroundColor: color.mood.pink },
  sky: { backgroundColor: color.mood.sky },
  peri: { backgroundColor: color.mood.peri },
  green: { backgroundColor: color.mood.green },
  orange: { backgroundColor: color.mood.orange },
});
