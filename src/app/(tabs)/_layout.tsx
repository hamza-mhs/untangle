import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentRef, Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarButton, type IconName } from '@/design/components';
import { color, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

type TabDef = {
  name: 'today' | 'challenges' | 'block' | 'rewards';
  href: '/today' | '/challenges' | '/block' | '/rewards';
  icon: IconName;
};

const TABS: readonly TabDef[] = [
  { name: 'today', href: '/today', icon: 'home' },
  { name: 'challenges', href: '/challenges', icon: 'flag' },
  { name: 'block', href: '/block', icon: 'lock' },
  { name: 'rewards', href: '/rewards', icon: 'gift' },
];

/**
 * Four tabs: Today, Challenges, Block, Rewards (SPEC §3 TabBar). No centre Focus button: it was
 * removed on purpose; focus starts from Home's action.
 */
export default function TabsLayout() {
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot />
      <View
        style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}
        accessibilityRole="tabbar">
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} asChild>
            <TabButton icon={tab.icon} label={t(`tabs.${tab.name}`)} />
          </TabTrigger>
        ))}
      </View>
      <TabList style={styles.hidden}>
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} />
        ))}
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: IconName; label: string };

function TabButton({ icon, label, isFocused, ref, ...props }: TabButtonProps) {
  return (
    <TabBarButton
      {...props}
      icon={icon}
      label={label}
      isFocused={!!isFocused}
      // expo-router 58 types this ref as Ref<typeof View> (the component, not the instance).
      ref={ref as unknown as Ref<ComponentRef<typeof Pressable>>}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: color.bg.canvas,
    borderTopWidth: size.ring,
    borderTopColor: color.bg.raised,
    paddingTop: space.sm,
    paddingHorizontal: space.sm,
  },
  hidden: { display: 'none' },
});
