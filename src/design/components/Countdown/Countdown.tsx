import { useState } from 'react';
import { View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useT } from '@/i18n';

import type { TypeRole } from '../../tokens';
import { LiveText } from './LiveText';

export type CountdownProps = {
  /** Absolute end (epoch ms), never "seconds remaining". */
  endsAt: number;
  variant?: TypeRole;
  /** Fires once at 0. */
  onEnd?: () => void;
  testID?: string;
};

/** "m:ss" (or "h:mm:ss") left until `endsAt`. */
export function formatRemaining(ms: number): string {
  'worklet';
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * One Reanimated frame clock drives the digits on the UI thread; React re-renders once a
 * minute, only for the TalkBack label (countdowns announce once a minute).
 */
export function Countdown({ endsAt, variant = 'statLg', onEnd, testID }: CountdownProps) {
  const t = useT();
  const [startedAt] = useState(() => Date.now());
  const text = useSharedValue(formatRemaining(endsAt - startedAt));
  const lastMinute = useSharedValue(Math.ceil((endsAt - startedAt) / 60000));
  const done = useSharedValue(false);
  const [minutesLeft, setMinutesLeft] = useState(lastMinute.get());
  const handleEnd = () => onEnd?.();

  useFrameCallback(() => {
    const left = endsAt - Date.now();
    const next = formatRemaining(left);
    if (next !== text.get()) text.set(next);
    const minutes = Math.max(0, Math.ceil(left / 60000));
    if (minutes !== lastMinute.get()) {
      lastMinute.set(minutes);
      scheduleOnRN(setMinutesLeft, minutes);
    }
    if (left <= 0 && !done.get()) {
      done.set(true);
      scheduleOnRN(handleEnd);
    }
  });

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={t('common.minutesLeft', { count: minutesLeft })}>
      <LiveText text={text} variant={variant} />
    </View>
  );
}
