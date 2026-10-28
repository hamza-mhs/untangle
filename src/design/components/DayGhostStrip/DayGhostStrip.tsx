import { StyleSheet, View } from 'react-native';

import { color, radius, rounded, size, space } from '../../tokens';
import { Ghost } from '../Ghost';
import { Text } from '../Text';

export type GhostDay = {
  /** "M", "T"… */
  label: string;
  /** Ghost mood 0–1, or null for a day still ahead. */
  mood: number | null;
  isToday: boolean;
  a11y: string;
};

/** Pack 2 SPEC §2 DayGhostStrip: seven small ghosts, one per day of the week; today ringed. */
export function DayGhostStrip({ days, testID }: { days: readonly GhostDay[]; testID?: string }) {
  return (
    <View style={styles.row} testID={testID}>
      {days.map((d, i) => (
        <View
          key={i}
          accessible
          accessibilityLabel={d.a11y}
          style={[styles.day, d.isToday && styles.today, d.mood === null && styles.ahead]}>
          {d.mood !== null ? <Ghost mood={d.mood} width={size.dayGhost.ghost} /> : <View style={styles.spacer} />}
          <Text variant="caption" tone="muted">
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  day: {
    flex: 1,
    maxWidth: size.dayGhost.width,
    height: size.dayGhost.height,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    borderWidth: size.selectedRing,
    borderColor: color.bg.raised,
  },
  today: { borderColor: color.accent.primary },
  ahead: { opacity: 0.4 },
  spacer: { height: size.dayGhost.ghost * 1.35 },
});
