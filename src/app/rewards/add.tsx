import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { PrimaryButton, Segmented, Sheet, Text } from '@/design/components';
import { color, radius, rounded, size, space, typeScale } from '@/design/tokens';
import { SUGGESTED_COST, useVaultStore, VAULT_SIZES } from '@/features/rewards/vault';
import { useT } from '@/i18n';
import type { VaultSize } from '@/storage/ledgerRepo';

const MAX_NAME = 32;
const MAX_COST = 99_999;

/** FRewards "+ Add": name, size (with a suggested cost) and the cost itself. */
export default function AddVaultItem() {
  const t = useT();
  const [name, setName] = useState('');
  const [itemSize, setItemSize] = useState<VaultSize>('small');
  const [cost, setCost] = useState(String(SUGGESTED_COST.small));
  const parsed = Number(cost);
  const isValid =
    name.trim().length > 0 && Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_COST;

  const pickSize = (s: VaultSize) => {
    // Keep a cost the user typed; only replace one we suggested.
    if (Object.values(SUGGESTED_COST).includes(parsed) || cost === '')
      setCost(String(SUGGESTED_COST[s]));
    setItemSize(s);
  };

  const save = () => {
    if (!isValid) return;
    useVaultStore.getState().add(name, itemSize, parsed);
    router.back();
  };

  return (
    <Sheet
      testID="rewards.add"
      title={t('rewards.add.title')}
      body={t('rewards.add.body')}
      actions={
        <>
          <PrimaryButton
            testID="rewards.add.save"
            label={t('rewards.add.save')}
            compact
            disabled={!isValid}
            onPress={save}
          />
          <PrimaryButton
            label={t('common.cancel')}
            variant="outline"
            compact
            onPress={() => router.back()}
          />
        </>
      }>
      <View style={styles.form}>
        <TextInput
          testID="rewards.add.name"
          value={name}
          onChangeText={setName}
          maxLength={MAX_NAME}
          autoFocus
          placeholder={t('rewards.add.namePlaceholder')}
          placeholderTextColor={color.text.muted}
          accessibilityLabel={t('rewards.add.name')}
          style={styles.input}
        />
        <Segmented
          testID="rewards.add.size"
          options={VAULT_SIZES.map((s) => ({ value: s, label: t(`rewards.size.${s}`) }))}
          value={itemSize}
          onChange={pickSize}
        />
        <View style={styles.costRow}>
          <TextInput
            testID="rewards.add.cost"
            value={cost}
            onChangeText={(v) => setCost(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={5}
            accessibilityLabel={t('rewards.add.cost')}
            style={[styles.input, styles.cost]}
          />
          <Text variant="body.l" tone="muted">
            {t('rewards.add.pts')}
          </Text>
        </View>
        <Text variant="meta" tone="muted">
          {t('rewards.add.suggested', {
            small: SUGGESTED_COST.small.toLocaleString(),
            medium: SUGGESTED_COST.medium.toLocaleString(),
            big: SUGGESTED_COST.big.toLocaleString(),
          })}
        </Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.md, marginTop: space.lg },
  input: {
    ...typeScale.body,
    color: color.text.primary,
    height: size.listRow - 2,
    ...rounded(radius.s),
    backgroundColor: color.bg.raisedHigh,
    paddingHorizontal: space.md + 2,
  },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cost: { flex: 1 },
});
