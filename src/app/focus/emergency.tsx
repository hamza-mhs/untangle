import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Chip, PrimaryButton, Sheet } from '@/design/components';
import { color, radius, rounded, size, space, typeScale } from '@/design/tokens';
import {
  EMERGENCY_PASS_MINUTES,
  PASS_REASONS,
  passesLeftThisWeek,
  type PassReason,
} from '@/features/rules/emergencyPasses';
import { useRulesStore } from '@/features/rules/store';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

const MAX_NOTE = 140;

/**
 * FEmergency (formSheet): the logged escape hatch. A reason is required (none preselected),
 * the note is optional. "Keep focusing" comes first. Using a pass lifts the shields for 10 min
 * and logs {reason, note, at}; they come back by themselves. 0 left → E10.
 */
export default function Emergency() {
  const t = useT();
  const passLog = useRulesStore((s) => s.passLog);
  const logPass = useRulesStore((s) => s.logPass);
  const [reason, setReason] = useState<PassReason | null>(null);
  const [note, setNote] = useState('');
  const [now] = useState(() => Date.now());
  const left = passesLeftThisWeek(passLog, now);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/focus/run'));

  const handleUse = () => {
    if (!reason) return;
    if (left <= 0) {
      router.replace('/focus/no-passes');
      return;
    }
    const at = Date.now();
    logPass(
      { at, ruleId: 'focus', reason, ...(note.trim() ? { note: note.trim() } : {}) },
      at + EMERGENCY_PASS_MINUTES * 60_000,
    );
    haptics.warning();
    close();
  };

  return (
    <Sheet
      testID="focus.emergency"
      title={t('focus.emergency.title')}
      body={t('focus.emergency.body', { count: left, minutes: EMERGENCY_PASS_MINUTES })}
      actions={
        <>
          <PrimaryButton
            testID="focus.emergency.keep"
            label={t('focus.emergency.keep')}
            compact
            onPress={close}
          />
          <PrimaryButton
            testID="focus.emergency.use"
            label={t('focus.emergency.use', { minutes: EMERGENCY_PASS_MINUTES })}
            variant="outline"
            compact
            disabled={!reason}
            onPress={handleUse}
          />
        </>
      }>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {PASS_REASONS.map((r) => (
          <Chip
            key={r}
            testID={`focus.emergency.reason.${r}`}
            label={t(`focus.emergency.reasons.${r}`)}
            selected={reason === r}
            onPress={() => setReason(r)}
          />
        ))}
      </View>
      <TextInput
        testID="focus.emergency.note"
        value={note}
        onChangeText={setNote}
        maxLength={MAX_NOTE}
        placeholder={t('focus.emergency.notePlaceholder')}
        placeholderTextColor={color.text.muted}
        accessibilityLabel={t('focus.emergency.notePlaceholder')}
        style={styles.note}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg + 2 },
  note: {
    ...typeScale.body,
    color: color.text.primary,
    height: size.listRow - 2,
    ...rounded(radius.s),
    backgroundColor: color.bg.raisedHigh,
    paddingHorizontal: space.md + 2,
    marginTop: space.md + 2,
  },
});
