import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ghost, PrimaryButton, StarField, Text } from '@/design/components';
import { color, layout, radius, rounded, space } from '@/design/tokens';
import { challengeById } from '@/features/challenges/library';
import { currentClarity } from '@/features/clarity/score';
import { useClarityStore } from '@/features/clarity/clarityStore';
import { SCENE_WIDTH, stars } from '@/features/onboarding/components/splash/sceneData';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { useScoringStore } from '@/features/scoring/store';
import { useT } from '@/i18n';
import { dayKey } from '@/lib/time';
import { ledgerSince } from '@/storage/ledgerRepo';

const WEEK = 7 * 24 * 60 * 60 * 1000;
const STARS_OPACITY = 0.6;
const GHOST_WIDTH = 168;

/**
 * OxDone · after any challenge. Happy ghost, "Done.", a plain line "+20 pts · Clarity 74 +2"
 * (no chip), a "why it helps" card for the challenge type and two small stats.
 */
export default function ChallengeDone() {
  const t = useT();
  const { width } = useWindowDimensions();
  const { id, points } = useLocalSearchParams<{ id?: string; points?: string }>();
  const def = id ? challengeById(id) : undefined;
  const [now] = useState(() => Date.now());
  const startingClarity = useOnboardingStore((s) => s.startingClarity);
  const habit = useScoringStore((s) => (s.firstDay ? s.clarity(now) : null));
  const dayStart = useClarityStore((s) =>
    s.dayStart?.day === dayKey(now) ? s.dayStart.value : null,
  );
  const clarity = currentClarity(startingClarity, habit);
  const delta = dayStart === null ? 0 : clarity - dayStart;
  const [weekCount] = useState(
    () => ledgerSince(now - WEEK).filter((e) => e.kind === 'challenge' && e.ref === id).length,
  );
  const kind = def?.kind ?? 'word';

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
          <Ghost mood={1} width={GHOST_WIDTH} />
        </View>
        <Text variant="display.silenceSec" align="center" accessibilityRole="header">
          {t('challenges.done.title')}
        </Text>
        <Text variant="body.strong" align="center" style={styles.line}>
          <Text variant="body.strong" tone="pink">
            {t('challenges.done.points', { points: Number(points ?? 0) })}
          </Text>
          {t('challenges.done.clarity', { value: clarity })}
          {delta > 0 ? (
            <Text variant="body.strong" tone="green">
              {` +${delta}`}
            </Text>
          ) : null}
        </Text>
        <View style={styles.card}>
          <Text variant="body.xl">{t(`challenges.done.why.${kind}`)}</Text>
          <View style={styles.stats}>
            <View style={styles.stat} accessible>
              <Text variant="stat.s">
                {t('challenges.done.ordinal', { count: Math.max(1, weekCount) })}
              </Text>
              <Text variant="caption" tone="muted">
                {t(`challenges.done.weekStat.${kind}`)}
              </Text>
            </View>
            <View style={styles.stat} accessible>
              <Text variant="stat.s">{useScoringStore.getState().streak(now)}</Text>
              <Text variant="caption" tone="muted">
                {t('challenges.done.streak')}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          testID="challenge.done.back"
          label={t('focus.done.back')}
          variant="light"
          icon="arrowRight"
          onPress={() => router.replace('/today')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  stars: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { flex: 1, paddingHorizontal: layout.onboarding.optionsX },
  ghost: { alignItems: 'center', marginTop: space.huge },
  line: { marginTop: space.lg },
  card: {
    marginTop: space.xxl,
    ...rounded(radius.l),
    backgroundColor: color.bg.surface,
    paddingVertical: space.xxl,
    paddingHorizontal: space.xxl + 2,
  },
  stats: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  stat: {
    flex: 1,
    ...rounded(radius.l),
    backgroundColor: color.bg.canvas,
    paddingVertical: space.md,
    paddingHorizontal: space.md + 2,
  },
  footer: {
    paddingHorizontal: layout.onboarding.optionsX,
    paddingBottom: layout.onboarding.footerBottom,
  },
});
