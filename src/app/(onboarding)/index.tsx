import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, StarField, Text } from '@/design/components';
import { color, layout } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';
import { GhostScene } from '@/features/onboarding/components/splash/GhostScene';
import { SCENE_WIDTH, starLines, stars } from '@/features/onboarding/components/splash/sceneData';
import {
  goNext,
  isResumePending,
  markResumeHandled,
  markShown,
} from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { hrefForStep } from '@/features/onboarding/steps';
import { useSettingsStore } from '@/features/settings/store';
import { useT } from '@/i18n';

/** 8 s loop (ghost-loop-reference.svg keyTimes 0 / .12 / .45 / .88 / 1). */
const EASE = Easing.bezier(0.5, 0, 0.2, 1);
const HOLD_TANGLED = 960;
const TO_UNTANGLED = 2640;
const HOLD_UNTANGLED = 3440;
const TO_TANGLED = 960;

/** Onboarding 01 · Splash. */
export default function Splash() {
  const t = useT();
  const isOnboarded = useSettingsStore((s) => s.onboarded);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  // Killed mid-flow last time? Pick up at the last unfinished step (once per launch).
  const [resumeTo] = useState<Href | null>(() => {
    const { lastStep } = useOnboardingStore.getState();
    return isResumePending() && !isOnboarded && lastStep > 1 ? hrefForStep(lastStep) : null;
  });

  useEffect(() => {
    markShown(1);
    markResumeHandled();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withSequence(
        withDelay(HOLD_TANGLED, withTiming(1, { duration: TO_UNTANGLED, easing: EASE })),
        withDelay(HOLD_UNTANGLED, withTiming(0, { duration: TO_TANGLED, easing: EASE })),
      ),
      -1,
    );
  }, [reduceMotion, progress]);

  if (isOnboarded) return <Redirect href="/today" />;
  if (resumeTo) return <Redirect href={resumeTo} />;

  const scale = width / SCENE_WIDTH;

  return (
    <View style={styles.root}>
      <View style={styles.stars} pointerEvents="none">
        <StarField
          stars={stars}
          lines={starLines}
          tileWidth={SCENE_WIDTH}
          height={layout.splash.starsHeight}
          width={width}
        />
      </View>
      <View style={[styles.scene, { top: layout.splash.sceneTop * scale }]} pointerEvents="none">
        <GhostScene progress={progress} width={width} />
      </View>

      <View
        style={[styles.bottom, { paddingBottom: insets.bottom + layout.onboarding.footerBottom }]}>
        <Text variant="title.l" accessibilityRole="header" style={styles.title}>
          {t('onboarding.splash.title')}
        </Text>
        <Text variant="body.lead" tone="secondary" style={styles.body}>
          {t('onboarding.splash.body')}
        </Text>
        <View style={styles.cta}>
          <PrimaryButton
            label={t('onboarding.splash.cta')}
            variant="accent"
            icon="arrowRight"
            onPress={() => goNext(1)}
          />
        </View>
        <Text variant="meta" tone="muted" align="center" style={styles.footnote}>
          {t('onboarding.splash.footnote')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  stars: { position: 'absolute', top: 0, left: 0, right: 0 },
  scene: { position: 'absolute', left: 0, right: 0 },
  bottom: { flex: 1, justifyContent: 'flex-end' },
  title: { paddingHorizontal: layout.splash.titleX },
  body: {
    marginTop: layout.splash.bodyTop,
    paddingLeft: layout.splash.bodyLeft,
    paddingRight: layout.splash.bodyRight,
  },
  cta: { marginTop: layout.splash.ctaTop, paddingHorizontal: layout.onboarding.optionsX },
  footnote: { marginTop: layout.splash.footnoteTop },
});
