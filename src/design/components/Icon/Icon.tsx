import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { glyphs, type IconName } from '../../icons';
import { size as sizes } from '../../tokens';

export type IconProps = {
  name: IconName;
  color: string;
  size?: number;
  testID?: string;
};

const DEFAULT_STROKE = 2;

/** Decorative glyph from the icon set; the control around it carries the label. */
export function Icon({ name, color, size = sizes.icon.md, testID }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...(testID ? { testID } : {})}>
      {glyphs[name].map((s, i) => {
        const paint = 'fill' in s && s.fill
          ? { fill: color }
          : {
              fill: 'none',
              stroke: color,
              strokeWidth: ('width' in s ? s.width : undefined) ?? DEFAULT_STROKE,
              strokeLinecap: 'round' as const,
              strokeLinejoin: 'round' as const,
            };
        if (s.kind === 'path') return <Path key={i} d={s.d} {...paint} />;
        if (s.kind === 'rect')
          return <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} {...paint} />;
        return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} {...paint} />;
      })}
    </Svg>
  );
}

export type { IconName };
