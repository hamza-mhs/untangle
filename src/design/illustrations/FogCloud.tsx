import { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { ArtFrame, type ArtProps } from './Art';
import { art } from './palette';

const BODY =
  'M86 160 C 66 142, 78 104, 108 100 C 114 78, 148 72, 164 88 C 190 78, 218 98, 210 124 C 230 136, 220 168, 192 166 Z';
const FOLDS =
  'M148 84 C 144 96, 150 102, 147 110 M196 128 C 188 132, 192 146, 202 150 M98 140 C 106 142, 110 150, 106 156 M120 104 C 126 110, 122 116, 128 120 M178 98 C 172 104, 180 110, 174 116';
const MIST: [number, number, number, number][] = [
  [70, 150, 46, 14],
  [230, 140, 50, 16],
  [150, 176, 80, 14],
  [100, 96, 40, 12],
  [200, 110, 34, 11],
];

export type FogCloudProps = ArtProps & {
  /** `grumpy` = foggy mind under a rain cloud (k ≥ 1); `calm` = no signs ticked. */
  mood?: 'grumpy' | 'calm';
};

/** Problem 3: the brain as a little cloud character. */
export function FogCloud({ mood = 'grumpy', ...props }: FogCloudProps) {
  const calm = mood === 'calm';
  const line = calm ? art.calmLine : art.fogLine;
  return (
    <ArtFrame viewBox="30 20 240 190" {...props}>
      <Defs>
        <LinearGradient id="fcBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={calm ? art.calmHi : art.fogHi} />
          <Stop offset="0.6" stopColor={calm ? art.calmMid : art.fogMid} />
          <Stop offset="1" stopColor={calm ? art.calmLo : art.fogLo} />
        </LinearGradient>
        <RadialGradient id="fcStorm" cx="0.4" cy="0.35" r="0.7">
          <Stop offset="0" stopColor={art.storm0} />
          <Stop offset="1" stopColor={art.storm1} />
        </RadialGradient>
      </Defs>
      {/* Soft mist: layered translucent ellipses stand in for the prototype's blur filter. */}
      {calm
        ? null
        : MIST.map(([x, y, rx, ry], i) => (
            <G key={i}>
              <Ellipse cx={x} cy={y} rx={rx * 1.25} ry={ry * 1.5} fill={art.mist} opacity={0.12} />
              <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill={art.mist} opacity={0.2} />
            </G>
          ))}
      <Ellipse cx={148} cy={194} rx={62} ry={6} fill={art.black} opacity={0.5} />
      <Path
        d="M120 168 l-6 20 h12 M168 168 l4 20 h12"
        fill="none"
        stroke={line}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d={BODY} fill="url(#fcBody)" stroke={line} strokeWidth={3.2} strokeLinejoin="round" />
      <Path d={FOLDS} fill="none" stroke={line} strokeWidth={2.3} strokeLinecap="round" opacity={0.65} />
      <Ellipse cx={116} cy={104} rx={14} ry={5} fill={art.white} opacity={0.18} transform="rotate(-18 116 104)" />
      <Ellipse cx={134} cy={130} rx={8} ry={8.5} fill={art.eyeWhite} />
      <Ellipse cx={166} cy={130} rx={8} ry={8.5} fill={art.eyeWhite} />
      <Circle cx={134} cy={calm ? 131 : 134} r={4} fill={art.pupil} />
      <Circle cx={166} cy={calm ? 131 : 134} r={4} fill={art.pupil} />
      {calm ? (
        <>
          <Ellipse cx={118} cy={146} rx={6} ry={3.5} fill={art.calmCheek} opacity={0.6} />
          <Ellipse cx={182} cy={146} rx={6} ry={3.5} fill={art.calmCheek} opacity={0.6} />
          <Path d="M139 148 q11 9 22 0" fill="none" stroke={line} strokeWidth={2.8} strokeLinecap="round" />
        </>
      ) : (
        <>
          <Path
            d="M125 130 a9 9 0 0 1 18 0 z M157 130 a9 9 0 0 1 18 0 z"
            fill={art.fogLid}
            stroke={line}
            strokeWidth={2}
          />
          <Path d="M124 116 l12 4 M176 116 l-12 4" stroke={line} strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M141 152 q9 -6 18 0" fill="none" stroke={line} strokeWidth={2.8} strokeLinecap="round" />
          <Path d="M206 112 q4 7 0 10 q-4 -3 0 -10z" fill={art.drop} opacity={0.85} />
          <Path
            d="M178 58 a14 14 0 0 1 26 -8 a16 16 0 0 1 30 6 a12 12 0 0 1 -2 24 h-50 a12 12 0 0 1 -4 -22z"
            fill="url(#fcStorm)"
          />
          {[190, 202, 214, 226].map((x) => (
            <Path key={x} d={`M${x} 84 l-4 10`} stroke={art.rain} strokeWidth={2} strokeLinecap="round" />
          ))}
        </>
      )}
    </ArtFrame>
  );
}
