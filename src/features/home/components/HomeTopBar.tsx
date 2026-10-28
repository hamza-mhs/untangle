import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/design/components';
import { color, pill, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

/** Date over "Today", streak pill on the right. No menu or settings icon (SPEC Home). */
export function HomeTopBar({ dateLabel, streak }: { dateLabel: string; streak: number }) {
  const t = useT();
  return (
    <View style={styles.bar}>
      <View>
        <Text variant="meta" tone="muted">
          {dateLabel}
        </Text>
        <Text variant="title.m" accessibilityRole="header">
          {t('home.title')}
        </Text>
      </View>
      <View
        style={styles.streak}
        accessible
        accessibilityLabel={t('home.streakA11y', { count: streak })}>
        <Icon name="flame" size={size.icon.xs - 2} color={color.mood.orange} />
        <Text variant="label.strong">{streak}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  streak: {
    height: size.pillButton,
    ...pill(size.pillButton),
    paddingHorizontal: space.md + 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    backgroundColor: color.bg.raised,
  },
});
