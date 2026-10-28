import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Ghost, PrimaryButton, Screen, Text } from '@/design/components';
import { color, layout, radius, rounded } from '@/design/tokens';
import { useResumeCheck } from '@/features/onboarding/hooks/useResumeCheck';
import { replaceWithStep } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { DevSkip } from '@/features/dev/DevSkip';
import { useT } from '@/i18n';
import { blocking } from '@/services/blocking';

const S = layout.state;

/**
 * E01 · Screen Time denied. Apple doesn't document whether asking again after a denial shows
 * the prompt, so this is built for the worst case: "Try again" re-requests (and we re-check
 * when the user comes back from Settings); the card gives the Settings path.
 * "Continue without blocking" carries on in no-blocking mode, skipping the app picker.
 */
export default function ScreenTimeDenied() {
  const t = useT();
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const [isRetrying, setIsRetrying] = useState(false);

  const onApproved = () => {
    setAnswer('blocking', 'approved');
    replaceWithStep(stepOf('pick-apps'));
  };

  useResumeCheck(async () => {
    if ((await blocking.getAuthorization()) === 'approved') onApproved();
  });

  const handleRetry = async () => {
    setIsRetrying(true);
    const result = await blocking.requestAuthorization();
    setIsRetrying(false);
    if (result.ok) onApproved();
  };

  const handleSkip = () => {
    setAnswer('blocking', 'skipped');
    replaceWithStep(stepOf('notifications'));
  };

  return (
    <>
      <Screen
        scroll
        footer={
          <View style={styles.actions}>
            <PrimaryButton
              testID="e01.retry"
              label={t('edge.screenTimeDenied.retry')}
              compact
              loading={isRetrying}
              onPress={() => void handleRetry()}
            />
            <PrimaryButton
              testID="e01.skip"
              label={t('edge.screenTimeDenied.skip')}
              variant="outline"
              compact
              onPress={handleSkip}
            />
          </View>
        }>
        <View style={styles.ghost}>
          <Ghost mood={0} width={S.ghostWidth} />
        </View>
        <View style={styles.texts}>
          <Text variant="title.s" align="center" accessibilityRole="header">
            {t('edge.screenTimeDenied.title')}
          </Text>
          <Text variant="body" tone="muted" align="center" style={styles.body}>
            {t('edge.screenTimeDenied.body')}
          </Text>
        </View>
        <View style={styles.card}>
          <Text variant="caption" tone="muted" style={styles.cardLabel}>
            {t('edge.screenTimeDenied.pathLabel')}
          </Text>
          <Text variant="body.s" tone="secondary">
            {t('edge.screenTimeDenied.path')}
            <Text variant="label.bold">{t('edge.screenTimeDenied.pathApp')}</Text>
          </Text>
        </View>
      </Screen>
      <DevSkip label="DEV · Approve" onSkip={onApproved} />
    </>
  );
}

const styles = StyleSheet.create({
  ghost: { alignItems: 'center', marginTop: S.ghostTop },
  texts: { marginTop: S.titleTop, paddingHorizontal: S.textX },
  body: { marginTop: S.bodyTop },
  card: {
    marginTop: S.cardTop,
    marginHorizontal: layout.gutter,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingVertical: S.cardPaddingY,
    paddingHorizontal: S.cardPaddingX,
  },
  cardLabel: { marginBottom: S.cardLabelGap },
  actions: { gap: S.actionsGap, paddingHorizontal: layout.gutter - layout.onboarding.optionsX },
});
