import { Link, router, type Href } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, ListGroup, ListRow, Text } from '@/design/components';
import { color, layout, space } from '@/design/tokens';
import { DevMockControls } from '@/features/dev/DevMockControls';
import { useT } from '@/i18n';

/** Every route that otherwise needs a specific state to reach (developer tooling). */
const DEV_ROUTES: Href[] = [
  '/',
  '/your-year',
  '/screen-time-denied',
  '/notifications-off',
  '/focus/start',
  '/focus/run',
  '/focus/done',
  '/focus/emergency',
  '/focus/no-passes',
  '/focus/cant-lock',
  '/rule/new',
  '/rule/locked',
  '/shield?app=Instagram&strength=pause&opens=6&stay=11',
  '/shield?app=Instagram&strength=locked&until=12:00',
  '/paywall',
  '/paywall?from=bedtime',
  '/paywall/day5',
  '/paywall/went-free',
  '/paywall/gate',
  '/paywall/limit',
  '/paywall/failed',
  '/paywall/pending',
  '/paywall/restore-none',
  '/paywall/win-back',
  '/pro/success',
  '/settings',
  '/settings/billing',
  '/settings/cancel',
  '/dev/kitchen-sink',
];

/** Dev menu (long-press the date on Home, dev builds only). */
export default function DevMenu() {
  const t = useT();
  if (!__DEV__) return null;
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <IconButton
          icon="close"
          accessibilityLabel={t('common.close')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/today'))}
        />
        <Text variant="title.m">{t('dev.mocks')}</Text>
        <DevMockControls />
        <ListGroup header={t('dev.allRoutes')}>
          {DEV_ROUTES.map((href) => (
            <Link key={String(href)} href={href} asChild>
              <ListRow title={String(href)} onPress={() => {}} />
            </Link>
          ))}
        </ListGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  content: { padding: layout.gutter, gap: space.xl },
});
