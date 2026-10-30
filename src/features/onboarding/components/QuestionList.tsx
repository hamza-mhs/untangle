import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { OptionRow } from '@/design/components';
import { space } from '@/design/tokens';

import { hrefFor, nextStep, type OnboardingStep } from '../steps';

/** Single-choice questions move on this long after a tap, once the tick has shown (§1). */
export const AUTO_ADVANCE_MS = 500;

export function goNext(step: OnboardingStep) {
  const next = nextStep(step);
  if (next) router.push(hrefFor(next));
}

/** Auto-advance timer, cancelled when the screen goes away or the user taps again. */
export function useAutoAdvance(step: OnboardingStep) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      goNext(step);
    }, AUTO_ADVANCE_MS);
  };
}

export type QuestionItem = { id: string; label: string; emoji: string; selected: boolean };

export function QuestionList({
  items,
  multi = false,
  onPick,
  testID,
}: {
  items: QuestionItem[];
  multi?: boolean;
  onPick: (id: string) => void;
  testID: string;
}) {
  return (
    <View style={styles.list} accessibilityRole={multi ? undefined : 'radiogroup'}>
      {items.map((o) => (
        <OptionRow
          key={o.id}
          testID={`${testID}.${o.id}`}
          label={o.label}
          emoji={o.emoji}
          selected={o.selected}
          multi={multi}
          onPress={() => onPick(o.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ list: { gap: space.sm } });
