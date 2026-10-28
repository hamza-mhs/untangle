import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { color, layout, radius, rounded, size, space } from '../../tokens';
import { Icon, type IconName } from '../Icon';
import { Text, type TextTone } from '../Text';

export type SheetIconTone = 'neutral' | 'accent' | 'danger';

export type SheetProps = {
  title: string;
  /** Line under the title (or a muted second title line with `size="large"`). */
  sub?: string;
  /** Paragraph under the header row. */
  body?: string;
  icon?: IconName;
  /** Icon tile: raisedHigh + yellow glyph (E02), yellow + black (P07), coral (E05). */
  iconTone?: SheetIconTone;
  /** Small caps line above the title ("PRO · DAY 5 OF 7"). */
  overline?: string;
  /** `regular` = 19–20 pt headline (E05, E07, E09); `large` = 24 pt title (P02, P06, FFocusStart). */
  size?: 'regular' | 'large';
  children?: ReactNode;
  /** Pinned to the bottom: primary first, then outline. */
  actions: ReactNode;
  testID?: string;
};

const S = layout.state;

const ICON_TONES: Record<SheetIconTone, { bg: 'neutral' | 'accent' | 'danger'; glyph: string }> = {
  neutral: { bg: 'neutral', glyph: color.accent.primary },
  accent: { bg: 'accent', glyph: color.text.onAccent },
  danger: { bg: 'danger', glyph: color.status.dangerSoft },
};

/**
 * Inside of a native `formSheet` route (SPEC §3 Sheet). The grabber and the 22 pt top radius
 * come from the native sheet options; this lays out the content and pins the actions.
 */
export function Sheet({
  title,
  sub,
  body,
  icon,
  iconTone = 'neutral',
  overline,
  size: sheetSize = 'regular',
  children,
  actions,
  testID,
}: SheetProps) {
  const isLarge = sheetSize === 'large';
  const tone = ICON_TONES[iconTone];
  return (
    <SafeAreaView style={styles.root} edges={['bottom']} testID={testID}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {overline ? (
          <Text variant="micro" tone="accent" style={styles.overline}>
            {overline}
          </Text>
        ) : null}
        <View style={styles.head}>
          {icon ? (
            <View style={[styles.iconTile, iconBg[tone.bg]]}>
              <Icon name={icon} size={size.icon.lg} color={tone.glyph} />
            </View>
          ) : null}
          <View style={styles.titles}>
            <Text variant={isLarge ? 'title.s' : 'headline'} accessibilityRole="header">
              {title}
              {isLarge && sub ? (
                <Text variant="title.s" tone={'muted' satisfies TextTone}>
                  {`\n${sub}`}
                </Text>
              ) : null}
            </Text>
            {!isLarge && sub ? (
              <Text variant="meta" tone="muted">
                {sub}
              </Text>
            ) : null}
          </View>
        </View>
        {body ? (
          <Text variant="body.s" tone={icon ? 'secondary' : 'muted'} style={styles.body}>
            {body}
          </Text>
        ) : null}
        {children}
      </ScrollView>
      <View style={styles.actions}>{actions}</View>
    </SafeAreaView>
  );
}

/** Label/value rows on a raisedHigh card inside a sheet (P02 "what changes", P06, P08). */
export function SheetList({
  rows,
  testID,
}: {
  rows: readonly { id: string; label: string; value: ReactNode; valueTone?: TextTone }[];
  testID?: string;
}) {
  return (
    <View style={styles.list} testID={testID}>
      {rows.map((r, i) => (
        <View
          key={r.id}
          style={[styles.listRow, i > 0 && styles.listSeparator]}
          accessible={typeof r.value === 'string'}>
          <Text variant="label" style={styles.listLabel}>
            {r.label}
          </Text>
          {typeof r.value === 'string' ? (
            <Text variant="label" tone={r.valueTone ?? 'muted'}>
              {r.value}
            </Text>
          ) : (
            r.value
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg.raised,
    paddingTop: S.sheetPadding,
    paddingHorizontal: S.sheetPadding,
  },
  scroll: { flexGrow: 0 },
  overline: { marginBottom: space.xs + 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: S.sheetIconGap },
  iconTile: {
    width: S.sheetIcon,
    height: S.sheetIcon,
    ...rounded(radius.s),
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { flex: 1 },
  body: { marginTop: S.sheetBodyTop - space.xs },
  actions: {
    marginTop: 'auto',
    gap: S.actionsGap,
    paddingTop: space.lg,
    paddingBottom: layout.onboarding.footerBottom,
    marginHorizontal: layout.gutter - S.sheetPadding,
  },
  list: {
    marginTop: space.lg,
    ...rounded(radius.m),
    backgroundColor: color.bg.raisedHigh,
    overflow: 'hidden',
  },
  listRow: {
    minHeight: size.listRow - 2,
    paddingHorizontal: space.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
  },
  listSeparator: { borderTopWidth: size.hairline, borderTopColor: color.border.control },
  listLabel: { flex: 1 },
});

const iconBg = StyleSheet.create({
  neutral: { backgroundColor: color.bg.raisedHigh },
  accent: { backgroundColor: color.accent.primary },
  danger: { backgroundColor: color.status.dangerSoftBg },
});
