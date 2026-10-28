import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';

import { color, radius, rounded, size, space } from '../../tokens';
import { Text } from '../Text';

/** A cell is a count/word ("2", "Unlimited") or a yes/no mark. */
export type FeatureCell = string | boolean;
export type FeatureRow = { id: string; feature: string; free: FeatureCell; pro: FeatureCell };

/** Free vs Pro (SPEC §3). Copy lives in features/paywall/featureRows.ts. */
export function FeatureTable({ rows, testID }: { rows: readonly FeatureRow[]; testID?: string }) {
  const t = useT();
  const cell = (c: FeatureCell) => (c === true ? '✓' : c === false ? '—' : c);
  const a11y = (c: FeatureCell) =>
    c === true ? t('paywall.table.yes') : c === false ? t('paywall.table.no') : c;
  return (
    <View testID={testID} style={styles.table}>
      <View style={styles.head} importantForAccessibility="no-hide-descendants">
        <Text variant="overline.s" tone="muted" style={styles.featureCol}>
          {t('paywall.table.feature')}
        </Text>
        <Text variant="overline.s" tone="muted" style={styles.col}>
          {t('paywall.table.free')}
        </Text>
        <Text variant="overline.s" tone="accent" style={styles.col}>
          {t('paywall.table.pro')}
        </Text>
      </View>
      {rows.map((r) => (
        <View
          key={r.id}
          style={styles.row}
          accessible
          accessibilityLabel={t('paywall.table.rowA11y', {
            feature: r.feature,
            free: a11y(r.free),
            pro: a11y(r.pro),
          })}>
          <Text variant="meta" style={styles.featureCol}>
            {r.feature}
          </Text>
          <Text variant="meta" tone="muted" style={styles.col}>
            {cell(r.free)}
          </Text>
          <Text variant="meta" style={styles.col}>
            {cell(r.pro)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const FEATURE_FLEX = 1.5;

const styles = StyleSheet.create({
  table: { ...rounded(radius.m), backgroundColor: color.bg.raised, overflow: 'hidden' },
  head: {
    height: size.tableHead,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  row: {
    minHeight: size.chipS,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    borderTopWidth: size.hairline,
    borderTopColor: color.border.hairline,
  },
  featureCol: { flex: FEATURE_FLEX },
  col: { flex: 1 },
});
