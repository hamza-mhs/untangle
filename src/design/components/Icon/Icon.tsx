import {
  Settings,
  Circle,
  Square,
  Triangle,
  Star,
  Heart,
  Diamond,
  Hexagon,
  Cloud,
  Calculator,
  Type,
  Target,
  LayoutGrid,
  Hash,
  Mic,
  MicOff,
  Timer,
  RefreshCw,
  Share2,
  Lamp,
  Undo2,
  Delete,
  ImagePlus,
  Fingerprint,
  Download,
  Upload,
  FileText,
  Info,
  Bell,
  CircleHelp,
  ArrowRight,
  BellOff,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Flag,
  Flame,
  Gift,
  Globe,
  House,
  Leaf,
  Lock,
  LockOpen,
  Moon,
  Palette,
  Pause,
  Plus,
  ShieldOff,
  Smartphone,
  Sparkles,
  TriangleAlert,
  WifiOff,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

/**
 * Lucide stroke icons behind one wrapper (SPEC §2). Default stroke widths match the designs
 * (in 24-unit viewBox space, so they scale with size like the source SVGs).
 */
const ICONS = {
  chevronLeft: { component: ChevronLeft, stroke: 2.2 },
  chevronRight: { component: ChevronRight, stroke: 2 },
  arrowRight: { component: ArrowRight, stroke: 2.4 },
  check: { component: Check, stroke: 2.8 },
  checkCircle: { component: CircleCheck, stroke: 2 },
  close: { component: X, stroke: 2.2 },
  plus: { component: Plus, stroke: 2.2 },
  bellOff: { component: BellOff, stroke: 2 },
  lock: { component: Lock, stroke: 2.2 },
  lockOpen: { component: LockOpen, stroke: 2.2 },
  shieldOff: { component: ShieldOff, stroke: 2 },
  warning: { component: TriangleAlert, stroke: 2 },
  offline: { component: WifiOff, stroke: 2 },
  sparkles: { component: Sparkles, stroke: 2 },
  flame: { component: Flame, stroke: 2 },
  pause: { component: Pause, stroke: 2.4 },
  phone: { component: Smartphone, stroke: 2.2 },
  home: { component: House, stroke: 1.8 },
  flag: { component: Flag, stroke: 1.8 },
  gift: { component: Gift, stroke: 1.8 },
  silence: { component: Wind, stroke: 2 },
  reading: { component: BookOpen, stroke: 2 },
  outside: { component: Leaf, stroke: 2 },
  moon: { component: Moon, stroke: 2 },
  globe: { component: Globe, stroke: 2 },
  palette: { component: Palette, stroke: 2 },
  maths: { component: Calculator, stroke: 2 },
  letters: { component: Type, stroke: 2 },
  target: { component: Target, stroke: 2 },
  pairs: { component: LayoutGrid, stroke: 2 },
  span: { component: Hash, stroke: 2 },
  mic: { component: Mic, stroke: 2.2 },
  micOff: { component: MicOff, stroke: 2 },
  timer: { component: Timer, stroke: 2.4 },
  redraw: { component: RefreshCw, stroke: 2.2 },
  share: { component: Share2, stroke: 2 },
  lamp: { component: Lamp, stroke: 1.8 },
  undo: { component: Undo2, stroke: 2.2 },
  backspace: { component: Delete, stroke: 2 },
  photo: { component: ImagePlus, stroke: 2 },
  fingerprint: { component: Fingerprint, stroke: 2 },
  download: { component: Download, stroke: 2 },
  upload: { component: Upload, stroke: 2 },
  guide: { component: FileText, stroke: 2 },
  info: { component: Info, stroke: 2 },
  bell: { component: Bell, stroke: 2 },
  help: { component: CircleHelp, stroke: 2 },
  settings: { component: Settings, stroke: 2 },
  shapeCircle: { component: Circle, stroke: 2.4 },
  shapeSquare: { component: Square, stroke: 2.4 },
  shapeTriangle: { component: Triangle, stroke: 2.4 },
  shapeStar: { component: Star, stroke: 2.4 },
  shapeHeart: { component: Heart, stroke: 2.4 },
  shapeDiamond: { component: Diamond, stroke: 2.4 },
  shapeHexagon: { component: Hexagon, stroke: 2.4 },
  shapeCloud: { component: Cloud, stroke: 2.4 },
} as const satisfies Record<string, { component: LucideIcon; stroke: number }>;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size: number;
  color: string;
  strokeWidth?: number;
};

export function Icon({ name, size, color, strokeWidth }: IconProps) {
  const { component: Glyph, stroke } = ICONS[name];
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no">
      <Glyph size={size} color={color} strokeWidth={strokeWidth ?? stroke} />
    </View>
  );
}
