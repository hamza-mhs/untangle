import type { ReactNode } from 'react';
import { Pressable, type PressableProps, StyleSheet, View, type ViewProps } from 'react-native';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '../../icons';
import { color, elevation, radius, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { Text } from '../Text';

/**
 * Floating 4-tab bar (prototype `.tabbar`): a dark pill 14 dp from the edges, the active tab
 * on a faint highlight. Used through expo-router/ui: `<TabList asChild><TabBar>` with
 * `<TabTrigger asChild><TabBarButton/></TabTrigger>` children.
 */
export function TabBar({ children, style, ...rest }: ViewProps & { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      {...rest}
      accessibilityRole="tablist"
      style={[styles.bar, { bottom: size.tabBar.bottom + insets.bottom }, style]}>
      {children}
    </View>
  );
}

export type TabBarButtonProps = TabTriggerSlotProps & {
  icon: IconName;
  label: string;
};

export function TabBarButton({ icon, label, isFocused, ...props }: TabBarButtonProps) {
  const fg = isFocused ? color.text.primary : color.text.quiet;
  return (
    <Pressable
      // TabTrigger passes Pressable props (onPress, href handling) through its slot.
      {...(props as PressableProps)}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!isFocused }}
      style={[styles.tab, isFocused ? styles.on : null]}>
      <Icon name={icon} size={size.icon.md} color={fg} />
      <Text variant="caption" style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: size.tabBar.inset,
    right: size.tabBar.inset,
    height: size.tabBar.height,
    borderRadius: radius.pill,
    backgroundColor: color.surface.raised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.surface.line,
    flexDirection: 'row',
    paddingHorizontal: space.xs + 2,
    ...elevation.tabBar,
  },
  tab: {
    flex: 1,
    marginVertical: space.xs + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  on: { backgroundColor: color.surface.glass },
  label: { fontSize: 11 },
});
