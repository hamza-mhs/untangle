import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, Text } from '@/design/components';
import { color, layout, pill, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import { GUIDES } from '@/features/settings/guides';

const STEPS = [1, 2, 3, 4] as const;

/** FSettings › Guides: static how-to pages (grayscale, notification audit, phone-free zones). */
export default function Guide() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const guide = GUIDES.find((g) => g === id);
  if (!guide) return <Redirect href="/settings" />;
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="chevronLeft"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title.l" accessibilityRole="header">
          {t(`settings.guides.${guide}.title`)}
        </Text>
        <Text variant="body.lead" tone="secondary" style={styles.intro}>
          {t(`settings.guides.${guide}.intro`)}
        </Text>
        {STEPS.map((n) => (
          <View key={n} style={styles.step}>
            <View style={styles.num}>
              <Text variant="body.l.strong">{n}</Text>
            </View>
            <Text variant="body.lead" style={styles.flex}>
              {t(`settings.guides.${guide}.step${n}`)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  header: { paddingHorizontal: layout.screen.x, paddingTop: layout.screen.top },
  content: { paddingHorizontal: layout.screen.titleX, paddingBottom: space.huge },
  intro: { marginTop: space.md, marginBottom: space.lg },
  step: { flexDirection: 'row', gap: space.md, marginTop: space.lg, alignItems: 'flex-start' },
  num: {
    width: size.backButton,
    height: size.backButton,
    ...pill(size.backButton),
    backgroundColor: color.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
