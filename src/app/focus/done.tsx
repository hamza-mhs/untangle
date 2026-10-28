import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ghost, PrimaryButton, StarField, StatCard, Text } from '@/design/components';
import { color, layout, pill, radius, rounded, size, space } from '@/design/tokens';
import { useChallengesStore } from '@/features/challenges/store';
import { currentClarity } from '@/features/clarity/score';
import { useClarityStore } from '@/features/clarity/clarityStore';
import { LADDER_RUNGS, LADDER_STEP, nextSessionMinutes, rungFor } from '@/features/focus/ladder';
import { longestLocked, useFocusStore } from '@/features/focus/store';
import { SCENE_WIDTH, stars } from '@/features/onboarding/components/splash/sceneData';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { useScoringStore } from '@/features/scoring/store';
import { useT } from '@/i18n';
import { dayKey } from '@/lib/time';
import { haptics } from '@/lib/haptics';

const S = layout.screen;
const STARS_OPACITY = 0.6;

/**
 * FFocusDone · the reward. Shown on the next open if the session ended while the app was closed
 * (the end notification deep-links here too). "Back to today" acknowledges it.
 */
export default function FocusDone() {
  const t = useT();
  const { width } = useWindowDimensions();
  const session = useFocusStore((s) => s.session);
  const history = useFocusStore((s) => s.history);
  const draw = useChallengesStore((s) => s.draw);
  const startingClarity = useOnboardingStore((s) => s.startingClarity);
  const [now] = useState(() => Date.now());
  const habit = useScoringStore((s) => (s.firstDay ? s.clarity(now) : null));
  const dayStartClarity = useClarityStore((s) =>
    s.dayStart?.day === dayKey(now) ? s.dayStart.value : null,
  );

  useEffect(() => {
    if (session.status === 'done') haptics.success();
  }, [session.status]);

  if (session.status !== 'done') return <Redirect href="/today" />;

  const clarity = currentClarity(startingClarity, habit);
  const clarityDelta = dayStartClarity === null ? null : clarity - dayStartClarity;
  const knotsLoose = draw ? draw.done.length : 0;
  const next = nextSessionMinutes(longestLocked(history));
  const rung = rungFor(session.minutes);

  const handleBack = () => {
    useFocusStore.getState().dispatch({ type: 'acknowledge' });
    router.replace('/today');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.stars} pointerEvents="none">
        <StarField
          stars={stars}
          tileWidth={SCENE_WIDTH}
          height={layout.splash.starsHeight}
          width={width}
          opacity={STARS_OPACITY}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.ghost}>
          <Ghost animated width={size.ghost.done} />
        </View>
        <Text variant="title.xl" accessibilityRole="header" style={styles.title}>
          {t('focus.done.title')}
        </Text>
        <Text variant="body.lead" tone="secondary" style={styles.sub}>
          {t('focus.done.sub', { minutes: session.minutes, count: knotsLoose })}
        </Text>
        <View style={styles.stats}>
          <StatCard
            layout="stacked"
            label={t('focus.done.earned')}
            value={t('focus.done.earnedValue', { minutes: session.earnedMinutes })}
            sub={t('focus.done.appTime')}
            subTone="accent"
          />
          <StatCard
            layout="stacked"
            label={t('focus.done.points')}
            value={`+${session.points}`}
            sub={session.isTimerOnly ? t('focus.done.timerOnly') : t('focus.done.verified')}
            subTone={session.isTimerOnly ? 'muted' : 'success'}
          />
          <StatCard
            layout="stacked"
            label={t('focus.done.clarity')}
            value={String(clarity)}
            sub={
              clarityDelta === null || clarityDelta === 0
                ? t('focus.done.clarityToday')
                : t('focus.done.clarityDelta', { delta: clarityDelta })
            }
            subTone={clarityDelta && clarityDelta > 0 ? 'success' : 'muted'}
          />
        </View>
        <Text variant="meta" tone="muted" style={styles.ladderLabel}>
          {t('focus.done.ladder')}
        </Text>
        <View
          style={styles.ladder}
          accessible
          accessibilityLabel={t('focus.done.ladderA11y', {
            minutes: next,
            rung,
            total: LADDER_RUNGS,
          })}>
          <View style={styles.ladderTop}>
            <Text variant="label.strong">{t('focus.done.next', { minutes: next })}</Text>
            <Text variant="label" tone="muted">
              {t('focus.done.step', { minutes: LADDER_STEP })}
            </Text>
          </View>
          <View style={styles.segments}>
            {Array.from({ length: LADDER_RUNGS }, (_, i) => (
              <View key={i} style={[styles.segment, i < rung && styles.segmentOn]} />
            ))}
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          testID="focus.done.back"
          label={t('focus.done.back')}
          variant="light"
          icon="arrowRight"
          compact
          onPress={handleBack}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  stars: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { flex: 1, paddingHorizontal: S.x },
  ghost: { alignItems: 'center', marginTop: space.huge * 2 },
  title: { marginTop: space.xxl, paddingHorizontal: S.titleX - S.x },
  sub: { marginTop: space.xs, paddingHorizontal: S.titleX - S.x },
  stats: { flexDirection: 'row', gap: space.sm, marginTop: space.xxl },
  ladderLabel: { marginTop: space.xxl, paddingHorizontal: S.titleX - S.x },
  ladder: {
    marginTop: space.sm,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingVertical: S.cardPaddingY,
    paddingHorizontal: S.cardPaddingX,
  },
  ladderTop: { flexDirection: 'row', justifyContent: 'space-between' },
  segments: { flexDirection: 'row', gap: space.xs, marginTop: space.sm + 2 },
  segment: {
    flex: 1,
    height: size.progressThick,
    ...pill(size.progressThick),
    backgroundColor: color.bg.raisedHigh,
  },
  segmentOn: { backgroundColor: color.accent.primary },
  footer: { paddingHorizontal: S.x, paddingBottom: layout.onboarding.footerBottom },
});
