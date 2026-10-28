import { StyleSheet, View } from 'react-native';

import { Text } from '@/design/components';
import { color, layout, pill, radius, rounded, size } from '@/design/tokens';

import { CoachPointer } from './CoachPointer';
import { PulseRing } from './PulseRing';

const C = layout.coach;

export type CoachDialogProps = {
  title: string;
  body: string;
  /** Left and right buttons, as the OS lays them out. */
  buttons: readonly [string, string];
  /** Which button the user should tap (0 = left). */
  target: 0 | 1;
  coach: string;
  /** One label for the whole illustration. */
  accessibilityLabel: string;
};

/**
 * OB09 / OB11: an illustrated iOS permission alert inside a dashed frame, the button to tap
 * highlighted and pulsing, with a pointer under it. Purely illustrative (not pressable).
 */
export function CoachDialog({
  title,
  body,
  buttons,
  target,
  coach,
  accessibilityLabel,
}: CoachDialogProps) {
  return (
    <View
      style={styles.frame}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}>
      <View style={styles.dialog}>
        <Text variant="body.l" align="center" style={styles.dialogText}>
          {title}
        </Text>
        <Text variant="meta" align="center" style={[styles.dialogText, styles.body]}>
          {body}
        </Text>
        <View style={styles.buttons}>
          {buttons.map((label, i) => {
            const isTarget = i === target;
            return (
              <View key={label} style={[styles.button, isTarget && styles.buttonTarget]}>
                {isTarget ? <PulseRing cornerRadius={C.dialogButton / 2} /> : null}
                <Text variant="body.l" tone={isTarget ? 'onAccent' : 'iosLink'}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      {/* Mirrors the button row so the pointer sits centred under the target. */}
      <View style={styles.pointerRow}>
        {buttons.map((label, i) => (
          <View key={label} style={styles.pointerCell}>
            {i === target ? <CoachPointer label={coach} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: C.frameHeight,
    ...rounded(radius.l),
    backgroundColor: color.bg.surface,
    borderWidth: C.frameBorder,
    borderStyle: 'dashed',
    borderColor: color.border.subtle,
    paddingTop: C.dialogTop,
    paddingHorizontal: C.dialogInsetX,
  },
  dialog: {
    ...rounded(radius.l),
    backgroundColor: color.ios.dialog,
    paddingTop: C.dialogPaddingTop,
    paddingHorizontal: C.dialogPadding,
    paddingBottom: C.dialogPadding,
  },
  dialogText: { paddingHorizontal: C.dialogTextX },
  body: { marginTop: C.dialogBodyTop, color: color.ios.dialogBody },
  buttons: { flexDirection: 'row', gap: C.dialogButtonGap, marginTop: C.dialogButtonsTop },
  button: {
    flex: 1,
    height: C.dialogButton,
    ...pill(C.dialogButton),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTarget: { backgroundColor: color.accent.primary },
  pointerRow: {
    flexDirection: 'row',
    gap: C.dialogButtonGap,
    paddingHorizontal: C.dialogPadding,
    marginTop: C.pointerTop,
    minHeight: size.hitTarget,
  },
  pointerCell: { flex: 1, alignItems: 'center' },
});
