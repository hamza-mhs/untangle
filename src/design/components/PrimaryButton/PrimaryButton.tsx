import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import { color, pill, size, space } from '../../tokens';
import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type PrimaryButtonVariant = 'accent' | 'light' | 'outline' | 'ghost';

export type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  /** accent = yellow CTA · light = white (Continue) · outline = 1.5 pt ring · ghost = text only. */
  variant?: PrimaryButtonVariant;
  /** Trailing icon (onboarding CTAs use `arrowRight`). */
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** 48 pt in-sheet secondary instead of 56. */
  compact?: boolean;
  testID?: string;
};

/** The CTA (SPEC §3): pill, 56 pt. `loading` swaps the label for "Loading…" in accentMuted. */
export function PrimaryButton({
  label,
  onPress,
  variant = 'accent',
  icon,
  loading = false,
  disabled = false,
  compact = false,
  testID,
}: PrimaryButtonProps) {
  const t = useT();
  const isInactive = disabled || loading;
  const isMutedAccent = variant === 'accent' && isInactive;
  const isDark = variant === 'outline' || variant === 'ghost';
  const fg = isMutedAccent
    ? color.accent.primaryMutedText
    : isDark
      ? color.text.primary
      : color.text.onAccent;

  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={[
        styles.base,
        compact ? styles.compact : styles.regular,
        variantStyles[variant],
        isMutedAccent && styles.accentMuted,
        isInactive && !isMutedAccent && styles.dimmed,
      ]}>
      <View style={styles.content}>
        <Text variant="body.l" style={{ color: fg }}>
          {loading ? t('common.loading') : label}
        </Text>
        {icon && !loading ? <Icon name={icon} size={size.icon.lg} color={fg} /> : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'stretch', justifyContent: 'center', paddingHorizontal: space.xxl - 2 },
  regular: { height: size.button, ...pill(size.button) },
  compact: { height: size.buttonCompact, ...pill(size.buttonCompact) },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm + 2,
  },
  accentMuted: { backgroundColor: color.accent.primaryMuted },
  /** Onboarding 01–05: disabled Continue fades to 40 %. */
  dimmed: { opacity: 0.4 },
});

const variantStyles = StyleSheet.create({
  accent: { backgroundColor: color.accent.primary },
  light: { backgroundColor: color.light.surface },
  outline: {
    backgroundColor: color.bg.transparent,
    borderWidth: size.outlineRing,
    borderColor: color.border.control,
  },
  ghost: { backgroundColor: color.bg.transparent },
});

