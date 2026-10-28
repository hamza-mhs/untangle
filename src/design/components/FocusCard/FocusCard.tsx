import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { useT } from '@/i18n';

import { color, layout, radius, rounded, size, space } from '../../tokens';
import { Countdown } from '../Countdown';
import { Icon } from '../Icon';
import { ProgressBar } from '../ProgressBar';
import { Text } from '../Text';

export type FocusCardProps = {
  startedAt: number;
  endsAt: number;
  /** "10:50", formatted by the caller with Intl. */
  endsAtLabel: string;
  onEnd?: () => void;
  testID?: string;
};

/** Yellow running-focus card on Home: "Locked in · ends 10:50", live "38m 12s", progress. */
export function FocusCard({ startedAt, endsAt, endsAtLabel, onEnd, testID }: FocusCardProps) {
  const t = useT();
  const progress = useSharedValue(0);
  const span = Math.max(1, endsAt - startedAt);
  useEffect(() => {
    progress.set(Math.min(1, Math.max(0, (Date.now() - startedAt) / span)));
  }, [progress, startedAt, span]);
  useFrameCallback(() => {
    progress.set(Math.min(1, Math.max(0, (Date.now() - startedAt) / span)));
  });

  return (
    <View testID={testID} style={styles.card}>
      <View style={styles.top}>
        <View style={styles.badge}>
          <Icon name="lock" size={size.icon.xs - 1} color={color.text.onAccent} />
          <Text variant="label.strong" tone="onAccent">
            {t('home.focus.lockedIn')}
          </Text>
        </View>
        <Text variant="meta" tone="onAccent">
          {t('home.focus.endsAt', { time: endsAtLabel })}
        </Text>
      </View>
      <View style={styles.timer}>
        <Countdown endsAt={endsAt} format="inline" tone="onAccent" {...(onEnd ? { onEnd } : {})} />
      </View>
      <View style={styles.track}>
        <ProgressBar progress={progress} tone="onAccent" track="onAccent" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: size.focusCard,
    ...rounded(radius.l),
    backgroundColor: color.accent.primary,
    paddingVertical: space.lg,
    paddingHorizontal: layout.home.labelX - 2,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
  timer: { marginTop: space.xs + 2 },
  track: {
    position: 'absolute',
    left: layout.home.labelX - 2,
    right: layout.home.labelX - 2,
    bottom: space.lg,
  },
});
