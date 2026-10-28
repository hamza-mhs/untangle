import { StyleSheet, View } from 'react-native';

import { color, radius, rounded, size, space } from '../../tokens';
import { AppTileStack, type AppTileApp } from '../AppTile';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type BlockedAppsMode = 'idle' | 'focus' | 'evening' | 'off';

export type BlockedAppsCardProps = {
  mode: BlockedAppsMode;
  title: string;
  subtitle: string;
  apps: readonly AppTileApp[];
  onPress: () => void;
  testID?: string;
};

/** 68 pt card: lock tile (coral when off), title, sub, three overlapping tiles, chevron. */
export function BlockedAppsCard({ mode, title, subtitle, apps, onPress, testID }: BlockedAppsCardProps) {
  const isOff = mode === 'off';
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={styles.card}>
      <View style={[styles.lock, isOff ? styles.lockOff : styles.lockOn]}>
        <Icon name={isOff ? 'lockOpen' : 'lock'} size={size.icon.md} color={color.text.onAccent} />
      </View>
      <View style={styles.texts}>
        <Text variant="body.strong" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="meta" tone="muted" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <AppTileStack apps={apps} max={3} total={Math.min(apps.length, 3)} />
      <Icon name="arrowRight" size={size.icon.xs} color={color.text.muted} strokeWidth={2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    height: size.blockedAppsCard,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  lock: {
    width: size.lockTile,
    height: size.lockTile,
    ...rounded(radius.s),
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOn: { backgroundColor: color.accent.primary },
  lockOff: { backgroundColor: color.status.dangerSoft },
  texts: { flex: 1, minWidth: 0 },
});
