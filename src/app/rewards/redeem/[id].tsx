import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ghost, Icon, PressableScale, PrimaryButton, StarField, Text } from '@/design/components';
import { color, layout, pill, radius, rounded, size, space } from '@/design/tokens';
import { SCENE_WIDTH, stars } from '@/features/onboarding/components/splash/sceneData';
import { UNDO_MS, useVaultStore } from '@/features/rewards/vault';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { ledgerTotals, setRedemptionPhoto } from '@/storage/ledgerRepo';

const STARS_OPACITY = 0.6;

/**
 * FRedeem · the points came off on the Redeem tap (logged as a redemption), with a 5-second
 * Undo for a mistaken tap. An optional photo goes through the system photo picker (no library
 * permission) and is copied into the app's own storage; nothing is uploaded.
 */
export default function Redeem() {
  const t = useT();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useVaultStore((s) => s.items.find((i) => i.id === id));
  const [verified] = useState(() => ledgerTotals().verifiedPercent);
  // Redeemed by the Redeem tap (FRewards) so a re-render can never deduct twice.
  const redemption = useVaultStore((s) => (s.last?.itemId === id ? s.last : null));
  const [undoLeft, setUndoLeft] = useState(UNDO_MS);
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!redemption) return;
    haptics.success();
    const started = Date.now();
    const tick = setInterval(() => {
      const left = UNDO_MS - (Date.now() - started);
      setUndoLeft(Math.max(0, left));
      if (left <= 0) clearInterval(tick);
    }, 250);
    return () => clearInterval(tick);
  }, [redemption]);

  if (!item || !redemption) return <Redirect href="/rewards" />;

  const undo = () => {
    haptics.tap();
    router.back();
    useVaultStore.getState().undo(redemption);
  };

  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const source = new File(result.assets[0].uri);
      const dest = new File(Paths.document, `redemption-${redemption.id}.jpg`);
      if (dest.exists) dest.delete();
      source.copy(dest);
      setRedemptionPhoto(redemption.id, dest.uri);
      setPhoto(dest.uri);
    } catch {
      // Keep the picker's own copy for this session; the redemption itself is already saved.
      setPhoto(result.assets[0].uri);
    }
  };

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
          <Ghost mood={1} width={size.watchTile * 0.52} />
          <Text variant="mono.label" tone="muted">
            {t('rewards.redeem.stamp')}
          </Text>
        </View>
        <Text variant="title.xl" align="center" accessibilityRole="header">
          {t('rewards.redeem.title', { name: item.name })}
        </Text>
        <Text variant="body.xl.regular" tone="secondary" align="center" style={styles.sub}>
          {verified !== null
            ? t('rewards.redeem.body', { points: item.cost.toLocaleString(), percent: verified })
            : t('rewards.redeem.bodyNoVerified', { points: item.cost.toLocaleString() })}
        </Text>
        <PressableScale
          testID="rewards.redeem.photo"
          accessibilityRole="button"
          accessibilityLabel={t('rewards.redeem.photo')}
          onPress={() => void addPhoto()}
          style={styles.photoCard}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={styles.photo}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <>
              <View style={styles.plus}>
                <Icon name="plus" size={size.icon.lg} color={color.accent.primary} />
              </View>
              <Text variant="body.l.strong">{t('rewards.redeem.photo')}</Text>
              <Text variant="body" tone="muted">
                {t('rewards.redeem.photoSub')}
              </Text>
            </>
          )}
        </PressableScale>
      </View>
      <View style={styles.footer}>
        {undoLeft > 0 ? (
          <View style={styles.undo} accessibilityLiveRegion="polite">
            <Text variant="body.strong" style={styles.flex}>
              {t('rewards.redeem.undoLine', { points: item.cost.toLocaleString() })}
            </Text>
            <PressableScale
              testID="rewards.redeem.undo"
              accessibilityRole="button"
              onPress={undo}
              style={styles.undoButton}>
              <Text variant="body.strong" tone="accent">
                {t('rewards.redeem.undo', { seconds: Math.ceil(undoLeft / 1000) })}
              </Text>
            </PressableScale>
          </View>
        ) : null}
        <PrimaryButton
          testID="rewards.redeem.done"
          label={t('rewards.redeem.done')}
          onPress={() => router.back()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  stars: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { flex: 1, paddingHorizontal: layout.onboarding.optionsX },
  ghost: { alignItems: 'center', marginTop: space.xl, gap: space.xs },
  sub: { marginTop: space.md },
  photoCard: {
    marginTop: space.xxl,
    height: size.watchTile * 0.88,
    ...rounded(radius.l),
    backgroundColor: color.bg.raised,
    borderWidth: size.backButtonRing,
    borderColor: color.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  plus: {
    width: size.micButton,
    height: size.micButton,
    ...pill(size.micButton),
    backgroundColor: color.bg.raisedHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  footer: {
    paddingHorizontal: layout.onboarding.optionsX,
    paddingBottom: layout.onboarding.footerBottom,
    gap: space.md,
  },
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    height: size.toast,
    ...rounded(radius.m),
    backgroundColor: color.bg.raisedHigh,
    paddingHorizontal: space.lg,
  },
  flex: { flex: 1 },
  undoButton: { paddingVertical: space.sm, paddingLeft: space.md },
});
