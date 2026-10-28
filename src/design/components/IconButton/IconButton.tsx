import { StyleSheet } from 'react-native';

import { haptics } from '@/lib/haptics';

import { color, pill, size } from '../../tokens';
import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';

export type IconButtonProps = {
  icon: IconName;
  /** Required: icon-only buttons always have a label (SPEC §6). */
  accessibilityLabel: string;
  onPress: () => void;
  testID?: string;
};

/** 36 pt round button (paywall close ×), with a 44 pt hit target. */
export function IconButton({ icon, accessibilityLabel, onPress, testID }: IconButtonProps) {
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={(size.hitTarget - size.closeButton) / 2}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={styles.button}>
      <Icon name={icon} size={size.icon.xs} color={color.text.primary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.closeButton,
    height: size.closeButton,
    ...pill(size.closeButton),
    backgroundColor: color.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
