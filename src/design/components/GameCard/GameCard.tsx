import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';

import type { IconName } from '../../icons';
import { color, layout, radius, size, space } from '../../tokens';
import { GameIcon } from '../GameIcon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type GameCardProps = {
  name: string;
  /** "Timing · 40 sec". */
  meta: string;
  gameColor: string;
  glyph?: IconName;
  isNew?: boolean;
  /** Free tier: shows the Pro tag. */
  isLocked?: boolean;
  onPress: () => void;
  testID?: string;
};

/** Games tab grid card: badge icon, NEW / Pro tag, name, focus area · duration. */
export function GameCard({
  name,
  meta,
  gameColor,
  glyph,
  isNew = false,
  isLocked = false,
  onPress,
  testID,
}: GameCardProps) {
  const t = useT();
  const tag = isLocked ? t('common.pro') : isNew ? t('common.new') : null;
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[name, meta, tag].filter(Boolean).join(', ')}
      onPress={onPress}
      style={styles.card}>
      <View style={styles.top}>
        <GameIcon color={gameColor} {...(glyph ? { glyph } : {})} size={size.appIcon.md} />
        {tag ? (
          <View style={[styles.tag, isLocked ? styles.pro : null]}>
            <Text variant="caption" tone={isLocked ? 'violet' : 'secondary'}>
              {tag}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="bodyLg" numberOfLines={1}>
        {name}
      </Text>
      <Text variant="caption" tone="secondary" numberOfLines={1}>
        {meta}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: color.surface.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.surface.line,
    padding: layout.cardPadding - 2,
    gap: 2,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.sm },
  tag: {
    height: space.xl + 2,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface.control,
    justifyContent: 'center',
  },
  pro: { backgroundColor: color.brand.violetSoft },
});
