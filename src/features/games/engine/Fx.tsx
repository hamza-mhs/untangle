import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/design/components';
import { color, motion, radius, space } from '@/design/tokens';

/**
 * The FX layer (30-phase3 §A.2.5): rings, bursts, floating "+pts", toasts. Drawn with
 * Reanimated views over the board (not Skia); each effect removes itself when done. Reduce
 * motion: no particles, rings fade in place.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type Item =
  | { id: number; kind: 'ring'; x: number; y: number; color: string; size: number }
  | {
      id: number;
      kind: 'particle';
      x: number;
      y: number;
      color: string;
      dx: number;
      dy: number;
      size: number;
      ms: number;
    }
  | { id: number; kind: 'float'; x: number; y: number; text: string; color: string }
  | { id: number; kind: 'toast'; text: string; color: string };

export type FxHandle = {
  ring: (x: number, y: number, c: string, size?: number) => void;
  burst: (x: number, y: number, c: string, n?: number) => void;
  float: (x: number, y: number, text: string, c?: string) => void;
  toast: (text: string, c?: string) => void;
};

const RING_MS = 480;
const FLOAT_MS = 800;
const TOAST_MS = 900;
const RING_SIZE = 64;

function Ring({
  item,
  reduced,
  onDone,
}: {
  item: Extract<Item, { kind: 'ring' }>;
  reduced: boolean;
  onDone: () => void;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(1, { duration: RING_MS, easing: Easing.bezier(...motion.easing.standard) }));
    const id = setTimeout(onDone, RING_MS);
    return () => clearTimeout(id);
  }, [onDone, p]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.get(),
    borderWidth: 3 - 2 * p.get(),
    transform: [{ scale: reduced ? 1 : 0.5 + 1.4 * p.get() }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          left: item.x - item.size / 2,
          top: item.y - item.size / 2,
          width: item.size,
          height: item.size,
          borderColor: item.color,
        },
        style,
      ]}
    />
  );
}

function Particle({
  item,
  onDone,
}: {
  item: Extract<Item, { kind: 'particle' }>;
  onDone: () => void;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(1, { duration: item.ms, easing: Easing.out(Easing.quad) }));
    const id = setTimeout(onDone, item.ms);
    return () => clearTimeout(id);
  }, [item.ms, onDone, p]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.get(),
    transform: [{ translateX: item.dx * p.get() }, { translateY: item.dy * p.get() }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: item.x - item.size / 2,
          top: item.y - item.size / 2,
          width: item.size,
          height: item.size,
          backgroundColor: item.color,
        },
        style,
      ]}
    />
  );
}

function Float({ item, onDone }: { item: Extract<Item, { kind: 'float' }>; onDone: () => void }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(1, { duration: FLOAT_MS, easing: Easing.out(Easing.cubic) }));
    const id = setTimeout(onDone, FLOAT_MS);
    return () => clearTimeout(id);
  }, [onDone, p]);
  const style = useAnimatedStyle(() => ({
    opacity: p.get() < 0.7 ? 1 : 1 - (p.get() - 0.7) / 0.3,
    transform: [{ translateY: -space['4xl'] * p.get() }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.float, { left: item.x - FLOAT_W / 2, top: item.y - space.xl }, style]}>
      <Text variant="heading" align="center" style={{ color: item.color }}>
        {item.text}
      </Text>
    </Animated.View>
  );
}

function Toast({ item, onDone }: { item: Extract<Item, { kind: 'toast' }>; onDone: () => void }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(
      withSequence(
        withTiming(1, { duration: 160 }),
        withTiming(1, { duration: TOAST_MS - 320 }),
        withTiming(0, { duration: 160 }),
      ),
    );
    const id = setTimeout(onDone, TOAST_MS);
    return () => clearTimeout(id);
  }, [onDone, p]);
  const style = useAnimatedStyle(() => ({
    opacity: p.get(),
    transform: [{ scale: 0.8 + 0.2 * p.get() }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, style]}>
      <Text
        variant="title"
        align="center"
        style={{ color: item.color }}
        accessibilityLiveRegion="polite">
        {item.text}
      </Text>
    </Animated.View>
  );
}

export const FxLayer = forwardRef<FxHandle, { reduced: boolean }>(function FxLayer(
  { reduced },
  ref,
) {
  const [items, setItems] = useState<Item[]>([]);
  const next = useRef(1);
  const add = (i: DistributiveOmit<Item, 'id'>) => {
    const id = next.current++;
    setItems((xs) => [...xs, { ...i, id } as Item]);
  };
  const remove = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id));

  useImperativeHandle(ref, () => ({
    ring: (x, y, c, size = RING_SIZE) => add({ kind: 'ring', x, y, color: c, size }),
    burst: (x, y, c, n = 9) => {
      if (reduced) return;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const d = 30 + Math.random() * 28;
        add({
          kind: 'particle',
          x,
          y,
          color: i % 4 === 0 ? color.text.primary : c,
          dx: Math.cos(a) * d,
          dy: Math.sin(a) * d,
          size: 4 + Math.random() * 4,
          ms: 380 + Math.random() * 180,
        });
      }
    },
    float: (x, y, text, c = color.text.primary) => add({ kind: 'float', x, y, text, color: c }),
    toast: (text, c = color.text.primary) => add({ kind: 'toast', text, color: c }),
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden={false}>
      {items.map((i) => {
        const done = () => remove(i.id);
        if (i.kind === 'ring') return <Ring key={i.id} item={i} reduced={reduced} onDone={done} />;
        if (i.kind === 'particle') return <Particle key={i.id} item={i} onDone={done} />;
        if (i.kind === 'float') return <Float key={i.id} item={i} onDone={done} />;
        return <Toast key={i.id} item={i} onDone={done} />;
      })}
    </View>
  );
});

const FLOAT_W = 120;
const styles = StyleSheet.create({
  ring: { position: 'absolute', borderRadius: radius.pill },
  particle: { position: 'absolute', borderRadius: radius.pill },
  float: { position: 'absolute', width: FLOAT_W },
  toast: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
