import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useT } from '@/i18n';

import { color, fontFamily, radius, rounded, size, space, type TypeVariant } from '../../tokens';
import { LiveText } from '../LiveText';
import { Text } from '../Text';

export type CountdownFormat = 'tiles' | 'inline' | 'ms';

export type CountdownProps = {
  /** Absolute end (epoch ms). Never "remaining seconds" (CODE_STANDARDS › Time). */
  endsAt: number;
  format: CountdownFormat;
  /** Fires once when the clock reaches 0. */
  onEnd?: () => void;
  /** `inline` only: text colour (black on the yellow FocusCard). */
  tone?: 'primary' | 'onAccent';
  testID?: string;
};

type Parts = { h: string; m: string; s: string; minutesLeft: number };

export function countdownParts(remainingMs: number): Parts {
  'worklet';
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return { h: pad(h), m: pad(m), s: pad(s), minutesLeft: Math.ceil(total / 60) };
}

/**
 * One Reanimated clock, never `setInterval` into React state (SPEC §3). Digits are LiveText on
 * the UI thread; React re-renders once a minute only, for the screen-reader label
 * (SPEC §6: countdowns announce once a minute).
 */
export function Countdown({ endsAt, format, onEnd, tone = 'primary', testID }: CountdownProps) {
  const t = useT();
  const [start] = useState(() => countdownParts(endsAt - Date.now()));
  const h = useSharedValue(start.h);
  const m = useSharedValue(start.m);
  const s = useSharedValue(start.s);
  const inlineMin = useSharedValue(`${Number(start.h) * 60 + Number(start.m)}m`);
  const inlineSec = useSharedValue(`${start.s}s`);
  const mmss = useSharedValue(`${start.m}:${start.s}`);
  const lastMinute = useSharedValue(start.minutesLeft);
  const isDone = useSharedValue(false);
  const [minutesLeft, setMinutesLeft] = useState(start.minutesLeft);

  const handleEnd = () => onEnd?.();

  useFrameCallback(() => {
    const p = countdownParts(endsAt - Date.now());
    if (p.s !== s.value) {
      h.set(p.h);
      m.set(p.m);
      s.set(p.s);
      inlineMin.set(`${Number(p.h) * 60 + Number(p.m)}m`);
      inlineSec.set(`${p.s}s`);
      mmss.set(`${Number(p.h) * 60 + Number(p.m)}:${p.s}`);
    }
    if (p.minutesLeft !== lastMinute.value) {
      lastMinute.set(p.minutesLeft);
      scheduleOnRN(setMinutesLeft, p.minutesLeft);
    }
    if (endsAt - Date.now() <= 0 && !isDone.value) {
      isDone.set(true);
      scheduleOnRN(handleEnd);
    }
  });

  const label = t('focus.countdown.a11y', { count: minutesLeft });

  if (format === 'tiles') {
    return (
      <View
        testID={testID}
        style={styles.tiles}
        accessible
        accessibilityRole="timer"
        accessibilityLabel={label}
        accessibilityLiveRegion="polite">
        <Tile text={h} unit={t('focus.countdown.hours')} />
        <Tile text={m} unit={t('focus.countdown.minutes')} />
        <Tile text={s} unit={t('focus.countdown.seconds')} isAccent />
      </View>
    );
  }
  const textTone: StyleProp<TextStyle> = tone === 'onAccent' ? styles.onAccent : styles.primary;
  if (format === 'inline') {
    return (
      <View
        testID={testID}
        style={styles.inline}
        accessible
        accessibilityRole="timer"
        accessibilityLabel={label}
        accessibilityLiveRegion="polite">
        <LiveText text={inlineMin} variant="display.timer" style={textTone} />
        <LiveText text={inlineSec} variant="display.timer" style={[textTone, styles.inlineSec]} />
      </View>
    );
  }
  return (
    <View testID={testID} accessible accessibilityRole="timer" accessibilityLabel={label}>
      <LiveText text={mmss} variant={'display.m' satisfies TypeVariant} style={textTone} />
    </View>
  );
}

function Tile({
  text,
  unit,
  isAccent = false,
}: {
  text: SharedValue<string>;
  unit: string;
  isAccent?: boolean;
}) {
  return (
    <View style={[styles.tile, isAccent ? styles.tileAccent : styles.tilePlain]}>
      <LiveText
        text={text}
        variant="display.l"
        style={isAccent ? styles.onAccent : styles.primary}
      />
      <Text variant="meta.strong" tone={isAccent ? 'onAccent' : 'primary'}>
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: space.md - 1 },
  tile: {
    flex: 1,
    height: size.focusTile.height,
    ...rounded(radius.l),
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  tilePlain: { backgroundColor: color.bg.raised },
  tileAccent: { backgroundColor: color.accent.primary },
  inline: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  inlineSec: { fontFamily: fontFamily.medium },
  primary: { color: color.text.primary },
  onAccent: { color: color.text.onAccent },
});
