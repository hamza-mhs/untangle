import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Ghost, PrimaryButton, StarField, Text } from '@/design/components';
import { color, layout, pill } from '@/design/tokens';
import { startingClarity } from '@/features/clarity/score';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { SCENE_WIDTH, stars } from '@/features/onboarding/components/splash/sceneData';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { useT } from '@/i18n';

const STEP = stepOf('knot-loosened');
const K = layout.knot;
const STARS_OPACITY = 0.6;

/** Onboarding 13 · the reward: happiest ghost and the starting Clarity (30–55). */
export default function KnotLoosened() {
  const t = useT();
  const { width } = useWindowDimensions();
  const stored = useOnboardingStore((s) => s.startingClarity);
  const screenTime = useOnboardingStore((s) => s.screenTime);
  const when = useOnboardingStore((s) => s.when);
  const clarity = stored ?? startingClarity({ screenTime, when });

  return (
    <View style={styles.root}>
      <OnboardingScreen
        step={STEP}
        contentStyle={styles.content}
        footer={
          <PrimaryButton
            testID="knot.continue"
            label={t('onboarding.knotLoosened.cta')}
            variant="light"
            icon="arrowRight"
            onPress={() => goNext(STEP)}
          />
        }>
        <View style={styles.ghost}>
          <Ghost mood={1} width={K.ghostWidth} />
        </View>
        <Text variant="title.l" accessibilityRole="header" style={styles.title}>
          {t('onboarding.knotLoosened.title')}
        </Text>
        <Text variant="body.xl.regular" tone="secondary" style={styles.body}>
          {t('onboarding.knotLoosened.body')}
        </Text>
        <View
          style={styles.card}
          accessible
          accessibilityLabel={t('onboarding.knotLoosened.clarityA11y', { value: clarity })}>
          <Text variant="body.l">{t('onboarding.knotLoosened.clarityLabel')}</Text>
          <Text testID="knot.clarity" variant="title.m">
            {clarity}
          </Text>
        </View>
      </OnboardingScreen>
      <View style={styles.stars} pointerEvents="none">
        <StarField
          stars={stars}
          tileWidth={SCENE_WIDTH}
          height={K.starsHeight}
          width={width}
          opacity={STARS_OPACITY}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  stars: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { marginTop: K.ghostTop, paddingHorizontal: 0 },
  ghost: { alignItems: 'center' },
  title: { marginTop: K.titleTop, paddingHorizontal: layout.onboarding.titleX },
  body: {
    marginTop: K.bodyTop,
    paddingLeft: layout.onboarding.subtitleX,
    paddingRight: K.bodyRight,
  },
  card: {
    marginTop: K.cardTop,
    marginHorizontal: layout.onboarding.optionsX,
    height: K.cardHeight,
    ...pill(K.cardHeight),
    backgroundColor: color.bg.raised,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: K.cardPaddingX,
  },
});
