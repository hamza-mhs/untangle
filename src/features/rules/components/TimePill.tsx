import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { PressableScale, Text } from '@/design/components';
import { color, pill, size, space } from '@/design/tokens';
import { formatRuleTime } from '@/lib/format';

/**
 * "From 09:00" pill that opens the native time picker (@expo/ui, already in the stack): a
 * dialog on Android, an inline wheel under the pills on iOS.
 */
export function TimePill({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  /** 'HH:MM'. */
  value: string;
  onChange: (hhmm: string) => void;
  testID?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [h, m] = value.split(':').map(Number) as [number, number];
  const date = new Date(2000, 0, 1, h, m);
  const commit = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    onChange(`${hh}:${mm}`);
  };
  return (
    <View style={styles.wrap}>
      <PressableScale
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${formatRuleTime(value)}`}
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((o) => !o)}
        style={[styles.pill, isOpen && styles.pillOpen]}>
        <Text variant="body.strong">
          {label}
          {'  '}
          {formatRuleTime(value)}
        </Text>
      </PressableScale>
      {isOpen ? (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour
          accentColor={color.accent.primary}
          onValueChange={(_, d) => {
            commit(d);
            if (Platform.OS === 'android') setIsOpen(false);
          }}
          onDismiss={() => setIsOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: space.sm },
  pill: {
    height: size.timePill,
    ...pill(size.timePill),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg.raisedHigh,
  },
  pillOpen: { borderWidth: size.ring, borderColor: color.accent.primary },
});
