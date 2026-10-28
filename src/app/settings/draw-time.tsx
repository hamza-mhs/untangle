import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, IconButton, ListGroup, ListRow, Text } from '@/design/components';
import { color, layout, size, space } from '@/design/tokens';
import { useSettingsStore } from '@/features/settings/store';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

/** 06:00 → 10:00 in half hours. */
const TIMES = Array.from({ length: 9 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

/** Settings › Morning draw time: when today's three unlock (and the morning notification). */
export default function DrawTime() {
  const t = useT();
  const drawTime = useSettingsStore((s) => s.drawTime);
  const setDrawTime = useSettingsStore((s) => s.setDrawTime);
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="chevronLeft"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title.l" accessibilityRole="header">
          {t('settings.schedule.draw')}
        </Text>
        <Text variant="body.lead" tone="secondary" style={styles.sub}>
          {t('settings.schedule.drawSub')}
        </Text>
        <ListGroup>
          {TIMES.map((time) => (
            <ListRow
              key={time}
              title={time}
              onPress={() => {
                haptics.select();
                setDrawTime(time);
                router.back();
              }}
              trailing={
                time === drawTime ? (
                  <Icon name="check" size={size.icon.sm} color={color.accent.primary} />
                ) : undefined
              }
            />
          ))}
        </ListGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  header: { paddingHorizontal: layout.screen.x, paddingTop: layout.screen.top },
  content: { paddingHorizontal: layout.gutter, paddingBottom: space.huge, gap: space.md },
  sub: { marginBottom: space.md, paddingHorizontal: space.xs },
});
