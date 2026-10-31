import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { ToyKey, useRoundLoop, Well } from '../../kit';
import type { ContentPack } from '../../kit/content';
import { pickRoundItems } from '../../kit/roundContent';
import { keyWidthFor, LetterKeys, type KeyState } from '../../kit/WordTiles';
import pack from './content.json';
import {
  forgePoints,
  forgeStars,
  judgeWord,
  FORGE_MIN,
  FORGE_RACK,
  FORGE_SECONDS,
  type Rack,
} from './logic';

const POLL_MS = 50;
const PACK = pack as ContentPack<Rack>;
const TINT = color.game.orange;

export default function LetterForgeRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  // One rack per round; its `words` list is the whole dictionary for the round.
  const [rack] = useState(() => pickRoundItems('letterForge', PACK, seed, 1)[0]!);
  const letters = [...rack.letters];
  /** Rack indices in the order they were placed in the tray. */
  const [tray, setTray] = useState<number[]>([]);
  const [found, setFound] = useState<{ word: string; pts: number }[]>([]);
  const trayRef = useRef<number[]>([]);
  const foundRef = useRef<string[]>([]);
  const longest = useRef(0);
  const open = useRef(false);
  const trayBox = useRef({ x: W / 2, y: api.board.height / 2 });

  const keyW = keyWidthFor(W, FORGE_RACK);
  const keyH = Math.max(size.touch, Math.round(keyW * 1.3));
  const tileW = Math.round(keyW * 0.78);

  const place = (next: number[]) => {
    trayRef.current = next;
    setTray(next);
  };

  useRoundLoop(api, async () => {
    const timer = api.timer(FORGE_SECONDS);
    api.setRound(t('games.letterForge.rack', { letters: rack.letters.toUpperCase() }));
    api.hint(t('games.letterForge.hint'));
    open.current = true;
    while (!timer.done() && foundRef.current.length < rack.words.length) await api.wait(POLL_MS);
    open.current = false;
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    else api.fx.toast(t('games.letterForge.allFound'), color.signal.successText);
    await api.wait(700);
    const words = foundRef.current.length;
    const best = longest.current;
    const longLabel = t('games.letterForge.statLongest', { n: best });
    api.finish({
      title: t(words ? 'games.letterForge.title' : 'games.letterForge.titleNone'),
      stars: forgeStars(best, words),
      stats: [t('games.letterForge.statWords', { count: words }), longLabel],
      best: { value: best, label: longLabel },
      items: [rack.id],
    });
  });

  const tapKey = (i: number) => {
    if (!open.current || trayRef.current.includes(i)) return;
    api.haptic('tap');
    api.sound('tap');
    place([...trayRef.current, i]);
  };

  /** Tapping a tray tile sends it back to the rack. */
  const tapTile = (k: number) => {
    if (!open.current) return;
    api.haptic('tap');
    api.sound('tap');
    place(trayRef.current.filter((_, j) => j !== k));
  };

  const forge = () => {
    if (!open.current) return;
    api.haptic('tap');
    api.sound('tap');
    const word = trayRef.current.map((i) => letters[i]!).join('');
    const verdict = judgeWord(word, rack, foundRef.current);
    if (verdict !== 'ok') {
      api.fx.oops();
      api.hint(
        t(
          verdict === 'short'
            ? 'games.letterForge.tooShort'
            : verdict === 'repeat'
              ? 'games.letterForge.already'
              : 'games.letterForge.notWord',
          { n: FORGE_MIN },
        ),
        'bad',
      );
      // A too-short word stays so it can be finished; anything else is cleared.
      if (verdict !== 'short') place([]);
      return;
    }
    const pts = forgePoints(word);
    foundRef.current = [...foundRef.current, word];
    longest.current = Math.max(longest.current, word.length);
    setFound((f) => [...f, { word, pts }]);
    api.addScore(pts);
    api.fx.hit(trayBox.current.x, trayBox.current.y, TINT, pts);
    api.hint(
      t(word.length >= 6 ? 'games.letterForge.longOne' : 'games.letterForge.forged'),
      'good',
    );
    place([]);
  };

  const states: KeyState[] = letters.map((_, i) => (tray.includes(i) ? 'used' : 'idle'));
  const trayWord = tray.map((i) => letters[i]!.toUpperCase()).join('');

  return (
    <View style={styles.fill}>
      <View
        style={styles.found}
        accessible={found.length > 0}
        accessibilityLabel={t('games.letterForge.a11yFound', {
          words: found.map((f) => f.word).join(', '),
        })}>
        {found.map((f) => (
          <Animated.View
            key={f.word}
            style={styles.chip}
            {...(api.reducedMotion ? {} : { entering: ZoomIn.duration(300) })}>
            <Text variant="caption" tone="warning">
              {t('games.letterForge.wordPts', { word: f.word.toUpperCase(), pts: f.pts })}
            </Text>
          </Animated.View>
        ))}
      </View>
      <View
        onLayout={(e) => {
          const { x, y, width, height } = e.nativeEvent.layout;
          trayBox.current = { x: x + width / 2, y: y + height / 2 };
        }}>
        <Well
          style={[styles.tray, { minHeight: keyH + space.xl }]}
          accessibilityLabel={
            trayWord
              ? t('games.letterForge.a11yTray', { word: trayWord })
              : t('games.letterForge.a11yTrayEmpty')
          }>
          <View pointerEvents="none" style={styles.warm} />
          <View style={styles.tiles}>
            {tray.map((i, k) => (
              <Animated.View
                key={i}
                {...(api.reducedMotion ? {} : { entering: ZoomIn.duration(220) })}>
                <ToyKey
                  testID={`game.letterForge.tray${k}`}
                  tint={TINT}
                  accessibilityLabel={t('games.letterForge.a11yRemove', {
                    letter: letters[i]!.toUpperCase(),
                  })}
                  onPress={() => tapTile(k)}
                  style={[styles.tile, { width: tileW, height: keyH * 0.82 }]}>
                  <Text variant="bodyLg">{letters[i]!.toUpperCase()}</Text>
                </ToyKey>
              </Animated.View>
            ))}
          </View>
        </Well>
      </View>
      <LetterKeys
        letters={letters}
        tint={TINT}
        states={states}
        onPress={tapKey}
        perRow={FORGE_RACK}
        keyWidth={keyW}
        keyHeight={keyH}
        testIDPrefix="game.letterForge.key"
        style={styles.rack}
      />
      <View style={styles.spacer} />
      <ToyKey
        testID="game.letterForge.forge"
        tint={color.game.mint}
        accessibilityLabel={t('games.letterForge.forge')}
        onPress={forge}
        style={styles.forge}>
        <Text variant="button" tone="onLight">
          {t('games.letterForge.forge')}
        </Text>
      </ToyKey>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingTop: space.sm, paddingBottom: space.xs },
  found: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    justifyContent: 'center',
    gap: space.sm,
    overflow: 'hidden',
  },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    backgroundColor: color.surface.raised,
  },
  tray: { justifyContent: 'center', paddingHorizontal: space.sm },
  warm: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: TINT,
    opacity: 0.06,
  },
  tiles: { flexDirection: 'row', justifyContent: 'center', gap: space.xs },
  tile: { borderRadius: radius.md },
  rack: { marginTop: space['2xl'] },
  spacer: { flex: 1 },
  forge: { height: size.button.lg, borderRadius: radius.xl },
});
