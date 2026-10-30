import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';

import { color, layout, radius, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { StepProgress } from '../StepProgress';
import { Text } from '../Text';

export type HeaderProps = {
  onBack?: () => void;
  title?: string;
  /** Onboarding progress next to the back chip. */
  progress?: { total: number; done: number };
  right?: ReactNode;
  testID?: string;
};

/**
 * Top bar: `‹` back chip (30 dp, 44 dp touch area), then a progress bar (onboarding) or a
 * centred title (detail screens), and an optional right action.
 */
export function Header({ onBack, title, progress, right, testID }: HeaderProps) {
  const t = useT();
  return (
    <View testID={testID} style={styles.row}>
      {onBack ? (
        <PressableScale
          testID={testID ? `${testID}.back` : 'header.back'}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={(size.touch - size.backChip) / 2}
          onPress={onBack}
          style={styles.back}>
          <Icon name="chevronLeft" size={size.icon.sm} color={color.text.primary} />
        </PressableScale>
      ) : (
        <View style={styles.backSpace} />
      )}
      {progress ? <StepProgress total={progress.total} done={progress.done} /> : null}
      {title ? (
        <Text variant="bodyStrong" align="center" numberOfLines={1} style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      {!progress && !title ? <View style={styles.flex} /> : null}
      {right ?? (title ? <View style={styles.backSpace} /> : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.touch,
    marginTop: layout.headerTop,
  },
  back: {
    width: size.backChip,
    height: size.backChip,
    borderRadius: radius.pill,
    backgroundColor: color.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpace: { width: size.backChip },
  title: { flex: 1 },
  flex: { flex: 1 },
});
