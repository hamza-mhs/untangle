import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { color, layout } from '../../tokens';

export type ScreenProps = {
  children?: ReactNode;
  /** Scroll the content (default true). */
  scroll?: boolean;
  /** Pinned at the bottom, 16 pt above the safe area; content scrolls behind it. */
  footer?: ReactNode;
  /** Pinned above the scrolling content (e.g. OnboardingHeader). */
  header?: ReactNode;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

const ALL_EDGES: Edge[] = ['top', 'bottom', 'left', 'right'];

/** Safe area plus the black canvas (SPEC §3). */
export function Screen({
  children,
  scroll = true,
  footer,
  header,
  edges = ALL_EDGES,
  contentStyle,
  testID,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={edges} testID={testID}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  fill: { flex: 1 },
  content: { paddingBottom: layout.onboarding.contentTop - layout.onboarding.footerBottom / 2 },
  footer: {
    paddingHorizontal: layout.onboarding.optionsX,
    paddingTop: layout.onboarding.footerBottom / 2,
    paddingBottom: layout.onboarding.footerBottom,
  },
});
