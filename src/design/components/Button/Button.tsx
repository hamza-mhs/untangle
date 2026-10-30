import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { color, radius, size, space } from '../../tokens';
import type { IconName } from '../../icons';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type ButtonVariant = 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'lg' | 'md';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Defaults to the label. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

const FG: Record<ButtonVariant, string> = {
  primary: color.text.onLight,
  brand: color.text.primary,
  secondary: color.text.primary,
  ghost: color.text.secondary,
  danger: color.signal.dangerText,
};

/** Pill button (00-foundations §4.5). Primary = white; brand = violet gradient with a lip. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size: s = 'lg',
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const height = size.button[s];
  const inactive = disabled || loading;
  const fg = FG[variant];
  return (
    <PressableScale
      testID={testID}
      haptic
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      {...(accessibilityHint ? { accessibilityHint } : {})}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.base,
        { height, minHeight: size.touch },
        variant === 'brand' ? styles.brandLip : VARIANT[variant],
        disabled && !loading ? styles.disabled : null,
      ]}>
      {variant === 'brand' ? (
        <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="brand" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color.brand.violetLight} />
              <Stop offset="0.55" stopColor={color.brand.violet} />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#brand)" />
        </Svg>
      ) : null}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            <Text variant={variant === 'ghost' ? 'bodyStrong' : 'button'} style={{ color: fg }} numberOfLines={1}>
              {label}
            </Text>
            {icon ? <Icon name={icon} size={size.icon.sm} color={fg} /> : null}
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
    borderRadius: radius.pill,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  brandLip: { borderBottomWidth: 4, borderBottomColor: color.brand.violetDeep },
  disabled: { opacity: 0.35 },
});

const VARIANT = StyleSheet.create({
  primary: { backgroundColor: color.text.primary },
  brand: {},
  secondary: { backgroundColor: color.surface.glass },
  ghost: {},
  danger: { backgroundColor: color.signal.dangerSoft },
});
