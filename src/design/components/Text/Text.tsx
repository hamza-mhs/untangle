import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { color, maxFontScale, type, type TypeRole } from '../../tokens';

const TONES = {
  primary: color.text.primary,
  secondary: color.text.secondary,
  body: color.text.body,
  tertiary: color.text.tertiary,
  onLight: color.text.onLight,
  success: color.signal.success,
  danger: color.signal.danger,
  warning: color.signal.warning,
  violet: color.brand.violetLight,
} as const;

export type TextTone = keyof typeof TONES;

export type TextProps = RNTextProps & {
  variant?: TypeRole;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
};

/** The only text component. Variant = the type role token; tone = the colour. */
export function Text({ variant = 'body', tone = 'primary', align, style, ...rest }: TextProps) {
  return (
    <RNText
      maxFontSizeMultiplier={maxFontScale(variant)}
      style={[type[variant], { color: TONES[tone] }, align ? { textAlign: align } : null, style]}
      {...rest}
    />
  );
}
