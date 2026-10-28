import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ghost, Icon, PressableScale, PrimaryButton, StarField, Text } from '@/design/components';
import { color, layout, radius, rounded, size, space } from '@/design/tokens';
import { SCENE_WIDTH, stars } from '@/features/onboarding/components/splash/sceneData';
import { useT } from '@/i18n';
import { formatLongDate } from '@/lib/format';
import { useEntitlementStore } from '@/services/purchases';

const S = layout.screen;
const STARS_OPACITY = 0.6;

const UNLOCKED = [
  { id: 'locked', icon: 'lock', tone: 'accent', href: '/block' },
  { id: 'program', icon: 'sparkles', tone: 'sky', href: '/challenges' },
  { id: 'themes', icon: 'palette', tone: 'pink', href: '/settings' },
] as const;

/** P05 · "You're Pro." Plan, renewal and price, the now-unlocked list with direct actions. */
export default function ProSuccess() {
  const t = useT();
  const { width } = useWindowDimensions();
  const { plan } = useLocalSearchParams<{ plan?: string }>();
  const entitlement = useEntitlementStore((s) => s.entitlement);
  const [planId] = useState(() =>
    plan === 'monthly' || plan === 'lifetime' ? plan : (entitlement.plan ?? 'yearly'),
  );
  const renewLine =
    planId === 'lifetime' || entitlement.expiresAt === null
      ? t('pro.success.lifetime')
      : t('pro.success.renews', {
          plan: t(`paywall.plans.${planId}.name`),
          date: formatLongDate(entitlement.expiresAt),
        });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.stars} pointerEvents="none">
        <StarField
          stars={stars}
          tileWidth={SCENE_WIDTH}
          height={layout.splash.starsHeight}
          width={width}
          opacity={STARS_OPACITY}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.ghost}>
          <Ghost mood={1} width={size.ghost.done} />
        </View>
        <Text variant="title.l" accessibilityRole="header" style={styles.title}>
          {t('pro.success.title')}
        </Text>
        <Text variant="body" tone="secondary" style={styles.body}>
          {renewLine} {t('pro.success.thanks')}
        </Text>
        <Text variant="label" tone="muted" style={styles.label}>
          {t('pro.success.unlocked')}
        </Text>
        <View style={styles.group}>
          {UNLOCKED.map((u, i) => (
            <PressableScale
              key={u.id}
              accessibilityRole="button"
              accessibilityLabel={`${t(`pro.success.items.${u.id}.title`)}, ${t(`pro.success.items.${u.id}.sub`)}`}
              onPress={() => router.replace(u.href)}
              style={[styles.row, i > 0 && styles.separator]}>
              <View style={[styles.tile, tileTones[u.tone]]}>
                <Icon name={u.icon} size={size.icon.xs} color={color.text.onAccent} />
              </View>
              <View style={styles.flex}>
                <Text variant="body">{t(`pro.success.items.${u.id}.title`)}</Text>
                <Text variant="caption" tone="muted">
                  {t(`pro.success.items.${u.id}.sub`)}
                </Text>
              </View>
              <Text variant="label.strong" tone={u.tone}>
                {t(`pro.success.items.${u.id}.action`)}
              </Text>
            </PressableScale>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          testID="pro.success.back"
          label={t('focus.done.back')}
          compact
          onPress={() => router.replace('/today')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  stars: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { flex: 1, paddingHorizontal: S.x },
  ghost: { alignItems: 'center', marginTop: space.huge * 2 },
  title: { marginTop: space.xxl, paddingHorizontal: S.titleX - S.x },
  body: { marginTop: space.sm, paddingHorizontal: S.titleX - S.x },
  label: { marginTop: space.xxl, marginBottom: space.sm, paddingHorizontal: S.labelX - S.x },
  group: { ...rounded(radius.m), backgroundColor: color.bg.raised, overflow: 'hidden' },
  row: {
    height: size.suggestionRow,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  separator: { borderTopWidth: size.hairline, borderTopColor: color.border.hairline },
  tile: {
    width: size.iconTile,
    height: size.iconTile,
    ...rounded(size.appTile.m.radius),
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  footer: { paddingHorizontal: S.x, paddingBottom: layout.onboarding.footerBottom },
});

const tileTones = StyleSheet.create({
  accent: { backgroundColor: color.accent.primary },
  sky: { backgroundColor: color.mood.sky },
  pink: { backgroundColor: color.mood.pink },
});
