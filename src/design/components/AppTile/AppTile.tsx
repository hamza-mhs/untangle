import { Image, StyleSheet, View } from 'react-native';

import { color, layout, rounded, size, space } from '../../tokens';
import { Text } from '../Text';

export type AppTileSize = keyof typeof size.appTile;

/**
 * One app. iOS can't hand us icons or names (the Screen Time picker is opaque), so a real tile
 * there is a native `Label(token)` view (Phase 5). Until then, and for placeholders, this draws
 * the designs' initials tile. Android passes the PackageManager icon as `iconUri`.
 */
export type AppTileApp = { id: string; initials: string; iconUri?: string; name?: string };

export type AppTileProps = {
  app: AppTileApp;
  size: AppTileSize;
  /** 2 pt ring in the card colour, for overlapping stacks. */
  isStacked?: boolean;
};

export function AppTile({ app, size: tileSize, isStacked = false }: AppTileProps) {
  const spec = size.appTile[tileSize];
  const box = { width: spec.size, height: spec.size, ...rounded(spec.radius) };
  return (
    <View
      style={[isStacked && styles.ring, isStacked && rounded(spec.radius + size.tileRing)]}
      accessible={!!app.name}
      accessibilityLabel={app.name}>
      {app.iconUri ? (
        <Image
          source={{ uri: app.iconUri }}
          style={{ width: spec.size, height: spec.size, borderRadius: spec.radius }}
        />
      ) : (
        <View style={[styles.tile, box]}>
          <Text variant="caption.strong" style={{ fontSize: spec.font }} maxFontSizeMultiplier={1}>
            {app.initials}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Up to `max` overlapping tiles, then "+n". */
export function AppTileStack({
  apps,
  total,
  max = 3,
  size: tileSize = 's',
}: {
  apps: readonly AppTileApp[];
  total?: number;
  max?: number;
  size?: AppTileSize;
}) {
  const shown = apps.slice(0, max);
  const extra = (total ?? apps.length) - shown.length;
  return (
    <View style={styles.stack}>
      {shown.map((app, i) => (
        <View key={app.id} style={i > 0 && styles.overlap}>
          <AppTile app={app} size={tileSize} isStacked />
        </View>
      ))}
      {extra > 0 ? (
        <View style={styles.overlap}>
          <AppTile app={{ id: 'more', initials: `+${extra}` }} size={tileSize} isStacked />
        </View>
      ) : null}
    </View>
  );
}

/** Tiles in a row with a gap (rule cards, focus screens). */
export function AppTileRow({
  apps,
  total,
  max = 3,
  size: tileSize = 'xs',
}: {
  apps: readonly AppTileApp[];
  total?: number;
  max?: number;
  size?: AppTileSize;
}) {
  const shown = apps.slice(0, max);
  const extra = (total ?? apps.length) - shown.length;
  return (
    <View style={styles.row}>
      {shown.map((app) => (
        <AppTile key={app.id} app={app} size={tileSize} />
      ))}
      {extra > 0 ? <AppTile app={{ id: 'more', initials: `+${extra}` }} size={tileSize} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: color.bg.raisedHigh,
    borderWidth: size.hairline,
    borderColor: color.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { borderWidth: size.tileRing, borderColor: color.bg.raised },
  stack: { flexDirection: 'row', alignItems: 'center' },
  overlap: { marginLeft: layout.home.tileOverlap },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
