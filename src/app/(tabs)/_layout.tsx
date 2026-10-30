import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';

import { TabBar, TabBarButton } from '@/design/components';
import { useT } from '@/i18n';

/** The four tabs: Today · Games · Progress · Block, with the floating custom tab bar. */
export default function TabsLayout() {
  const t = useT();
  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <TabBar>
          <TabTrigger name="index" href="/(tabs)" asChild>
            <TabBarButton icon="tabToday" label={t('tabs.today')} testID="tab.today.button" />
          </TabTrigger>
          <TabTrigger name="games" href="/(tabs)/games" asChild>
            <TabBarButton icon="tabGames" label={t('tabs.games')} testID="tab.games.button" />
          </TabTrigger>
          <TabTrigger name="progress" href="/(tabs)/progress" asChild>
            <TabBarButton
              icon="tabProgress"
              label={t('tabs.progress')}
              testID="tab.progress.button"
            />
          </TabTrigger>
          <TabTrigger name="block" href="/(tabs)/block" asChild>
            <TabBarButton icon="tabBlock" label={t('tabs.block')} testID="tab.block.button" />
          </TabTrigger>
        </TabBar>
      </TabList>
    </Tabs>
  );
}
