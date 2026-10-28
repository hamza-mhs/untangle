import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/design/components';
import { color, layout, pill, radius, rounded, size } from '@/design/tokens';
import { useT } from '@/i18n';

import { CoachPointer } from './CoachPointer';
import { PulseRing } from './PulseRing';

const C = layout.coach;

const ROWS = [
  'social',
  'entertainment',
  'games',
  'creativity',
  'education',
  'productivity',
] as const;
/** Ticked in the illustration. */
const TICKED = new Set<string>(['social', 'entertainment']);
const HIGHLIGHTED = 'social';

/** OB10: an illustrated FamilyActivityPicker, with "Then Done" pointing at Done. */
export function MockPicker() {
  const t = useT();
  return (
    <View
      style={styles.sheet}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('onboarding.pickApps.mockA11y')}>
      <View style={styles.header}>
        <Text variant="body.lead" tone="iosLink">
          {t('onboarding.pickApps.mockCancel')}
        </Text>
        <Text variant="label.chip">{t('onboarding.pickApps.mockTitle')}</Text>
        <View style={styles.done}>
          <PulseRing cornerRadius={C.pillHeight / 2} />
          <Text variant="meta.strong" tone="onAccent">
            {t('onboarding.pickApps.mockDone')}
          </Text>
        </View>
      </View>
      {ROWS.map((row) => (
        <View key={row} style={[styles.row, row === HIGHLIGHTED && styles.rowHighlighted]}>
          {TICKED.has(row) ? (
            <View style={[styles.check, styles.checkOn]}>
              <Icon name="check" size={size.icon.xs - 2} color={color.text.primary} />
            </View>
          ) : (
            <View style={[styles.check, styles.checkOff]} />
          )}
          <Text variant="body.lead" style={styles.rowLabel}>
            {t(`onboarding.pickApps.mockRows.${row}`)}
          </Text>
          <Icon name="chevronRight" size={size.icon.sm} color={color.ios.chevron} />
        </View>
      ))}
      <View style={styles.coach} pointerEvents="none">
        <CoachPointer label={t('onboarding.pickApps.coach')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    height: C.pickerHeight,
    ...rounded(radius.l),
    backgroundColor: color.bg.raised,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: C.pickerHeaderY,
    paddingHorizontal: C.pickerPaddingX,
    borderBottomWidth: size.hairline,
    borderBottomColor: color.ios.separator,
  },
  done: {
    height: C.pillHeight,
    ...pill(C.pillHeight),
    paddingHorizontal: C.pillPaddingX,
    justifyContent: 'center',
    backgroundColor: color.accent.primary,
  },
  row: {
    height: C.pickerRow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: C.pickerRowGap,
    paddingHorizontal: C.pickerPaddingX,
    borderBottomWidth: size.hairline,
    borderBottomColor: color.border.hairline,
  },
  rowHighlighted: { backgroundColor: color.accent.primaryTint },
  rowLabel: { flex: 1 },
  check: {
    width: C.pickerCheck,
    height: C.pickerCheck,
    ...pill(C.pickerCheck),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: color.ios.link },
  checkOff: { borderWidth: size.outlineRing, borderColor: color.ios.chevron },
  coach: { position: 'absolute', top: C.pickerCoachTop, right: C.pickerCoachRight },
});
