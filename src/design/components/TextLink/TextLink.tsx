import { StyleSheet } from 'react-native';

import { size } from '../../tokens';
import { PressableScale } from '../PressableScale';
import { Text, type TextTone } from '../Text';

export type TextLinkProps = {
  label: string;
  onPress: () => void;
  tone?: TextTone;
  testID?: string;
};

/** Centred text button ("Continue free", "Not now", "Skip") with a 44 pt hit target. */
export function TextLink({ label, onPress, tone = 'muted', testID }: TextLinkProps) {
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.hit}>
      <Text variant="label.strong" tone={tone} align="center">
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  hit: {
    minHeight: size.hitTarget,
    minWidth: size.hitTarget,
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
