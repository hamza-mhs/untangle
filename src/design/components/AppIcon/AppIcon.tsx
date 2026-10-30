import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, iconRadius, size as sizes } from '../../tokens';
import { Text } from '../Text';
import { monogram, monogramColor } from './monogram';

export type AppIconProps = {
  /** App label, used for the monogram fallback and TalkBack. */
  label: string;
  /** file:// URI of the real icon from the native module, if available. */
  uri?: string | null;
  size?: number;
  /** Key for the fallback colour (package name); defaults to the label. */
  colorKey?: string;
  testID?: string;
};

/** Real installed-app icon, or a coloured monogram tile ("IG") when there is none. */
export function AppIcon({ label, uri, size = sizes.appIcon.md, colorKey, testID }: AppIconProps) {
  const [failed, setFailed] = useState(false);
  const tile = { width: size, height: size, borderRadius: iconRadius(size) };
  if (uri && !failed) {
    return (
      <Image
        testID={testID}
        source={{ uri }}
        style={tile}
        contentFit="cover"
        accessibilityLabel={label}
        onError={() => setFailed(true)}
      />
    );
  }
  return <Monogram label={label} keyFor={colorKey ?? label} tile={tile} testID={testID} />;
}

export function Monogram({
  label,
  keyFor,
  tile,
  testID,
}: {
  label: string;
  keyFor: string;
  tile: { width: number; height: number; borderRadius: number };
  testID?: string | undefined;
}) {
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={label}
      style={[styles.mono, tile, { backgroundColor: monogramColor(keyFor) }]}>
      <Text variant="bodyStrong" style={[styles.letters, { fontSize: tile.width * 0.36 }]} maxFontSizeMultiplier={1}>
        {monogram(label)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mono: { alignItems: 'center', justifyContent: 'center' },
  letters: { color: color.text.primary },
});
