import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Button, Glow, ProgressDots, Screen, Text } from '@/design/components';
import { BrainPan, GameTiles, PausedPhone } from '@/design/illustrations';
import { color, layout, space } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';
import { useT } from '@/i18n';

import { useTrackStep } from '../components/OnboardingFrame';
import { useOnboardingStore } from '../onboardingStore';
import { hrefFor, resumeStep } from '../steps';

const SLIDES = ['block', 'play', 'grow'] as const;
/** The illustration's enter on each slide (§2.1). */
const ART_ENTER_MS = 240;

function SlideArt({ active, children }: { active: boolean; children: ReactNode }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    p.set(active ? withTiming(1, { duration: reduced ? 0 : ART_ENTER_MS }) : 0);
  }, [active, p, reduced]);
  const style = useAnimatedStyle(() => ({
    opacity: p.get(),
    transform: [{ scale: reduced ? 1 : 0.94 + 0.06 * p.get() }],
  }));
  return <Animated.View style={[styles.art, style]}>{children}</Animated.View>;
}

/** Kept for tests; resume no longer needs process state. */
export function resetWelcomeResume() {}

/**
 * The onboarding entry ("/"). Reopens on the saved screen after the app was killed (§1 Resume),
 * otherwise shows the welcome slides.
 */
export function WelcomeScreen() {
  // `?welcome=1` = Back from Age rebuilt this screen: show the slides, don't resume.
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const [saved] = useState(() => (welcome ? 'index' : useOnboardingStore.getState().step));
  if (saved !== 'index') return <Redirect href={hrefFor(resumeStep(saved))} />;
  return <WelcomeSlides />;
}

/** §2.1 Welcome, version B: three slides, one "Get started" button that walks them. */
function WelcomeSlides() {
  const t = useT();
  useTrackStep('index');
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };
  const next = () => {
    if (index < SLIDES.length - 1) {
      scroller.current?.scrollTo({ x: (index + 1) * width, animated: true });
      setIndex(index + 1);
    } else router.push(hrefFor('age'));
  };

  const art = (k: (typeof SLIDES)[number]) => {
    if (k === 'block') return <PausedPhone caption={t('onboarding.welcome.art.paused')} />;
    if (k === 'play')
      return (
        <GameTiles
          word={t('onboarding.welcome.art.word')}
          labels={{
            pattern: t('onboarding.welcome.art.pattern'),
            noRed: t('onboarding.welcome.art.noRed'),
            pairs: t('onboarding.welcome.art.pairs'),
            letters: t('onboarding.welcome.art.letters'),
          }}
        />
      );
    return <BrainPan />;
  };

  return (
    <Screen
      testID="onboarding.index"
      gutter="none"
      background={<Glow tint={color.brand.violet} cy={0.28} strength={0.2} />}
      footer={
        <View style={styles.footer}>
          <ProgressDots count={SLIDES.length} index={index} testID="onboarding.welcome.dots" />
          <Button
            testID="onboarding.index.cta"
            label={t('onboarding.welcome.cta')}
            onPress={next}
          />
        </View>
      }>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.flex}>
        {SLIDES.map((k, i) => (
          <View
            key={k}
            style={[styles.slide, { width }]}
            testID={`onboarding.welcome.slide.${k}`}
            accessibilityElementsHidden={i !== index}
            importantForAccessibility={i === index ? 'auto' : 'no-hide-descendants'}>
            <SlideArt active={i === index}>{art(k)}</SlideArt>
            <View style={styles.text}>
              <Text variant="titleLg" accessibilityRole="header">
                {t(`onboarding.welcome.${k}.title`)}
              </Text>
              <Text variant="body" tone="body">
                {t(`onboarding.welcome.${k}.body`)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  slide: { flex: 1, paddingHorizontal: layout.gutterOnboarding, paddingTop: space['4xl'] },
  art: { flex: 1, minHeight: '40%', marginBottom: space['2xl'] },
  text: { gap: space.md },
  footer: { paddingHorizontal: layout.gutterOnboarding, gap: space.xl },
});
