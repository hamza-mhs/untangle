import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import { color, layout, pill, radius, rounded, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type ChallengeStatus = 'done' | 'next' | 'todo';

export type ChallengeItem = {
  id: string;
  title: string;
  meta: string;
  status: ChallengeStatus;
  points: number;
};

export type ChallengeListProps = {
  items: readonly ChallengeItem[];
  doneCount: number;
  onStart: (id: string) => void;
  testID?: string;
};

/**
 * "Today's challenges · n of 3" (SPEC §3). Status ring per row: done (filled, ✓, struck
 * through), next (accent ring + "Start"), todo (grey ring + "+pts").
 */
export function ChallengeList({ items, doneCount, onStart, testID }: ChallengeListProps) {
  const t = useT();
  return (
    <View testID={testID}>
      <View style={styles.header}>
        <Text variant="meta" tone="muted">
          {t('home.challenges.title')}
        </Text>
        <Text variant="meta" tone="muted">
          {t('home.challenges.count', { done: doneCount, total: items.length })}
        </Text>
      </View>
      <View style={styles.group}>
        {items.map((item, i) => (
          <ChallengeRow key={item.id} item={item} isFirst={i === 0} onStart={onStart} />
        ))}
      </View>
    </View>
  );
}

const ChallengeRow = memo(function ChallengeRow({
  item,
  isFirst,
  onStart,
}: {
  item: ChallengeItem;
  isFirst: boolean;
  onStart: (id: string) => void;
}) {
  const t = useT();
  const isDone = item.status === 'done';
  const label = isDone
    ? t('home.challenges.doneA11y', { title: item.title })
    : `${item.title}, ${item.meta}`;
  return (
    <View
      style={[styles.row, !isFirst && styles.separator]}
      accessible={item.status !== 'next'}
      accessibilityLabel={label}>
      <View style={[styles.ring, ringStyles[item.status]]}>
        {isDone ? <Icon name="check" size={size.icon.xs - 4} color={color.text.muted} /> : null}
      </View>
      <View style={styles.texts}>
        <Text
          variant="body"
          tone={isDone ? 'muted' : 'primary'}
          numberOfLines={1}
          style={isDone && styles.struck}>
          {item.title}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {item.meta}
        </Text>
      </View>
      {item.status === 'done' ? (
        <Icon name="check" size={size.icon.xs - 2} color={color.text.muted} strokeWidth={2} />
      ) : item.status === 'next' ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('home.challenges.startA11y', { title: item.title })}
          hitSlop={(size.hitTarget - size.startPill) / 2}
          onPress={() => {
            haptics.tap();
            onStart(item.id);
          }}
          style={styles.start}>
          <Text variant="meta.strong" tone="onAccent">
            {t('common.start')}
          </Text>
        </PressableScale>
      ) : (
        <Text variant="meta" tone="muted">
          {t('home.challenges.points', { points: item.points })}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: layout.home.labelX - layout.home.x,
    marginBottom: layout.home.sectionLabelGap,
  },
  group: { ...rounded(radius.m), backgroundColor: color.bg.raised, overflow: 'hidden' },
  row: {
    height: size.challengeRow,
    paddingHorizontal: layout.home.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  separator: { borderTopWidth: size.hairline, borderTopColor: color.border.hairline },
  ring: {
    width: size.statusRing,
    height: size.statusRing,
    ...pill(size.statusRing),
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  struck: { textDecorationLine: 'line-through' },
  start: {
    height: size.startPill,
    ...pill(size.startPill),
    paddingHorizontal: space.md + 1,
    justifyContent: 'center',
    backgroundColor: color.accent.primary,
  },
});

const ringStyles = StyleSheet.create({
  done: { backgroundColor: color.border.control },
  next: { borderWidth: size.selectedRing, borderColor: color.accent.primary },
  todo: { borderWidth: size.selectedRing, borderColor: color.border.strong },
});
