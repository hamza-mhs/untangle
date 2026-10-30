import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { IconName } from '../../icons';
import { color, radius, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { Text } from '../Text';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Right-hand text ("5 min", "On"). */
  value?: string;
  /** Right-hand control (Toggle, Stepper). Replaces the chevron. */
  trailing?: ReactNode;
  danger?: boolean;
  onPress?: () => void;
  testID?: string;
};

/** Settings-style row (prototype `.row`): icon tile, title + subtitle, value, chevron or control. */
export function ListRow({
  title,
  subtitle,
  icon,
  value,
  trailing,
  danger = false,
  onPress,
  testID,
}: ListRowProps) {
  const body = (
    <>
      {icon ? (
        <View style={styles.icon}>
          <Icon
            name={icon}
            size={size.icon.sm}
            color={danger ? color.signal.dangerText : color.text.primary}
          />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text variant="bodyStrong" style={danger ? styles.danger : null}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="caption" tone="secondary">
          {value}
        </Text>
      ) : null}
      {trailing ??
        (onPress ? (
          <Icon name="chevronRight" size={size.icon.sm} color={color.text.quiet} />
        ) : null)}
    </>
  );
  if (!onPress) {
    return (
      <View testID={testID} style={styles.row} accessible={!trailing}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.listRow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: 14,
  },
  pressed: { backgroundColor: color.surface.raised },
  icon: {
    width: size.listRowIcon,
    height: size.listRowIcon,
    borderRadius: radius.md,
    backgroundColor: color.surface.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0, gap: 2 },
  danger: { color: color.signal.dangerText },
});
