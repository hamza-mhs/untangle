import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

import { PressableScale } from '@/design/components';
import { color, radius } from '@/design/tokens';

import { isAborted } from '../engine/clock';
import type { GameApi } from '../engine/types';

/** Runs a round's async loop once; stops quietly when the round is torn down. */
export function useRoundLoop(api: GameApi, loop: () => Promise<void>) {
  const started = useRef(false);
  const fn = useRef(loop);
  useEffect(() => {
    fn.current = loop;
  });
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fn.current().catch((e: unknown) => {
      if (!isAborted(e)) throw e;
    });
  }, [api]);
}

/** Calls `frame(gameTimeMs)` every animation frame while the round is mounted. */
export function useFrame(api: GameApi, frame: (t: number) => void) {
  const fn = useRef(frame);
  useEffect(() => {
    fn.current = frame;
  });
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      fn.current(api.clock.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [api]);
}

/** Toy key (prototype `.tb`): colour face, darker lip underneath, top highlight. */
export function ToyKey({
  tint,
  onPress,
  accessibilityLabel,
  disabled,
  style,
  children,
  testID,
}: {
  tint: string;
  onPress?: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  testID?: string;
}) {
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      {...(onPress ? { onPress } : {})}
      style={[styles.key, { backgroundColor: tint }, style]}>
      <View style={styles.lip} />
      <View style={styles.shine} />
      {children}
    </PressableScale>
  );
}

/** Recessed field (prototype `data-m="well"`): dark inset panel that boards draw into. */
export function Well({
  style,
  children,
  onLayout,
  accessibilityLabel,
}: {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  onLayout?: ViewProps['onLayout'];
  accessibilityLabel?: string;
}) {
  return (
    <View
      style={[styles.well, style]}
      {...(onLayout ? { onLayout } : {})}
      {...(accessibilityLabel ? { accessible: true, accessibilityLabel } : {})}>
      {children}
    </View>
  );
}

export type ArrowDir = 'up' | 'right' | 'down' | 'left';
const ARROW_TURN: Record<ArrowDir, number> = { right: 0, down: 90, left: 180, up: 270 };

/** Bold arrow glyph (prototype `arrowSVG`), pointing `dir`. */
export function Arrow({
  dir,
  size,
  fill = color.text.primary,
}: {
  dir: ArrowDir;
  size: number;
  fill?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 12h15M13 6l6 6-6 6"
        fill="none"
        stroke={fill}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`rotate(${ARROW_TURN[dir]} 12 12)`}
      />
    </Svg>
  );
}

export type ShapeName =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'hex'
  | 'sun'
  | 'moon'
  | 'heart'
  | 'leaf'
  | 'drop'
  | 'bolt'
  | 'flower';

/** Simple filled shapes for Echo and Card pairs. */
export function Shape({
  name,
  size,
  fill = color.text.primary,
}: {
  name: ShapeName;
  size: number;
  fill?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'circle' || name === 'sun' ? (
        <Circle cx={12} cy={12} r={name === 'sun' ? 6 : 9} fill={fill} />
      ) : null}
      {name === 'sun'
        ? [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <Rect
              key={a}
              x={11}
              y={1}
              width={2}
              height={4}
              rx={1}
              fill={fill}
              transform={`rotate(${a} 12 12)`}
            />
          ))
        : null}
      {name === 'square' ? <Rect x={3} y={3} width={18} height={18} rx={3} fill={fill} /> : null}
      {name === 'triangle' ? <Polygon points="12,3 21,20 3,20" fill={fill} /> : null}
      {name === 'diamond' ? <Polygon points="12,2 22,12 12,22 2,12" fill={fill} /> : null}
      {name === 'star' ? (
        <Polygon
          points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6"
          fill={fill}
        />
      ) : null}
      {name === 'hex' ? <Polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill={fill} /> : null}
      {name === 'moon' ? <Path d="M15 3a9 9 0 1 0 6 15A7 7 0 0 1 15 3z" fill={fill} /> : null}
      {name === 'heart' ? (
        <Path
          d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"
          fill={fill}
        />
      ) : null}
      {name === 'leaf' ? (
        <Path
          d="M20 4C9 4 4 9 4 17c0 1 .2 2 .5 3C6 12 11 9 16 8c-4 2-7 5-9 10 9 0 13-6 13-14z"
          fill={fill}
        />
      ) : null}
      {name === 'drop' ? (
        <Path d="M12 2s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z" fill={fill} />
      ) : null}
      {name === 'bolt' ? <Polygon points="13,2 4,14 11,14 10,22 20,9 13,9" fill={fill} /> : null}
      {name === 'flower'
        ? [0, 72, 144, 216, 288].map((a) => (
            <Circle key={a} cx={12} cy={6.5} r={4} fill={fill} transform={`rotate(${a} 12 12)`} />
          ))
        : null}
    </Svg>
  );
}

const styles = StyleSheet.create({
  well: {
    borderRadius: radius['3xl'],
    backgroundColor: color.surface.card,
    borderWidth: 1,
    borderColor: color.surface.line,
    overflow: 'hidden',
  },
  key: {
    borderRadius: radius['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '18%',
    backgroundColor: color.overlay.scrim,
    opacity: 0.45,
  },
  shine: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    top: '6%',
    height: '16%',
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
    opacity: 0.22,
  },
});
