import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { goBack } from '../navigation';

/**
 * Android hardware back → previous step (never exits the app from inside onboarding).
 * Pass `isBlocked` for steps that must not go back (13 onwards, the quiet minute is done).
 */
export function useOnboardingBack(step: number, isBlocked = false) {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!isBlocked) goBack(step);
        return true;
      });
      return () => sub.remove();
    }, [step, isBlocked]),
  );
}
