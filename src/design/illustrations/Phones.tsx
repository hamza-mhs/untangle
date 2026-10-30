import { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { fontFamily } from '../tokens';
import { ArtFrame, type ArtProps } from './Art';
import { art } from './palette';

function LockGlyph({ x, y, s }: { x: number; y: number; s: number }) {
  const k = s / 24;
  return (
    <G transform={`translate(${x} ${y}) scale(${k})`}>
      <Rect x={5} y={10} width={14} height={10} rx={3} fill={art.black} />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke={art.black} strokeWidth={2.4} />
    </G>
  );
}

/** Welcome slide 1: a tilted phone whose app is paused by Untangle. */
export function PausedPhone({ caption, ...props }: ArtProps & { caption: string }) {
  return (
    <ArtFrame viewBox="0 0 300 300" {...props}>
      <Defs>
        <LinearGradient id="ppScreen" x1="0" y1="0" x2="0.3" y2="1">
          <Stop offset="0" stopColor={art.phoneScreen0} />
          <Stop offset="0.55" stopColor={art.phoneScreen1} />
          <Stop offset="1" stopColor={art.phoneScreen2} />
        </LinearGradient>
        <RadialGradient id="ppRing" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0.8" stopColor={art.violetGlow} stopOpacity={0} />
          <Stop offset="0.97" stopColor={art.violetGlow} stopOpacity={0.25} />
          <Stop offset="1" stopColor={art.violetGlow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={150} cy={150} r={148} fill="url(#ppRing)" />
      <G transform="rotate(-8 150 150)">
        <Rect x={62} y={18} width={176} height={300} rx={34} fill={art.phoneEdge} />
        <Rect x={66} y={22} width={168} height={292} rx={30} fill="url(#ppScreen)" />
        <Rect x={66} y={22} width={168} height={70} rx={30} fill={art.white} opacity={0.06} />
        <Rect x={124} y={84} width={52} height={52} rx={14} fill={art.white} />
        <LockGlyph x={136} y={96} s={28} />
        <SvgText
          x={150}
          y={164}
          fill={art.white}
          opacity={0.85}
          fontFamily={fontFamily.bold}
          fontSize={14}
          textAnchor="middle">
          {caption}
        </SvgText>
        <Rect x={98} y={184} width={46} height={46} rx={12} fill={art.tileRed} opacity={0.8} />
        <Rect x={156} y={184} width={46} height={46} rx={12} fill={art.tileGreen} opacity={0.8} />
        <Rect x={98} y={240} width={46} height={46} rx={12} fill={art.tileGold} opacity={0.7} />
        <Rect x={156} y={240} width={46} height={46} rx={12} fill={art.tileBlue} opacity={0.7} />
      </G>
    </ArtFrame>
  );
}

export type PauseCardPhoneProps = ArtProps & {
  /** Two-letter monogram on the app tile. */
  appMonogram: string;
  title: string;
  subtitle: string;
  actions: [string, string, string];
};

/** Moment of pause: the pause screen as it appears over a blocked app. */
export function PauseCardPhone({ appMonogram, title, subtitle, actions, ...props }: PauseCardPhoneProps) {
  return (
    <ArtFrame viewBox="0 0 240 300" {...props}>
      <Defs>
        <LinearGradient id="pcCard" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={art.pauseCard0} />
          <Stop offset="1" stopColor={art.pauseCard1} />
        </LinearGradient>
        <LinearGradient id="pcIg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={art.igA} />
          <Stop offset="0.5" stopColor={art.igB} />
          <Stop offset="1" stopColor={art.igC} />
        </LinearGradient>
      </Defs>
      <Rect x={20} y={6} width={200} height={300} rx={40} fill="url(#pcCard)" />
      <Rect x={20} y={6} width={200} height={300} rx={40} fill="none" stroke={art.white} strokeOpacity={0.08} strokeWidth={1.5} />
      <Rect x={98} y={64} width={44} height={44} rx={12} fill="url(#pcIg)" />
      <SvgText x={120} y={91} fill={art.white} fontFamily={fontFamily.bold} fontSize={11} textAnchor="middle">
        {appMonogram}
      </SvgText>
      <SvgText x={120} y={136} fill={art.white} fontFamily={fontFamily.bold} fontSize={16} textAnchor="middle">
        {title}
      </SvgText>
      <SvgText x={120} y={154} fill={art.mutedText} fontFamily={fontFamily.regular} fontSize={8.6} textAnchor="middle">
        {subtitle}
      </SvgText>
      {actions.map((a, i) => (
        <G key={a}>
          <Rect
            x={52}
            y={176 + i * 38}
            width={136}
            height={30}
            rx={15}
            fill={i === 0 ? art.white : art.pauseButton}
          />
          <SvgText
            x={120}
            y={195 + i * 38}
            fill={i === 0 ? art.black : art.white}
            fontFamily={fontFamily.bold}
            fontSize={11.5}
            textAnchor="middle">
            {a}
          </SvgText>
        </G>
      ))}
    </ArtFrame>
  );
}

/** Accessibility disclosure: a dimmed mock of the system Accessibility settings. */
export function AccessibilitySettingsMock({
  heading,
  section,
  rows,
  off,
  ...props
}: ArtProps & { heading: string; section: string; rows: [string, string, string]; off: string }) {
  return (
    <ArtFrame viewBox="0 0 220 180" {...props}>
      <Rect x={2} y={2} width={216} height={186} rx={26} fill={art.settingsBg} stroke={art.settingsLine} strokeWidth={3} />
      <SvgText x={22} y={22} fill={art.settingsQuiet} fontFamily={fontFamily.medium} fontSize={8}>
        9:41
      </SvgText>
      <Path d="M22 46 h12 M22 46 l5 -5 M22 46 l5 5" stroke={art.settingsText} strokeWidth={1.6} strokeLinecap="round" />
      <SvgText x={42} y={51} fill={art.settingsText} fontFamily={fontFamily.medium} fontSize={15}>
        {heading}
      </SvgText>
      <SvgText x={22} y={76} fill={art.settingsSub} fontFamily={fontFamily.medium} fontSize={8}>
        {section}
      </SvgText>
      {rows.map((r, i) => {
        const y = 98 + i * 30;
        const ours = i === 1;
        return (
          <G key={r}>
            {ours ? <Rect x={2} y={y - 15} width={216} height={30} fill={art.white} opacity={0.05} /> : null}
            {ours ? (
              <>
                <Circle cx={30} cy={y - 3} r={9} fill={art.untangle} />
                <SvgText x={30} y={y} fill={art.white} fontFamily={fontFamily.bold} fontSize={9} textAnchor="middle">
                  U
                </SvgText>
              </>
            ) : null}
            <SvgText x={ours ? 46 : 22} y={y} fill={art.settingsText} fontFamily={fontFamily.regular} fontSize={11}>
              {r}
            </SvgText>
            <SvgText x={198} y={y} fill={art.settingsQuiet} fontFamily={fontFamily.regular} fontSize={8} textAnchor="end">
              {off}
            </SvgText>
          </G>
        );
      })}
      <Rect x={80} y={176} width={60} height={3} rx={1.5} fill={art.settingsQuiet} />
    </ArtFrame>
  );
}

/** You're all set: a mint shield with a tick. */
export function ShieldCheck(props: ArtProps) {
  return (
    <ArtFrame viewBox="0 0 64 64" {...props}>
      <Defs>
        <LinearGradient id="scShield" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={art.mint} />
          <Stop offset="1" stopColor={art.mintDeep} />
        </LinearGradient>
      </Defs>
      <Path
        d="M32 6 L52 13 V30 C52 43 43 53 32 58 C21 53 12 43 12 30 V13 Z"
        fill="url(#scShield)"
      />
      <Path d="M23 32 l6.5 6.5 L42 25" fill="none" stroke={art.mintInk} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </ArtFrame>
  );
}
