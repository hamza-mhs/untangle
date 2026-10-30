import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';

import { color, elevation, radius, size, space } from '../../tokens';
import { Text } from '../Text';

export type SheetProps = {
  visible: boolean;
  /** Called on scrim tap and system Back, unless `dismissible` is false. */
  onClose: () => void;
  title: string;
  body?: string;
  children?: ReactNode;
  /** Buttons, primary first. */
  actions?: ReactNode;
  /**
   * False = an explicit choice is required (the accessibility disclosure): tapping outside
   * and system Back do nothing.
   */
  dismissible?: boolean;
  testID?: string;
};

/** Bottom sheet with grabber, title, body and actions (prototype `.sheet`). */
export function Sheet({
  visible,
  onClose,
  title,
  body,
  children,
  actions,
  dismissible = true,
  testID,
}: SheetProps) {
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismissible ? onClose : () => {}}>
      <View style={styles.root}>
        <Pressable
          style={styles.scrim}
          accessibilityRole={dismissible ? 'button' : undefined}
          accessibilityLabel={dismissible ? t('common.close') : undefined}
          importantForAccessibility={dismissible ? 'yes' : 'no-hide-descendants'}
          onPress={dismissible ? onClose : undefined}
        />
        <View
          testID={testID}
          accessibilityViewIsModal
          style={[styles.sheet, { marginBottom: space.sm + insets.bottom }]}>
          <View style={styles.grab} />
          <Text variant="heading" accessibilityRole="header">
            {title}
          </Text>
          {body ? (
            <Text variant="body" tone="body" style={styles.body}>
              {body}
            </Text>
          ) : null}
          {children}
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: color.overlay.scrim },
  sheet: {
    marginHorizontal: space.sm,
    backgroundColor: color.surface.raised,
    borderRadius: radius['4xl'],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.surface.line,
    paddingTop: 10,
    paddingHorizontal: space.xl,
    paddingBottom: space['2xl'],
    ...elevation.sheet,
  },
  grab: {
    width: size.sheetGrabber.width,
    height: size.sheetGrabber.height,
    borderRadius: radius.pill,
    backgroundColor: color.surface.ring,
    alignSelf: 'center',
    marginBottom: 14,
  },
  body: { marginTop: space.sm },
  actions: { marginTop: space.xl, gap: space.sm },
});
