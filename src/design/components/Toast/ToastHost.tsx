import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '@/lib/toast';

import { layout, space } from '../../tokens';
import { Toast } from './Toast';

/** Root-level host for the single app-wide toast (top of the screen, above everything). */
export function ToastHost() {
  const toast = useToastStore((s) => s.toast);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + space.sm }]}>
      <Toast
        key={toast.id}
        testID="toast"
        title={toast.title}
        {...(toast.sub ? { sub: toast.sub } : {})}
        tone={toast.tone}
        onDismiss={hide}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: layout.gutterTab, right: layout.gutterTab },
});
