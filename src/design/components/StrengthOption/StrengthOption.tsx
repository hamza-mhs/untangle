import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import { color, layout, motion, pill, radius, rounded, size, space } from '../../tokens';
import { useDuration } from '../../useReducedMotion';
import { PressableScale } from '../PressableScale';
import { RadioDot } from '../RadioDot';
import { Text } from '../Text';

export type StrengthKind = 'pause' | 'earn' | 'locked';

export type StrengthOptionProps = {
  strength: StrengthKind;
  selected: boolean;
  onPress: () => void;
  /** Shows the "Pro" tag (Locked); otherwise "Free". */
  locked?: boolean;
  /** `card` = OB08 (128 pt, yellow when picked); `row` = the rule editor (76 pt, radio + ring). */
  variant?: 'card' | 'row';
  testID?: string;
};

const L = layout.strength;

/** Radio card: title, description and a Free / Pro tag (SPEC §3). Selected = yellow. */
export function StrengthOption({
  strength,
  selected,
  onPress,
  locked = false,
  variant = 'card',
  testID,
}: StrengthOptionProps) {
  if (variant === 'row') {
    return (
      <StrengthRow strength={strength} selected={selected} onPress={onPress} locked={locked} testID={testID} />
    );
  }
  return <StrengthCard strength={strength} selected={selected} onPress={onPress} locked={locked} testID={testID} />;
}

type InnerProps = Omit<StrengthOptionProps, 'variant' | 'locked' | 'testID'> & {
  locked: boolean;
  testID: string | undefined;
};

function StrengthCard({ strength, selected, onPress, locked, testID }: InnerProps) {
  const t = useT();
  const duration = useDuration(motion.select);
  const p = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    p.set(withTiming(selected ? 1 : 0, { duration }));
  }, [selected, duration, p]);

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [color.bg.raised, color.accent.primary]),
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(p.value, [0, 1], [color.text.primary, color.text.onAccent]),
  }));
  const tagStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [color.bg.raisedHigh, color.bg.canvas]),
  }));
  const tagTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(p.value, [0, 1], [color.text.primary, color.accent.primary]),
  }));

  const title = t(`strength.${strength}.title`);
  const description = t(`strength.${strength}.description`);
  const tag = locked ? t('strength.pro') : t('strength.free');

  return (
    <PressableScale
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}, ${tag}. ${description}`}
      onPress={() => {
        haptics.select();
        onPress();
      }}>
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.top}>
          <Text variant="title.option" style={textStyle}>
            {title}
          </Text>
          <Animated.View style={[styles.tag, tagStyle]}>
            <Text variant="caption.strong" style={tagTextStyle}>
              {tag}
            </Text>
          </Animated.View>
        </View>
        <Text variant="label.chip" style={[styles.description, textStyle]}>
          {description}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

function StrengthRow({ strength, selected, onPress, locked, testID }: InnerProps) {
  const t = useT();
  const title = t(`strength.${strength}.title`);
  const description = t(`strength.${strength}.short`);
  const tag = locked ? t('strength.pro') : t('strength.free');
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}, ${tag}. ${description}`}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={[styles.row, selected && styles.rowSelected]}>
      <RadioDot isSelected={selected} />
      <View style={styles.rowTexts}>
        <Text variant="body.strong">{title}</Text>
        <Text variant="meta" tone="muted">
          {description}
        </Text>
      </View>
      <View style={[styles.rowTag, locked ? styles.rowTagPro : styles.rowTagFree]}>
        <Text variant="caption.strong" tone={locked ? 'onAccent' : 'muted'}>
          {tag}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.strengthRow,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  rowSelected: { borderWidth: size.selectedRing, borderColor: color.accent.primary },
  rowTexts: { flex: 1 },
  rowTag: {
    height: size.smallTag,
    ...pill(size.smallTag),
    paddingHorizontal: space.sm + 1,
    justifyContent: 'center',
  },
  rowTagFree: { backgroundColor: color.bg.raisedHigh },
  rowTagPro: { backgroundColor: color.accent.primary },
  card: {
    minHeight: L.height,
    ...rounded(radius.l),
    paddingVertical: L.paddingY,
    paddingHorizontal: L.paddingX,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: {
    height: L.tagHeight,
    ...pill(L.tagHeight),
    paddingHorizontal: L.tagPaddingX,
    justifyContent: 'center',
  },
  description: { marginTop: L.descriptionTop, opacity: 0.8 },
});
