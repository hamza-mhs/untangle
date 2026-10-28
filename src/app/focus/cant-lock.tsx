import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { PrimaryButton, Sheet } from '@/design/components';
import { DURATION_CHIPS } from '@/features/focus/machine';
import { useFocusStore } from '@/features/focus/store';
import { fixBlockingAccess } from '@/features/rules/accessStore';
import { useT } from '@/i18n';

/**
 * E09 · can't lock right now (access is off). "Fix access" re-requests (Settings on Android);
 * "Timer only, no lock" runs a session with no shields. DECIDED: timer-only sessions earn no
 * points and no app time, because nothing verifies them.
 */
export default function CantLock() {
  const t = useT();
  const { minutes } = useLocalSearchParams<{ minutes?: string }>();
  const [isFixing, setIsFixing] = useState(false);
  const length = Number(minutes) || DURATION_CHIPS[1];

  const handleFix = async () => {
    setIsFixing(true);
    const status = await fixBlockingAccess();
    setIsFixing(false);
    if (status === 'approved') router.replace('/focus/start');
  };

  const handleTimerOnly = () => {
    useFocusStore.getState().dispatch({
      type: 'start',
      now: Date.now(),
      minutes: length,
      lockedCount: 0,
      isTimerOnly: true,
    });
    router.replace('/focus/run');
  };

  return (
    <Sheet
      testID="focus.cantLock"
      title={t('focus.cantLock.title')}
      body={t('focus.cantLock.body')}
      actions={
        <>
          <PrimaryButton
            testID="focus.cantLock.fix"
            label={t('focus.cantLock.fix')}
            compact
            loading={isFixing}
            onPress={() => void handleFix()}
          />
          <PrimaryButton
            testID="focus.cantLock.timerOnly"
            label={t('focus.cantLock.timerOnly')}
            variant="outline"
            compact
            onPress={handleTimerOnly}
          />
        </>
      }
    />
  );
}
