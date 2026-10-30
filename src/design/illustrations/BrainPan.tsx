import { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { ArtFrame, type ArtProps } from './Art';
import { art } from './palette';

const BRAIN =
  'M86 160 C 66 142, 78 104, 108 100 C 114 78, 148 72, 164 88 C 190 78, 218 98, 210 124 C 230 136, 220 168, 192 166 Z';
const FOLDS =
  'M148 84 C 144 106, 156 118, 148 144 M110 112 C 124 112, 126 128, 118 140 M176 102 C 166 118, 186 126, 180 144 M198 130 C 188 134, 192 150, 202 154 M98 144 C 110 146, 116 156, 110 162';

/** The scribbled "tangle" over the brain (prototype `tng()` at rest), as a closed smooth path. */
function tangle(k: number): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39 + k + Math.sin(i) * 0.25;
    const r = 58 + 38 * Math.sin(i * 1.7 + k);
    pts.push([150 + r * Math.cos(a) * 1.25, r * Math.sin(a) * 0.7 + 78]);
  }
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!;
    const [x1, y1] = pts[i]!;
    d += ` Q${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)}`;
  }
  return d;
}
const TANGLE_A = tangle(0);
const TANGLE_B = tangle(1.3);

/** Welcome slide 3: an overheated brain in a frying pan, tangled lines above it. */
export function BrainPan(props: ArtProps) {
  return (
    <ArtFrame viewBox="0 0 340 250" {...props}>
      <Defs>
        <RadialGradient id="bpHeat" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={art.heat} stopOpacity={0.75} />
          <Stop offset="0.6" stopColor={art.heatOuter} stopOpacity={0.18} />
          <Stop offset="1" stopColor={art.heatOuter} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="bpWall" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={art.panWall0} />
          <Stop offset="0.45" stopColor={art.panWall1} />
          <Stop offset="0.7" stopColor={art.panWall2} />
          <Stop offset="1" stopColor={art.panWall3} />
        </LinearGradient>
        <LinearGradient id="bpRim" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={art.panRim0} />
          <Stop offset="0.5" stopColor={art.panRim1} />
          <Stop offset="1" stopColor={art.panRim2} />
        </LinearGradient>
        <RadialGradient id="bpIn" cx="0.45" cy="0.35" r="0.75">
          <Stop offset="0" stopColor={art.panIn0} />
          <Stop offset="0.7" stopColor={art.panIn1} />
          <Stop offset="1" stopColor={art.panIn2} />
        </RadialGradient>
        <LinearGradient id="bpHandle" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={art.handle0} />
          <Stop offset="0.35" stopColor={art.handle1} />
          <Stop offset="1" stopColor={art.handle2} />
        </LinearGradient>
        <LinearGradient id="bpBrain" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={art.brainHi} />
          <Stop offset="0.6" stopColor={art.brainMid} />
          <Stop offset="1" stopColor={art.brainLo} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={140} cy={214} rx={130} ry={30} fill="url(#bpHeat)" />
      <Ellipse cx={140} cy={214} rx={104} ry={16} fill={art.black} opacity={0.55} />
      <G>
        <Path d="M232 170 L322 142 Q338 137 340 150 Q341 162 326 166 L238 192 Z" fill="url(#bpHandle)" />
        <Path d="M240 172 L320 147" stroke={art.white} strokeOpacity={0.18} strokeWidth={2} strokeLinecap="round" />
        <Ellipse cx={327} cy={152} rx={5} ry={3.2} fill={art.ink} transform="rotate(-16 327 152)" />
        <Path d="M226 166 Q240 162 246 172 L246 190 Q236 196 226 190 Z" fill={art.rivetPlate} />
        <Circle cx={236} cy={174} r={2.4} fill={art.rivet} />
        <Circle cx={236} cy={185} r={2.4} fill={art.rivet} />
      </G>
      <Path d="M28 170 A112 36 0 0 0 252 170 L244 194 A104 30 0 0 1 36 194 Z" fill="url(#bpWall)" />
      <Ellipse cx={140} cy={170} rx={112} ry={36} fill="url(#bpRim)" />
      <Ellipse cx={140} cy={171} rx={104} ry={31} fill="url(#bpIn)" />
      <Ellipse cx={108} cy={160} rx={40} ry={7} fill={art.white} opacity={0.05} />
      {Array.from({ length: 10 }, (_, i) => (
        <Circle key={i} cx={62 + i * 16} cy={168 + (i % 3) * 6} r={1.6 + (i % 2) * 1.2} fill={art.oil} opacity={0.75} />
      ))}
      <G transform="translate(0 -40)">
        <Ellipse cx={140} cy={168} rx={52} ry={10} fill={art.brainLine} opacity={0.3} />
        <Path d={BRAIN} fill="url(#bpBrain)" stroke={art.brainLine} strokeWidth={3} strokeLinejoin="round" />
        <Path d={FOLDS} fill="none" stroke={art.violetGlow} strokeWidth={2.6} strokeLinecap="round" opacity={0.85} />
        <Ellipse cx={120} cy={104} rx={16} ry={6} fill={art.white} opacity={0.35} transform="rotate(-18 120 104)" />
      </G>
      <Path d={TANGLE_A} fill="none" stroke={art.tangleA} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
      <Path d={TANGLE_B} fill="none" stroke={art.tangleB} strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />
    </ArtFrame>
  );
}
