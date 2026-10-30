import { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { fontFamily } from '../tokens';
import { ArtFrame, type ArtProps } from './Art';
import { art } from './palette';

/** A toy tile: colour face, darker lip, soft top highlight (prototype `.tb`). */
function Tile({ x, y, s, c, dim = false }: { x: number; y: number; s: number; c: string; dim?: boolean }) {
  const lip = Math.max(2, s * 0.08);
  return (
    <G opacity={dim ? 0.45 : 1}>
      <Rect x={x} y={y + lip} width={s} height={s} rx={s * 0.28} fill={c} />
      <Rect x={x} y={y + lip} width={s} height={s} rx={s * 0.28} fill={art.black} opacity={0.35} />
      <Rect x={x} y={y} width={s} height={s} rx={s * 0.28} fill={c} />
      <Rect x={x + s * 0.12} y={y + s * 0.08} width={s * 0.76} height={s * 0.18} rx={s * 0.09} fill={art.white} opacity={0.25} />
    </G>
  );
}

export type GameTilesProps = ArtProps & {
  labels: { pattern: string; noRed: string; pairs: string; letters: string };
  /** Five letters shown on the word tiles. */
  word: string;
};

/** Welcome slide 2: four game badges (Pattern recall, Don't tap red, Card pairs, Letter guess). */
export function GameTiles({ labels, word, ...props }: GameTilesProps) {
  const grid = [
    [art.tilePink, art.tileGreen, art.tileGold],
    [art.tileBlue, art.tileViolet, art.tileOrange],
    [art.tileCobalt, art.tileRed, art.tileMint],
  ];
  const caption = (x: number, y: number, s: string) => (
    <SvgText x={x} y={y} fill={art.white} fontFamily={fontFamily.bold} fontSize={11} textAnchor="middle">
      {s}
    </SvgText>
  );
  return (
    <ArtFrame viewBox="0 0 300 250" {...props}>
      <Defs>
        <LinearGradient id="gtGreen" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={art.tileMint} />
          <Stop offset="1" stopColor={art.letterOnDeep} />
        </LinearGradient>
        <LinearGradient id="gtRed" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={art.tileCoral} />
          <Stop offset="1" stopColor={art.brainLine} />
        </LinearGradient>
        <LinearGradient id="gtCard" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={art.tilePink} />
          <Stop offset="1" stopColor={art.brainLine} />
        </LinearGradient>
      </Defs>
      {/* Pattern recall */}
      {grid.map((row, r) =>
        row.map((c, k) => (
          <Tile key={`${r}${k}`} x={22 + k * 30} y={14 + r * 30} s={26} c={c} dim={!(r === 0 && k === 0) && !(r === 1 && k === 1) && !(r === 2 && k === 2)} />
        )),
      )}
      {caption(66, 118, labels.pattern)}
      {/* Don't tap red */}
      <Circle cx={196} cy={40} r={24} fill={art.gold} />
      <Circle cx={196} cy={40} r={19} fill="url(#gtGreen)" />
      <Path d="M184 32 q8 -9 20 -4" stroke={art.white} strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Circle cx={248} cy={64} r={26} fill={art.gold} />
      <Circle cx={248} cy={64} r={21} fill="url(#gtRed)" />
      <Path d="M235 55 q9 -10 22 -4" stroke={art.white} strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" fill="none" />
      {caption(222, 108, labels.noRed)}
      {/* Card pairs */}
      {[0, 1].map((i) => (
        <G key={i} transform={`rotate(${i ? 8 : -8} ${52 + i * 44} 178)`}>
          <Rect x={34 + i * 44} y={150} width={38} height={54} rx={7} fill={art.gold} />
          <Rect x={37 + i * 44} y={153} width={32} height={48} rx={5} fill="url(#gtCard)" />
          <Path d={`M${53 + i * 44} 168 l7 9 l-7 9 l-7 -9 z`} fill={art.white} />
        </G>
      ))}
      {caption(74, 226, labels.pairs)}
      {/* Letter guess */}
      {word
        .slice(0, 5)
        .split('')
        .map((ch, i) => {
          const on = i < 3;
          const x = 172 + i * 25;
          return (
            <G key={i}>
              <Rect x={x} y={168} width={22} height={26} rx={5} fill={on ? art.letterOnDeep : art.letterOffDeep} />
              <Rect x={x} y={165} width={22} height={26} rx={5} fill={on ? art.letterOn : art.letterOff} />
              <SvgText x={x + 11} y={183} fill={art.white} fontFamily={fontFamily.bold} fontSize={12} textAnchor="middle">
                {ch}
              </SvgText>
            </G>
          );
        })}
      {caption(234, 214, labels.letters)}
    </ArtFrame>
  );
}

export type DistractedDeskProps = ArtProps & {
  docTitle: string;
  docLines: [string, string, string];
  timer: string;
};

/** Problem 2: a work laptop, and a phone feed that took over twenty minutes. */
export function DistractedDesk({ docTitle, docLines, timer, ...props }: DistractedDeskProps) {
  return (
    <ArtFrame viewBox="0 0 280 300" {...props}>
      <Defs>
        <LinearGradient id="ddGlow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={art.violetGlow} stopOpacity={0} />
          <Stop offset="0.6" stopColor={art.violetGlow} stopOpacity={0.9} />
          <Stop offset="1" stopColor={art.pinkGlow} stopOpacity={0.9} />
        </LinearGradient>
      </Defs>
      {/* laptop */}
      <Rect x={6} y={40} width={150} height={128} rx={8} fill={art.laptop} stroke={art.laptopEdge} strokeWidth={2} />
      <Rect x={12} y={46} width={138} height={116} rx={4} fill={art.laptopScreen} opacity={0.92} />
      <Rect x={12} y={46} width={138} height={14} rx={4} fill={art.laptopBar} />
      <Circle cx={20} cy={53} r={2.4} fill={art.dotRed} />
      <Circle cx={28} cy={53} r={2.4} fill={art.dotAmber} />
      <Circle cx={36} cy={53} r={2.4} fill={art.dotGreen} />
      <SvgText x={20} y={80} fill={art.docTitle} fontFamily={fontFamily.bold} fontSize={10}>
        {docTitle}
      </SvgText>
      {docLines.map((l, i) => (
        <SvgText key={i} x={20} y={98 + i * 14} fill={art.docText} fontFamily={fontFamily.regular} fontSize={7.5}>
          {l}
        </SvgText>
      ))}
      <Path d="M0 170 h162 l-6 8 h-150 z" fill={art.laptopEdge} />
      {/* timer chip */}
      <Rect x={4} y={6} width={74} height={26} rx={13} fill={art.timerBg} stroke={art.timerLine} strokeWidth={1.2} />
      <Circle cx={20} cy={19} r={6} fill="none" stroke={art.timer} strokeWidth={1.6} />
      <Path d="M20 19 V15" stroke={art.timer} strokeWidth={1.6} strokeLinecap="round" />
      <SvgText x={32} y={23.5} fill={art.timer} fontFamily={fontFamily.bold} fontSize={12}>
        {timer}
      </SvgText>
      {/* phone */}
      <Rect x={118} y={10} width={150} height={286} rx={26} fill={art.phoneEdge} />
      <Rect x={122} y={14} width={142} height={278} rx={22} fill={art.phoneBody} />
      <Rect x={122} y={120} width={142} height={172} rx={22} fill="url(#ddGlow)" opacity={0.85} />
      {[art.feed0, art.feed1, art.feed2].map((c, i) => (
        <G key={i}>
          <Rect x={132} y={22 + i * 90} width={122} height={82} rx={12} fill={art.phoneBody} opacity={0.92} />
          <Rect x={138} y={28 + i * 90} width={110} height={52} rx={8} fill={c} opacity={0.75} />
          <Rect x={140} y={86 + i * 90} width={70} height={4} rx={2} fill={art.feedLine} />
          <Rect x={140} y={94 + i * 90} width={44} height={4} rx={2} fill={art.feedLine} />
        </G>
      ))}
      <Rect x={163} y={282} width={60} height={3} rx={1.5} fill={art.white} opacity={0.7} />
    </ArtFrame>
  );
}

/** Paywall: three game badges (Don't tap red, Pattern recall, Card pairs) on a slight tilt. */
export function PaywallTiles(props: ArtProps) {
  const tiles: { x: number; y: number; r: number; c: string; deep: string }[] = [
    { x: 14, y: 30, r: -10, c: art.tileSky, deep: art.tileCobalt },
    { x: 92, y: 16, r: 0, c: art.tileViolet, deep: art.letterOffDeep },
    { x: 170, y: 30, r: 10, c: art.tilePink, deep: art.brainLine },
  ];
  const s = 62;
  return (
    <ArtFrame viewBox="0 0 246 110" {...props}>
      {tiles.map((tl, i) => (
        <G key={i} transform={`rotate(${tl.r} ${tl.x + s / 2} ${tl.y + s / 2})`}>
          <Rect x={tl.x} y={tl.y + 6} width={s} height={s} rx={17} fill={tl.deep} />
          <Rect x={tl.x} y={tl.y} width={s} height={s} rx={17} fill={tl.c} />
          <Rect x={tl.x + 8} y={tl.y + 5} width={s - 16} height={10} rx={5} fill={art.white} opacity={0.25} />
          {i === 0 ? (
            <>
              <Circle cx={tl.x + 23} cy={tl.y + 33} r={8} fill={art.white} />
              <Circle cx={tl.x + 40} cy={tl.y + 33} r={9} fill={art.tileCoral} />
              <Path
                d={`M${tl.x + 34} ${tl.y + 27} l12 12`}
                stroke={art.white}
                strokeWidth={3}
                strokeLinecap="round"
              />
            </>
          ) : null}
          {i === 1
            ? [0, 1, 2].flatMap((r) =>
                [0, 1, 2].map((k) => (
                  <Rect
                    key={`${r}${k}`}
                    x={tl.x + 16 + k * 11}
                    y={tl.y + 17 + r * 11}
                    width={8}
                    height={8}
                    rx={2.5}
                    fill={art.white}
                    opacity={r === 1 && k === 1 ? 1 : 0.7}
                  />
                )),
              )
            : null}
          {i === 2 ? (
            <>
              <Rect x={tl.x + 16} y={tl.y + 16} width={22} height={30} rx={4} fill={art.white} opacity={0.6} transform={`rotate(-12 ${tl.x + 27} ${tl.y + 31})`} />
              <Rect x={tl.x + 26} y={tl.y + 17} width={22} height={30} rx={4} fill={art.white} transform={`rotate(8 ${tl.x + 37} ${tl.y + 32})`} />
            </>
          ) : null}
        </G>
      ))}
    </ArtFrame>
  );
}
