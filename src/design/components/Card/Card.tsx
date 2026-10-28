import { StyleSheet, View, type ViewProps } from 'react-native';

import { color, radius, rounded, space } from '../../tokens';

export type CardTone = 'raised' | 'surface' | 'accent' | 'danger';

export type CardProps = ViewProps & {
  tone?: CardTone;
  /** Inner padding (default 16). */
  padding?: number;
  /** Corner radius (default `radius.m`). */
  cornerRadius?: number;
};

/** Surface card (SPEC §3). No shadows: elevation is surface colour only. */
export function Card({ tone = 'raised', padding = space.lg, cornerRadius = radius.m, style, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[styles.base, toneStyles[tone], rounded(cornerRadius), { padding }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});

const toneStyles = StyleSheet.create({
  raised: { backgroundColor: color.bg.raised },
  surface: { backgroundColor: color.bg.surface },
  accent: { backgroundColor: color.accent.primary },
  danger: { backgroundColor: color.status.dangerSoftBg },
});
