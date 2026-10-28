import type { ComponentRef, Ref } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { color, pill, size, space } from '../../tokens';
import { Icon, type IconName } from '../Icon';
import { Text } from '../Text';

export type TabBarButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: IconName;
  label: string;
  isFocused: boolean;
  ref?: Ref<ComponentRef<typeof Pressable>> | undefined;
};

/** One of the four tabs (SPEC §3 TabBar). Active = white pill behind a black icon. */
export function TabBarButton({ icon, label, isFocused, ref, ...props }: TabBarButtonProps) {
  return (
    <Pressable
      {...props}
      ref={ref}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={styles.tab}>
      <View style={[styles.indicator, isFocused && styles.indicatorOn]}>
        <Icon
          name={icon}
          size={size.icon.lg - 1}
          color={isFocused ? color.text.onAccent : color.text.muted}
        />
      </View>
      <Text variant="label.tab" tone={isFocused ? 'primary' : 'muted'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: { flex: 1, alignItems: 'center', gap: space.xs, minHeight: size.hitTarget },
  indicator: {
    width: size.tabBar.indicatorWidth,
    height: size.tabBar.indicatorHeight,
    ...pill(size.tabBar.indicatorHeight),
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorOn: { backgroundColor: color.light.surface },
});
