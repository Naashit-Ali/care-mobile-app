// MediCare design tokens — clean, bold "Uber/Wolt-style" UI: white surfaces, near-black type,
// one strong brand color (teal), one accent (coral) for alerts and the AI agent.
// All sizes go through `ms` (react-native-size-matters) so they scale with the screen width.
import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import type { DoseStatus } from './types';

export { ms, s, vs } from 'react-native-size-matters';

export const colors = {
  // Brand
  primary: '#0F7C7A',
  primaryPressed: '#0B5F5D',
  primarySoft: '#E6F4F3',
  accent: '#FF6B57',
  accentSoft: '#FFEDEA',

  // Neutrals
  black: '#0B0F10',
  text: '#1C2427',
  textMuted: '#5B6B70',
  textSubtle: '#8A979B',
  border: '#E4E9EA',
  divider: '#F0F3F4',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F7F8',
  dark: '#0E3B43',

  // Dose status (always pair color with text/icon, never color alone)
  taken: '#1B8A3A',
  takenSoft: '#E7F5EC',
  missed: '#D92D20',
  missedSoft: '#FEECEB',
  pending: '#B54708',
  pendingSoft: '#FEF4E6',

  white: '#FFFFFF',
  overlay: 'rgba(11,15,16,0.45)',
} as const;

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

const t = (fontFamily: string, size: number, lineHeight: number, letterSpacing = 0) => ({
  fontFamily,
  fontSize: ms(size),
  lineHeight: ms(lineHeight),
  letterSpacing,
});

/** Caregiver app type scale. */
export const type = {
  display: t(font.extrabold, 34, 40, -0.5),
  h1: t(font.bold, 28, 34, -0.3),
  h2: t(font.bold, 22, 28),
  h3: t(font.semibold, 18, 24),
  body: t(font.regular, 16, 22),
  bodyStrong: t(font.semibold, 16, 22),
  caption: t(font.medium, 13, 18),
  overline: { ...t(font.bold, 12, 16, 1.2), textTransform: 'uppercase' as const },
} as const;

/** Parent (elderly) app type scale — everything bigger. */
export const typeLarge = {
  display: t(font.extrabold, 44, 50, -0.5),
  h1: t(font.bold, 34, 40, -0.3),
  h2: t(font.bold, 28, 34),
  body: t(font.medium, 22, 30),
  button: t(font.extrabold, 30, 36),
} as const;

export const space = { xs: ms(4), sm: ms(8), md: ms(12), lg: ms(16), xl: ms(24), xxl: ms(32), xxxl: ms(48) } as const;

export const radius = { sm: ms(8), md: ms(12), lg: ms(16), xl: ms(24), pill: 999 } as const;

export const shadow = {
  card: {
    shadowColor: '#0B0F10',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#0B0F10',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const sizes = {
  buttonHeight: ms(56),
  bigButtonHeight: ms(120),
  inputHeight: ms(56),
  iconCircle: ms(44),
  tabBarHeight: ms(64),
  screenPadding: ms(20),
} as const;

type IconName = ComponentProps<typeof Ionicons>['name'];

export const statusStyle: Record<DoseStatus, { fg: string; bg: string; label: string; icon: IconName }> = {
  taken: { fg: colors.taken, bg: colors.takenSoft, label: 'Taken', icon: 'checkmark-circle' },
  missed: { fg: colors.missed, bg: colors.missedSoft, label: 'Missed', icon: 'close-circle' },
  pending: { fg: colors.pending, bg: colors.pendingSoft, label: 'Pending', icon: 'time' },
};

export const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const greeting = (d = new Date()) => {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?';

export const theme = { colors, font, type, typeLarge, space, radius, shadow, sizes, statusStyle };
export default theme;
