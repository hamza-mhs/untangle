import { StyleSheet, View } from 'react-native';

import { PressableScale, Text } from '@/design/components';
import { color, pill, radius, rounded, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

/**
 * P01 · the reverse-trial card on Home, once, after OB15. "What's in Pro" opens P03 read-only,
 * "Got it" dismisses it for good.
 */
export function TrialCard({
  overline,
  title,
  body,
  onWhatsInPro,
  onDismiss,
}: {
  overline: string;
  title: string;
  body: string;
  onWhatsInPro: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  return (
    <View style={styles.card} testID="home.trialCard">
      <Text variant="micro" tone="onAccent">
        {overline}
      </Text>
      <Text variant="headline" tone="onAccent" style={styles.title}>
        {title}
      </Text>
      <Text variant="meta" tone="onAccent" style={styles.body}>
        {body}
      </Text>
      <View style={styles.actions}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('paywall.trialCard.whatsInPro')}
          hitSlop={(size.hitTarget - size.pillButton) / 2}
          onPress={() => {
            haptics.tap();
            onWhatsInPro();
          }}
          style={[styles.button, styles.primary]}>
          <Text variant="meta.strong" tone="accent">
            {t('paywall.trialCard.whatsInPro')}
          </Text>
        </PressableScale>
        <PressableScale
          testID="home.trialCard.dismiss"
          accessibilityRole="button"
          accessibilityLabel={t('paywall.trialCard.gotIt')}
          hitSlop={(size.hitTarget - size.pillButton) / 2}
          onPress={() => {
            haptics.tap();
            onDismiss();
          }}
          style={[styles.button, styles.secondary]}>
          <Text variant="meta.strong" tone="onAccent">
            {t('paywall.trialCard.gotIt')}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...rounded(radius.l),
    backgroundColor: color.accent.primary,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg + 2,
  },
  title: { marginTop: space.xs },
  body: { marginTop: space.xs },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm + 2 },
  button: {
    height: size.pillButton,
    ...pill(size.pillButton),
    paddingHorizontal: space.md + 1,
    justifyContent: 'center',
  },
  primary: { backgroundColor: color.bg.canvas },
  secondary: { backgroundColor: color.onAccent.tint },
});
