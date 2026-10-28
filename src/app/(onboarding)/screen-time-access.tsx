import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { PrimaryButton } from '@/design/components';
import { layout } from '@/design/tokens';
import { CoachDialog } from '@/features/onboarding/components/coach/CoachDialog';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { RichSubtitle } from '@/features/onboarding/components/RichSubtitle';
import { useResumeCheck } from '@/features/onboarding/hooks/useResumeCheck';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { DevSkip } from '@/features/dev/DevSkip';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { blocking } from '@/services/blocking';

const STEP = stepOf('screen-time-access');

/**
 * Onboarding 09 · coach the Screen Time dialog, then show it. Approved → OB10, denied → E01.
 * Android opens Settings instead (`pending`); we check again when the app comes back.
 */
export default function ScreenTimeAccess() {
  const t = useT();
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const [isRequesting, setIsRequesting] = useState(false);

  const approve = () => {
    setAnswer('blocking', 'approved');
    goNext(STEP);
  };

  useResumeCheck(async () => {
    if ((await blocking.getAuthorization()) === 'approved') approve();
  });

  const handleShow = async () => {
    setIsRequesting(true);
    const result = await blocking.requestAuthorization();
    setIsRequesting(false);
    if (result.ok) {
      approve();
      return;
    }
    if (result.error === 'pending') return;
    haptics.warning();
    setAnswer('blocking', 'denied');
    router.push('/screen-time-denied');
  };

  return (
    <>
      <OnboardingScreen
        step={STEP}
        title={t('onboarding.screenTimeAccess.title')}
        subtitle={
          <RichSubtitle
            parts={[
              t('onboarding.screenTimeAccess.subtitleLead'),
              { strong: t('onboarding.screenTimeAccess.subtitleEmphasis') },
              t('onboarding.screenTimeAccess.subtitleTail'),
            ]}
          />
        }
        contentStyle={styles.content}
        footer={
          <PrimaryButton
            testID="screenTimeAccess.show"
            label={t('onboarding.screenTimeAccess.cta')}
            icon="arrowRight"
            loading={isRequesting}
            onPress={() => void handleShow()}
          />
        }>
        <CoachDialog
          title={t('onboarding.screenTimeAccess.dialogTitle')}
          body={t('onboarding.screenTimeAccess.dialogBody')}
          buttons={[
            t('onboarding.screenTimeAccess.dialogContinue'),
            t('onboarding.screenTimeAccess.dialogDeny'),
          ]}
          target={0}
          coach={t('onboarding.screenTimeAccess.coach')}
          accessibilityLabel={t('onboarding.screenTimeAccess.mockA11y')}
        />
      </OnboardingScreen>
      <DevSkip label="DEV · Approve" onSkip={approve} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { marginTop: layout.coach.frameTop },
});
