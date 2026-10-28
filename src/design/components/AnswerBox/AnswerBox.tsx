import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';

import { color, radius, rounded, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { Text } from '../Text';

export type AnswerState = 'typing' | 'right' | 'wrong';

/** R3 / R4 answer box: feedback tokens; wrong values are struck through. */
export function AnswerBox({ value, state, testID }: { value: string; state: AnswerState; testID?: string }) {
  const t = useT();
  return (
    <View
      testID={testID}
      style={[styles.box, boxStyles[state]]}
      accessible
      accessibilityLabel={t(`reps.answer.${state}A11y`, { value: value || t('reps.answer.empty') })}
      accessibilityLiveRegion="polite">
      <Text variant="display.answer" style={state === 'wrong' && styles.struck}>
        {value || ' '}
      </Text>
      {state === 'right' ? <Icon name="check" size={size.icon.lg} color={color.status.success} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: size.answerBox,
    ...rounded(radius.l),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    borderWidth: size.selectedRing,
  },
  struck: { textDecorationLine: 'line-through' },
});

const boxStyles = StyleSheet.create({
  typing: { backgroundColor: color.bg.raised, borderColor: color.bg.raised },
  right: { backgroundColor: color.feedback.rightBg, borderColor: color.feedback.rightBorder },
  wrong: { backgroundColor: color.feedback.wrongBg, borderColor: color.feedback.wrongBorder },
});
