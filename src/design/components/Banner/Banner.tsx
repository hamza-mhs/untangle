import { StyleSheet, View } from 'react-native';

import { color, radius, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type BannerProps = {
  title: string;
  body?: string;
  /** "Fix it" — the whole banner is tappable when set. */
  actionLabel?: string;
  onPress?: () => void;
  /** `warning` = amber ("Blocking might stop"), `danger` = red ("Blocking is off"). */
  tone?: 'warning' | 'danger';
  testID?: string;
};

const TONE = {
  warning: {
    icon: color.signal.warning,
    text: color.signal.warningText,
    bg: color.signal.warningSoft,
    line: color.signal.warningLine,
  },
  danger: {
    icon: color.signal.danger,
    text: color.signal.dangerText,
    bg: color.signal.dangerSoft,
    line: color.signal.dangerSoft,
  },
} as const;

/** Warning banner ("Blocking might stop · Fix it"), prototype `.warnc`. */
export function Banner({ title, body, actionLabel, onPress, tone = 'warning', testID }: BannerProps) {
  const c = TONE[tone];
  const content = (
    <>
      <Icon name="warning" size={size.bannerIcon} color={c.icon} />
      <View style={styles.text}>
        <Text variant="bodyStrong" style={{ color: c.text }}>
          {title}
        </Text>
        {body ? (
          <Text variant="caption" style={[styles.body, { color: c.text }]}>
            {body}
          </Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Text variant="bodyStrong" style={{ color: c.text }}>
          {actionLabel}
        </Text>
      ) : null}
    </>
  );
  const box = [styles.box, { backgroundColor: c.bg, borderColor: c.line }];
  if (!onPress) {
    return (
      <View testID={testID} style={box} accessible accessibilityRole="alert">
        {content}
      </View>
    );
  }
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[title, body, actionLabel].filter(Boolean).join('. ')}
      onPress={onPress}
      style={box}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: 14,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: size.touch,
  },
  text: { flex: 1, gap: 2 },
  body: { opacity: 0.85 },
});
