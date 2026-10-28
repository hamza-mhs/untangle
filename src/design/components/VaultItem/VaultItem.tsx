import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';

import { color, pill, radius, rounded, size, space } from '../../tokens';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type VaultItemProps = {
  name: string;
  /** Already-translated size tag ("SMALL"). */
  sizeLabel: string;
  cost: number;
  points: number;
  onRedeem: () => void;
  onLongPress?: () => void;
  testID?: string;
};

/**
 * Pack 2 SPEC §2 VaultItem: name + mono size tag, cost or Redeem, and a progress bar towards
 * the cost (accent when reachable). "Redeem" only shows when the points cover it.
 */
export function VaultItem({ name, sizeLabel, cost, points, onRedeem, onLongPress, testID }: VaultItemProps) {
  const t = useT();
  const ready = points >= cost;
  const share = Math.min(1, cost > 0 ? points / cost : 0);
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t(ready ? 'rewards.vault.readyA11y' : 'rewards.vault.toGoA11y', {
        name,
        cost,
        toGo: cost - points,
      })}
      disabled={!onLongPress}
      onLongPress={onLongPress}
      style={styles.card}>
      <View style={styles.row}>
        <Text variant="headline" numberOfLines={1} style={styles.name}>
          {name}{' '}
          <Text variant="mono.label" tone="muted">
            {sizeLabel}
          </Text>
        </Text>
        {ready ? (
          <PressableScale
            testID={testID ? `${testID}.redeem` : undefined}
            accessibilityRole="button"
            accessibilityLabel={t('rewards.vault.redeem')}
            onPress={onRedeem}
            style={styles.redeem}>
            <Text variant="body.strong" tone="onAccent">
              {t('rewards.vault.redeem')}
            </Text>
          </PressableScale>
        ) : (
          <Text variant="receipt" tone="muted">
            {t('rewards.vault.cost', { cost: cost.toLocaleString() })}
          </Text>
        )}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${share * 100}%` }, ready && styles.fillReady]} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { ...rounded(radius.l), backgroundColor: color.bg.raised, padding: space.xl, gap: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: size.statusPill + space.sm },
  name: { flex: 1 },
  redeem: {
    height: size.statusPill + space.md,
    ...pill(size.statusPill + space.md),
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    backgroundColor: color.accent.primary,
  },
  track: { height: size.delayBar, ...pill(size.delayBar), backgroundColor: color.bg.raisedHigh, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: color.text.muted },
  fillReady: { backgroundColor: color.accent.primary },
});
