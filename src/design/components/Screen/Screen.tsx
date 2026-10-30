import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { color, layout, space } from '../../tokens';

export type ScreenProps = {
  children: ReactNode;
  /** `app` = black, `game` = ink base under game art. */
  variant?: 'app' | 'game';
  /** Horizontal gutter: onboarding 24, tab screens 18, none for full-bleed. */
  gutter?: 'onboarding' | 'tab' | 'none';
  scroll?: boolean;
  /** Pinned under the content (bottom CTA area). */
  footer?: ReactNode;
  /** Above the content, outside the scroll view (headers). */
  header?: ReactNode;
  edges?: readonly Edge[];
  /** Full-bleed decoration behind everything (a Glow, a star field). */
  background?: ReactNode;
  testID?: string;
};

const GUTTER = { onboarding: layout.gutterOnboarding, tab: layout.gutterTab, none: 0 } as const;

/** Every screen's root: safe areas, background, gutter, optional scroll and footer slot. */
export function Screen({
  children,
  variant = 'app',
  gutter = 'onboarding',
  scroll = false,
  footer,
  header,
  edges = ['top', 'bottom', 'left', 'right'],
  background,
  testID,
}: ScreenProps) {
  const pad = { paddingHorizontal: GUTTER[gutter] };
  return (
    <SafeAreaView
      testID={testID}
      edges={edges}
      style={[styles.root, variant === 'game' ? styles.game : styles.app]}>
      {background}
      {header ? <View style={pad}>{header}</View> : null}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[pad, styles.scrollContent]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, pad]}>{children}</View>
      )}
      {footer ? <View style={[pad, styles.footer]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  app: { backgroundColor: color.bg.app },
  game: { backgroundColor: color.bg.ink },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: space['2xl'] },
  footer: { paddingTop: space.lg, paddingBottom: space.lg, gap: space.xs },
});
