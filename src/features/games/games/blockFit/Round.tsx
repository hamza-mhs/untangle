import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PressableScale, Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { rng } from '@/lib/rng';
import type { RoundProps } from '../../engine/types';
import { useRoundLoop } from '../../kit';
import {
  canPlace,
  emptyBoard,
  FIT_SIZE,
  fitsAnywhere,
  fitStars,
  makeTray,
  place,
  type Board,
  type Piece,
} from './logic';

const POLL_MS = 30;
export default function BlockFitRound({ api, seed }: RoundProps) {
  const t = useT();
  const rand = useRef(rng(seed));
  const [board, setBoard] = useState<Board>(() => emptyBoard());
  const [tray, setTray] = useState<(Piece | null)[]>(() => makeTray(rand.current, emptyBoard()));
  const [sel, setSel] = useState<number | null>(null);
  const stats = useRef({ lines: 0, misfits: 0, stuck: false });
  const cell = Math.floor(Math.min(api.board.width, api.board.height * 0.62) / FIT_SIZE);
  const boardPx = cell * FIT_SIZE;

  useRoundLoop(api, async () => {
    const timer = api.timer(45);
    api.combo(0);
    api.hint(t('games.blockFit.hint'));
    while (!timer.done() && !stats.current.stuck) await api.wait(POLL_MS * 3);
    if (stats.current.stuck) api.fx.toast(t('games.blockFit.noRoom'), color.signal.warning);
    else api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(800);
    const { lines, misfits } = stats.current;
    api.finish({
      title: lines ? t('games.blockFit.titleClean') : t('games.blockFit.titleTry'),
      stars: fitStars(lines, misfits),
      score: lines * 25,
      stats: [
        t('games.blockFit.statLines', { count: lines }),
        t('games.blockFit.statMisfits', { count: misfits }),
      ],
      best: { value: lines, label: t('games.blockFit.statLines', { count: lines }) },
    });
  });

  const tapCell = (r: number, c: number) => {
    if (sel === null) return;
    const p = tray[sel];
    if (!p) return;
    if (!canPlace(board, p, r, c)) {
      stats.current.misfits++;
      api.fx.oops();
      api.hint(t('games.blockFit.misfit'), 'bad');
      return;
    }
    api.haptic('tap');
    api.sound('tap');
    const res = place(board, p, r, c);
    let nextTray = tray.map((x, i) => (i === sel ? null : x));
    if (nextTray.every((x) => x === null)) nextTray = makeTray(rand.current, res.board);
    setBoard(res.board);
    setTray(nextTray);
    setSel(null);
    if (res.lines) {
      stats.current.lines += res.lines;
      api.addScore(res.lines * 25);
      api.combo(stats.current.lines);
      api.fx.hit(
        (c + 0.5) * cell + (api.board.width - boardPx) / 2,
        (r + 0.5) * cell,
        color.game.sky,
        res.lines * 25,
      );
      api.hint(t('games.blockFit.cleared', { count: res.lines }), 'good');
    } else {
      api.addScore(p.cells.length);
    }
    if (!nextTray.some((x) => x && fitsAnywhere(res.board, x))) stats.current.stuck = true;
  };

  const preview = sel !== null ? tray[sel] : null;
  return (
    <View style={[styles.fill, styles.fitRoot]}>
      <View style={[styles.fitBoard, { width: boardPx, height: boardPx }]}>
        {board.map((row, r) =>
          row.map((on, c) => (
            <Pressable
              key={`${r}-${c}`}
              testID={`game.blockFit.cell.${r}.${c}`}
              accessibilityLabel={t('games.blockFit.cell', { r: r + 1, c: c + 1 })}
              onPress={() => tapCell(r, c)}
              style={[
                styles.fitCell,
                { width: cell, height: cell, left: c * cell, top: r * cell },
                on ? styles.fitOn : null,
              ]}
            />
          )),
        )}
      </View>
      <View style={styles.tray}>
        {tray.map((p, i) => (
          <PressableScale
            key={i}
            testID={`game.blockFit.piece.${i}`}
            accessibilityRole="button"
            accessibilityState={{ selected: sel === i, disabled: !p }}
            accessibilityLabel={
              p ? t('games.blockFit.piece', { n: p.cells.length }) : t('games.blockFit.used')
            }
            disabled={!p}
            onPress={() => {
              api.haptic('tap');
              api.sound('tap');
              setSel(sel === i ? null : i);
            }}
            style={[styles.trayBox, sel === i ? styles.traySel : null]}>
            {p ? (
              <PieceView
                piece={p}
                cell={TRAY_CELL}
                tint={sel === i ? color.game.sun : color.game.sky}
              />
            ) : null}
          </PressableScale>
        ))}
      </View>
      <Text variant="caption" tone="secondary" align="center">
        {preview ? t('games.blockFit.placeHint') : t('games.blockFit.pickHint')}
      </Text>
    </View>
  );
}

const TRAY_CELL = 16;

function PieceView({ piece, cell, tint }: { piece: Piece; cell: number; tint: string }) {
  const rows = Math.max(...piece.cells.map(([r]) => r)) + 1;
  const cols = Math.max(...piece.cells.map(([, c]) => c)) + 1;
  return (
    <View style={{ width: cols * cell, height: rows * cell }}>
      {piece.cells.map(([r, c]) => (
        <View
          key={`${r}${c}`}
          style={[
            styles.pieceCell,
            {
              width: cell - 2,
              height: cell - 2,
              left: c * cell,
              top: r * cell,
              backgroundColor: tint,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  fitRoot: { alignItems: 'center', gap: space.lg },
  fitBoard: { borderRadius: radius.md, backgroundColor: color.surface.card },
  fitCell: { position: 'absolute', borderWidth: size.hairline, borderColor: color.surface.line },
  fitOn: { backgroundColor: color.game.sky, borderColor: color.bg.ink },
  tray: { flexDirection: 'row', gap: space.md },
  trayBox: {
    width: size.touch * 2,
    height: size.touch * 2,
    borderRadius: radius.lg,
    backgroundColor: color.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traySel: { borderWidth: 2, borderColor: color.game.sun },
  pieceCell: { position: 'absolute', borderRadius: 3 },
});
