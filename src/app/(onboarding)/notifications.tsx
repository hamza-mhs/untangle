import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { PrimaryButton } from '@/design/components';
import { layout } from '@/design/tokens';
import { CoachDialog } from '@/features/onboarding/components/coach/CoachDialog';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { RichSubtitle } from '@/features/onboarding/components/RichSubtitle';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { useSettingsStore } from '@/features/settings/store';
import { DevSkip } from '@/features/dev/DevSkip';
import { useT } from '@/i18n';
import { notifications } from '@/services/notifications';

const STEP = stepOf('notifications');

/**
 * Onboarding 11 · coach the notification dialog. Denied still continues: E02 shows once,
 * later, on the first Home open — nothing in onboarding is a dead end.
 */
export default function NotificationsStep() {
  const t = useT();
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const queueNotificationsSheet = useOnboardingStore((s) => s.queueNotificationsSheet);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleShow = async () => {
    setIsRequesting(true);
    const result = await notifications.request();
    setIsRequesting(false);
    setAnswer('notifications', result.ok ? 'granted' : 'denied');
    setNotificationsEnabled(result.ok);
    if (!result.ok) queueNotificationsSheet();
    goNext(STEP);
  };

  return (
    <>
      <OnboardingScreen
        step={STEP}
        title={t('onboarding.notifications.title')}
        subtitle={
          <RichSubtitle
            parts={[
              t('onboarding.notifications.subtitleLead'),
              { strong: t('onboarding.notifications.subtitleEmphasis') },
              t('onboarding.notifications.subtitleTail'),
            ]}
          />
        }
        contentStyle={styles.content}
        footer={
          <PrimaryButton
            testID="notifications.show"
            label={t('onboarding.notifications.cta')}
            icon="arrowRight"
            loading={isRequesting}
            onPress={() => void handleShow()}
          />
        }>
        <CoachDialog
          title={t('onboarding.notifications.dialogTitle')}
          body={t('onboarding.notifications.dialogBody')}
          buttons={[
            t('onboarding.notifications.dialogDeny'),
            t('onboarding.notifications.dialogAllow'),
          ]}
          target={1}
          coach={t('onboarding.notifications.coach')}
          accessibilityLabel={t('onboarding.notifications.mockA11y')}
        />
      </OnboardingScreen>
      <DevSkip
        label="DEV · Allow"
        onSkip={() => {
          setAnswer('notifications', 'granted');
          goNext(STEP);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { marginTop: layout.coach.frameTop },
});
