import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, ChoiceChip, GameCard, GameIcon, Screen, Text } from '@/design/components';
import { color, FOCUS_GROUPS, layout, radius, size, space, type FocusGroup } from '@/design/tokens';
import { usePro } from '@/features/paywall';
import { useT } from '@/i18n';

import { dayKey } from '@/lib/time';

import { GAMES, isNewGame, PLAYABLE, type GameId, type GameMeta } from '../catalog';
import { useNewGamesStore } from '../newGamesStore';
import { playedToday } from '../results';
import { useTrainingStore } from '../trainingStore';

type Filter = 'all' | 'new' | FocusGroup;

/** Games tab (20-phase2-core-app §4). */
export function GamesTab() {
  const t = useT();
  const { isPro } = usePro();
  const [filter, setFilter] = useState<Filter>('all');
  const training = useTrainingStore((s) => s.ids);
  const [played, setPlayed] = useState<Set<string>>(new Set());
  const [today, setToday] = useState(() => dayKey());
  const firstSeen = useNewGamesStore((s) => s.seen);

  useFocusEffect(
    useCallback(() => {
      useTrainingStore.getState().today();
      useNewGamesStore.getState().markLatest();
      setToday(dayKey());
      try {
        setPlayed(playedToday());
      } catch {
        // No history yet.
      }
    }, []),
  );

  const isNew = (g: GameMeta) => isNewGame(g, firstSeen[g.batch], today);
  const games = PLAYABLE.filter(
    (g) => filter === 'all' || (filter === 'new' ? isNew(g) : g.group === filter),
  );
  const upNext = training.find((id) => !played.has(id));
  const open = (g: GameMeta) => {
    if (!isPro && !training.includes(g.id)) router.push('/paywall');
    else
      router.push({
        pathname: '/game/[gameId]',
        params: { gameId: g.id, source: training.includes(g.id) ? 'training' : 'browse' },
      });
  };
  const filters: Filter[] = ['all', 'new', ...FOCUS_GROUPS];

  return (
    <Screen testID="tab.games" gutter="none" scroll edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="titleLg" accessibilityRole="header">
          {t('games.tab.title')}
        </Text>
        <View style={styles.countPill}>
          <Text variant="caption" tone="secondary">
            {t('games.tab.count', { count: PLAYABLE.length })}
          </Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        {filters.map((f) => (
          <ChoiceChip
            key={f}
            testID={`games.filter.${f}`}
            label={
              f === 'all'
                ? t('games.tab.all')
                : f === 'new'
                  ? t('games.tab.new')
                  : t(`games.groups.${f}`)
            }
            selected={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </ScrollView>
      <View style={styles.pad}>
        {filter === 'all' && upNext ? (
          <Card
            testID="games.upNext"
            onPress={() =>
              router.push({
                pathname: '/game/[gameId]',
                params: { gameId: upNext as GameId, source: 'training' },
              })
            }
            accessibilityLabel={t('games.tab.upNext', { name: t(`games.list.${upNext}.name`) })}>
            <View style={styles.upNext}>
              <GameIcon
                color={color.game[GAMES.find((g) => g.id === upNext)!.accent]}
                size={size.appIcon.md}
              />
              <View style={styles.flex}>
                <Text variant="caption" tone="secondary">
                  {t('games.tab.upNextLabel')}
                </Text>
                <Text variant="bodyLg">{t(`games.list.${upNext}.name`)}</Text>
              </View>
            </View>
          </Card>
        ) : null}
        {games.length === 0 ? (
          <Text variant="body" tone="secondary">
            {filter === 'new'
              ? t('games.tab.noNew')
              : t('games.tab.comingSoon', {
                  group: filter === 'all' ? '' : t(`games.groups.${filter}`),
                })}
          </Text>
        ) : (
          <View style={styles.grid}>
            {games.map((g) => (
              <View key={g.id} style={styles.cell}>
                <GameCard
                  testID={`games.card.${g.id}`}
                  name={t(`games.list.${g.id}.name`)}
                  meta={t('games.meta', {
                    group: t(`games.groups.${g.group}`),
                    length: t(`games.list.${g.id}.length`),
                  })}
                  gameColor={color.game[g.accent]}
                  isNew={isNew(g)}
                  isLocked={!isPro && !training.includes(g.id)}
                  onPress={() => open(g)}
                />
              </View>
            ))}
          </View>
        )}
        <View style={styles.clearance} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: layout.gutterTab,
    marginTop: layout.headerTop + space.lg,
  },
  countPill: {
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    backgroundColor: color.surface.control,
  },
  filters: { gap: space.sm, paddingHorizontal: layout.gutterTab, paddingVertical: space.lg },
  pad: { paddingHorizontal: layout.gutterTab, gap: space.lg },
  upNext: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cell: { width: '47.5%' },
  clearance: { height: layout.tabBarClearance },
});
