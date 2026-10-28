import type { ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import { color, layout, pill, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type GameShellRight =
  | { kind: 'points'; value: number }
  /** Live time left, already formatted by the caller's clock (LiveText or Countdown). */
  | { kind: 'timer'; node: ReactNode }
  | { kind: 'pill'; label: string; bg: string }
  | { kind: 'none' };

export type GameShellProps = {
  title: string;
  right: GameShellRight;
  onClose: () => void;
  /** `quit` asks "Quit? No points" first (mid-game); `back` / `close` just close. */
  closeKind?: 'quit' | 'close' | 'back';
  /** Segmented progress under the bar: `done` filled white, `current` in `color`. */
  progress?: { total: number; done: number; color: string };
  footer?: ReactNode;
  children: ReactNode;
  testID?: string;
};

/**
 * Pack 2 SPEC §2 GameShell, also the frame for silence, reading and the summary: a 44 pt ringed
 * close on the left, centred title, points / timer pill on the right, optional segmented
 * progress. Closing mid-game asks "Quit? No points" (system alert).
 */
export function GameShell({
  title,
  right,
  onClose,
  closeKind = 'close',
  progress,
  footer,
  children,
  testID,
}: GameShellProps) {
  const t = useT();
  const handleClose = () => {
    if (closeKind !== 'quit') {
      onClose();
      return;
    }
    haptics.warning();
    Alert.alert(t('reps.quit.title'), t('reps.quit.body'), [
      { text: t('reps.quit.keep'), style: 'cancel' },
      { text: t('reps.quit.quit'), style: 'destructive', onPress: onClose },
    ]);
  };
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']} testID={testID}>
      <View style={styles.bar}>
        <PressableScale
          testID="game.close"
          accessibilityRole="button"
          accessibilityLabel={t(closeKind === 'back' ? 'common.back' : 'reps.quit.a11y')}
          onPress={handleClose}
          style={styles.close}>
          <Icon
            name={closeKind === 'back' ? 'chevronLeft' : 'close'}
            size={size.icon.sm}
            color={color.text.primary}
          />
        </PressableScale>
        <Text variant="body.strong" accessibilityRole="header" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <View style={styles.right}>
          {right.kind === 'points' ? (
            <Text variant="label.strong" tone="muted">
              +{right.value}
            </Text>
          ) : right.kind === 'timer' ? (
            <View style={[styles.pill, styles.timer]} accessibilityRole="timer">
              <Icon name="timer" size={size.icon.xs - 3} color={color.text.onAccent} />
              {right.node}
            </View>
          ) : right.kind === 'pill' ? (
            <View style={[styles.pill, { backgroundColor: right.bg }]}>
              <Text variant="label.strong" tone="onAccent">
                {right.label}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {progress ? (
        <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: progress.total, now: progress.done }}>
          {Array.from({ length: progress.total }, (_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                i < progress.done && styles.segmentDone,
                i === progress.done && { backgroundColor: progress.color },
              ]}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.body}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  bar: {
    height: size.hitTarget,
    marginTop: space.xs,
    paddingHorizontal: layout.onboarding.headerX,
    flexDirection: 'row',
    alignItems: 'center',
  },
  close: {
    width: size.hitTarget,
    height: size.hitTarget,
    ...pill(size.hitTarget),
    borderWidth: size.backButtonRing,
    borderColor: color.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center' },
  right: { minWidth: size.hitTarget, alignItems: 'flex-end' },
  pill: {
    height: size.startPill,
    ...pill(size.startPill),
    paddingHorizontal: space.md - 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 1,
  },
  timer: { backgroundColor: color.accent.primary },
  progress: {
    flexDirection: 'row',
    gap: space.xs,
    marginTop: space.md,
    paddingHorizontal: layout.gutter,
  },
  segment: { flex: 1, height: size.progress, ...pill(size.progress), backgroundColor: color.bg.raisedHigh },
  segmentDone: { backgroundColor: color.text.primary },
  body: { flex: 1 },
  footer: { paddingHorizontal: layout.onboarding.optionsX, paddingBottom: layout.onboarding.footerBottom, gap: space.sm },
});
