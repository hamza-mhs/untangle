import { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { PrimaryButton } from '@/design/components';
import { layout } from '@/design/tokens';
import { MockPicker } from '@/features/onboarding/components/coach/MockPicker';
import {
  OnboardingScreen,
  type OnboardingScreenHandle,
} from '@/features/onboarding/components/OnboardingScreen';
import { RichSubtitle } from '@/features/onboarding/components/RichSubtitle';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { DevSkip } from '@/features/dev/DevSkip';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { blocking } from '@/services/blocking';

const STEP = stepOf('pick-apps');

/** DEV skip: a stand-in Android selection. */
const DEV_APPS = {
  platform: 'android' as const,
  packages: ['com.instagram.android', 'com.zhiliaoapp.musically', 'com.google.android.youtube'],
};

/**
 * Onboarding 10 · coach Apple's FamilyActivityPicker, then open it. The selection is opaque on
 * iOS. Cancelled or empty → stay, subtitle turns into the warning.
 */
export default function PickApps() {
  const t = useT();
  const current = useOnboardingStore((s) => s.appSelection);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const [isWarning, setIsWarning] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const screen = useRef<OnboardingScreenHandle>(null);

  const handleOpen = async () => {
    setIsOpening(true);
    const result = await blocking.pickApps(current);
    setIsOpening(false);
    if (result.ok) {
      setIsWarning(false);
      setAnswer('appSelection', result.value);
      goNext(STEP);
      return;
    }
    haptics.warning();
    setIsWarning(true);
    screen.current?.shakeSubtitle();
  };

  return (
    <>
      <OnboardingScreen
        ref={screen}
        step={STEP}
        title={t('onboarding.pickApps.title')}
        subtitleTone={isWarning ? 'warning' : 'muted'}
        subtitle={
          isWarning ? (
            t('onboarding.pickApps.warning')
          ) : (
            <RichSubtitle
              parts={[
                t('onboarding.pickApps.subtitleParts.a'),
                { strong: t('onboarding.pickApps.subtitleParts.b') },
                t('onboarding.pickApps.subtitleParts.c'),
                { strong: t('onboarding.pickApps.subtitleParts.d') },
                t('onboarding.pickApps.subtitleParts.e'),
              ]}
            />
          )
        }
        contentStyle={styles.content}
        footer={
          <PrimaryButton
            testID="pickApps.open"
            label={t('onboarding.pickApps.cta')}
            icon="arrowRight"
            loading={isOpening}
            onPress={() => void handleOpen()}
          />
        }>
        <MockPicker />
      </OnboardingScreen>
      <DevSkip
        label="DEV · Pick apps"
        onSkip={() => {
          setAnswer('appSelection', DEV_APPS);
          goNext(STEP);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { marginTop: layout.coach.pickerTop },
});
