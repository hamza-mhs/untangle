import { StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';

import { color, pill, radius, rounded, size, space } from '../../tokens';
import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type BannerKind = 'blockingOff' | 'grace' | 'offline' | 'trial';

export type BannerProps = {
  kind: BannerKind;
  title: string;
  sub: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

const KINDS: Record<
  BannerKind,
  { icon: IconName; iconColor: string; bg: 'danger' | 'warning' | 'neutral' | 'accent' }
> = {
  blockingOff: { icon: 'shieldOff', iconColor: color.status.dangerSoft, bg: 'danger' },
  grace: { icon: 'warning', iconColor: color.mood.orange, bg: 'warning' },
  offline: { icon: 'offline', iconColor: color.text.muted, bg: 'neutral' },
  trial: { icon: 'sparkles', iconColor: color.accent.primary, bg: 'neutral' },
};

/** 64 pt status strip under Home's top bar (SPEC §3). One at a time, by priority. */
export function Banner({ kind, title, sub, actionLabel, onAction, testID }: BannerProps) {
  const k = KINDS[kind];
  return (
    <View
      testID={testID}
      style={[styles.banner, bgStyles[k.bg]]}
      accessibilityRole="alert"
      accessible={!onAction}
      accessibilityLabel={`${title}. ${sub}`}>
      <Icon name={k.icon} size={size.icon.md} color={k.iconColor} />
      <View style={styles.texts}>
        <Text variant="label.strong" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="meta" tone="secondary" numberOfLines={1}>
          {sub}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}: ${title}`}
          hitSlop={(size.hitTarget - size.bannerButton) / 2}
          onPress={() => {
            haptics.tap();
            onAction();
          }}
          style={styles.action}>
          <Text variant="meta.strong" tone="onAccent">
            {actionLabel}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: size.banner,
    ...rounded(radius.m),
    borderWidth: size.ring,
    paddingHorizontal: space.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
  },
  texts: { flex: 1 },
  action: {
    height: size.bannerButton,
    ...pill(size.bannerButton),
    paddingHorizontal: space.md + 2,
    justifyContent: 'center',
    backgroundColor: color.accent.primary,
  },
});

const bgStyles = StyleSheet.create({
  danger: { backgroundColor: color.status.dangerSoftBg, borderColor: color.status.dangerSoftRing },
  warning: {
    backgroundColor: color.status.warningSoftBg,
    borderColor: color.status.warningSoftRing,
  },
  neutral: { backgroundColor: color.bg.raised, borderColor: color.border.hairline },
  accent: { backgroundColor: color.accent.primary, borderColor: color.accent.primary },
});
