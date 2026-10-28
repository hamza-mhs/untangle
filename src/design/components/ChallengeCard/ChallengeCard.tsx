import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import { color, radius, rounded, size, space } from '../../tokens';
import { useReducedMotion } from '../../useReducedMotion';
import { Ghost } from '../Ghost';
import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text, type TextTone } from '../Text';

export type ChallengeDifficulty = 'easy' | 'med' | 'hard';
export type ChallengeCheck = 'timed' | 'yourWord' | 'verified';
export type ChallengeCardState = 'faceDown' | 'faceUp' | 'selected' | 'done';

export type ChallengeCardProps = {
  difficulty: ChallengeDifficulty;
  icon: IconName;
  title: string;
  meta: string;
  check: ChallengeCheck;
  points: number;
  state: ChallengeCardState;
  onPress?: () => void;
  testID?: string;
};

const FLIP_MS = 400;
const GHOST_BACK = 56;
const CHECK_TONE: Record<ChallengeCheck, TextTone> = {
  timed: 'accent',
  yourWord: 'sky',
  verified: 'success',
};

/**
 * Pack 2 SPEC §2. Face-down shows the ghost back and the difficulty in mono. Flip = rotateY
 * 180° over 400 ms with a haptic at the midpoint; Reduce Motion cross-fades instead.
 * Selected = 2 pt accent ring.
 */
export function ChallengeCard({
  difficulty,
  icon,
  title,
  meta,
  check,
  points,
  state,
  onPress,
  testID,
}: ChallengeCardProps) {
  const t = useT();
  const still = useReducedMotion();
  const isUp = state !== 'faceDown';
  const turn = useSharedValue(isUp ? 1 : 0);
  useEffect(() => {
    turn.set(withTiming(isUp ? 1 : 0, { duration: still ? 0 : FLIP_MS }));
  }, [isUp, still, turn]);
  // One light haptic as the card passes edge-on.
  useAnimatedReaction(
    () => turn.value >= 0.5,
    (past, prev) => {
      if (prev !== null && past !== prev) runOnJS(haptics.select)();
    },
  );

  const back = useAnimatedStyle(() =>
    still
      ? { opacity: 1 - turn.value }
      : {
          opacity: turn.value < 0.5 ? 1 : 0,
          transform: [{ perspective: 800 }, { rotateY: `${interpolate(turn.value, [0, 1], [0, 180])}deg` }],
        },
  );
  const front = useAnimatedStyle(() =>
    still
      ? { opacity: turn.value }
      : {
          opacity: turn.value >= 0.5 ? 1 : 0,
          transform: [{ perspective: 800 }, { rotateY: `${interpolate(turn.value, [0, 1], [-180, 0])}deg` }],
        },
  );

  const diffLabel = t(`challenges.difficulty.${difficulty}`);
  const label = isUp
    ? `${diffLabel}. ${title}, ${meta}. ${t(`challenges.check.${check}`)}, +${points}`
    : t('challenges.card.faceDownA11y', { difficulty: diffLabel });
  const isDone = state === 'done';

  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: state === 'selected', disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={styles.card}>
      <Animated.View style={[styles.face, styles.back, back]} pointerEvents="none">
        <View style={styles.backInset}>
          <Ghost mood={0.5} width={GHOST_BACK} />
        </View>
        <Text variant="mono.label" tone="muted" align="center" style={styles.backLabel}>
          {diffLabel}
        </Text>
      </Animated.View>
      <Animated.View
        style={[styles.face, styles.front, state === 'selected' && styles.selected, front]}
        pointerEvents="none">
        <View style={styles.row}>
          <View style={[styles.icon, isDone && styles.iconDone]}>
            <Icon
              name={isDone ? 'check' : icon}
              size={size.icon.sm}
              color={isDone ? color.text.muted : color.text.onAccent}
            />
          </View>
          <Text variant="mono.label" tone="muted">
            {diffLabel}
          </Text>
        </View>
        <View>
          <Text
            variant="body.strong"
            tone={isDone ? 'muted' : 'primary'}
            numberOfLines={3}
            style={isDone && styles.struck}>
            {title}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={2} style={styles.meta}>
            {meta}
          </Text>
        </View>
        <View style={styles.row}>
          <Text variant="mono.label" tone={CHECK_TONE[check]}>
            {t(`challenges.check.${check}`)}
          </Text>
          <Text variant="caption.strong" tone="accent">
            +{points}
          </Text>
        </View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, height: size.challengeCard.height },
  face: { ...StyleSheet.absoluteFill, ...rounded(radius.m), backfaceVisibility: 'hidden' },
  back: {
    backgroundColor: color.bg.raised,
    borderWidth: size.ring,
    borderColor: color.border.control,
    padding: space.sm + 2,
  },
  backInset: {
    flex: 1,
    ...rounded(radius.s - 2),
    borderWidth: size.ring,
    borderColor: color.border.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: { position: 'absolute', left: 0, right: 0, bottom: space.lg + 2 },
  front: { backgroundColor: color.bg.raised, padding: space.md, justifyContent: 'space-between' },
  selected: { borderWidth: size.selectedRing, borderColor: color.accent.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon: {
    width: size.challengeCard.icon,
    height: size.challengeCard.icon,
    ...rounded(size.appTile.l.radius),
    backgroundColor: color.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDone: { backgroundColor: color.border.control },
  meta: { marginTop: space.xs },
  struck: { textDecorationLine: 'line-through' },
});
