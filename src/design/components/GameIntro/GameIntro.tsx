import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { color, layout, pill, radius, rounded, size, space } from '../../tokens';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';
import { Icon } from '../Icon';

export type GameIntroProps = {
  tag: string;
  title: string;
  preview: ReactNode;
  rules: readonly [string, string, string];
  meta: string;
  /** The game's one colour (Start button and tag). */
  color: string;
  startLabel: string;
  onStart: () => void;
  testID?: string;
};

/** Same layout for every game (pack 2 SPEC §2): tag, title, preview, 3 rules, meta, Start. */
export function GameIntro({ tag, title, preview, rules, meta, color: accent, startLabel, onStart, testID }: GameIntroProps) {
  return (
    <View style={styles.root} testID={testID}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.tag, { backgroundColor: accent }]}>
          <Text variant="meta.strong" tone="onAccent">
            {tag}
          </Text>
        </View>
        <Text variant="title.m" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <View style={styles.preview} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {preview}
        </View>
        {rules.map((r, i) => (
          <View key={r} style={styles.rule}>
            <View style={styles.num}>
              <Text variant="body.l.strong">{i + 1}</Text>
            </View>
            <Text variant="body.xl" style={styles.flex}>
              {r}
            </Text>
          </View>
        ))}
        <Text variant="label" tone="muted" style={styles.meta}>
          {meta}
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        <PressableScale
          testID="game.start"
          accessibilityRole="button"
          accessibilityLabel={startLabel}
          onPress={onStart}
          style={[styles.start, { backgroundColor: accent }]}>
          <Text variant="body.l" tone="onAccent">
            {startLabel}
          </Text>
          <Icon name="arrowRight" size={size.icon.lg} color={color.text.onAccent} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: layout.onboarding.optionsX, paddingTop: space.lg, paddingBottom: space.lg },
  tag: {
    alignSelf: 'flex-start',
    marginLeft: layout.onboarding.titleX - layout.onboarding.optionsX,
    height: size.startPill,
    ...pill(size.startPill),
    paddingHorizontal: space.md + 2,
    justifyContent: 'center',
  },
  title: { marginTop: space.sm + 2, paddingHorizontal: layout.onboarding.titleX - layout.onboarding.optionsX },
  preview: {
    marginTop: space.xxl,
    minHeight: size.answerBox * 1.8,
    ...rounded(radius.l),
    backgroundColor: color.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    overflow: 'hidden',
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md + 2,
    marginTop: space.lg + 2,
    paddingHorizontal: layout.onboarding.titleX - layout.onboarding.optionsX,
  },
  num: {
    width: size.backButton,
    height: size.backButton,
    ...pill(size.backButton),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg.raised,
  },
  flex: { flex: 1 },
  meta: { marginTop: space.xl, paddingHorizontal: layout.onboarding.subtitleX - layout.onboarding.optionsX },
  footer: { paddingHorizontal: layout.onboarding.optionsX, paddingBottom: layout.onboarding.footerBottom },
  start: {
    height: size.button,
    ...pill(size.button),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm + 2,
  },
});
