import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { color, maxFontScale, tabularNumbers, typeScale, type TypeVariant } from '../../tokens';

const TONES = {
  primary: color.text.primary,
  secondary: color.text.secondary,
  muted: color.text.muted,
  faint: color.text.faint,
  onAccent: color.text.onAccent,
  accent: color.accent.primary,
  success: color.status.success,
  warning: color.status.warning,
  danger: color.status.danger,
  pink: color.mood.pink,
  sky: color.mood.sky,
  peri: color.mood.peri,
  green: color.mood.green,
  orange: color.mood.orange,
  iosLink: color.ios.link,
  dangerSoft: color.status.dangerSoft,
  shield: color.shield.subtitle,
  read: color.read,
  word: color.game.word,
  memory: color.game.memory,
  ink: color.ink,
} as const;

export type TextTone = keyof typeof TONES;

export type TextProps = ComponentProps<typeof Animated.Text> & {
  variant?: TypeVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
};

/**
 * The only text component features use (CODE_STANDARDS). Applies the type token, tone,
 * tabular numbers and the Dynamic Type cap for the variant. Built on Animated.Text so
 * animated colour styles (selection cross-fades) pass straight through `style`.
 */
export function Text({
  variant = 'body',
  tone = 'primary',
  align,
  style,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  return (
    <Animated.Text
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? maxFontScale(variant)}
      {...rest}
      style={[
        typeScale[variant],
        tabularNumbers,
        toneStyles[tone],
        align ? alignStyles[align] : null,
        style,
      ]}
    />
  );
}

const toneStyles = StyleSheet.create(
  Object.fromEntries(Object.entries(TONES).map(([k, v]) => [k, { color: v }])) as Record<
    TextTone,
    { color: string }
  >,
);

const alignStyles = StyleSheet.create({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
});
