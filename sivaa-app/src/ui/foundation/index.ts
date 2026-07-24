/* ============================================================
 * ORTHO-PAY Foundation — Token Exports for TypeScript
 * Provides typed access to design tokens from TS code.
 * Import: import { tokens } from '@/ui/foundation'
 *
 * Source of truth: DESIGN.md (Ollama-inspired design system).
 * Keep in sync with the CSS custom properties in this folder.
 * ============================================================ */

export const colors = {
  /* Brand */
  primary: '#000000',
  inkDeep: '#090909',

  /* Text */
  ink: '#000000',
  charcoal: '#525252',
  body: '#737373',
  mute: '#a3a3a3',

  /* Surfaces */
  canvas: '#ffffff',
  surfaceSoft: '#fafafa',
  surfaceCard: '#ffffff',
  surfaceDark: '#171717',

  /* Hairlines */
  hairline: '#e5e5e5',
  hairlineStrong: '#d4d4d4',

  /* On-color */
  onPrimary: '#ffffff',
  onDark: '#ffffff',
  onDarkMute: 'rgba(255, 255, 255, 0.7)',

  /* Focus */
  focusRing: 'rgba(59, 130, 246, 0.5)',

  /* Links */
  link: '#000000',
  linkMute: '#737373',

  /* Terminal dots (terminal-card use only) */
  terminalRed: '#ff5f56',
  terminalYellow: '#ffbd2e',
  terminalGreen: '#27c93f',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 88,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export const shadows = {
  none: 'none',
} as const;

export const zIndex = {
  base: 0,
  sticky: 100,
  dropdown: 300,
  overlay: 400,
  toast: 500,
  tooltip: 600,
} as const;

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  tabletNarrow: 850,
  desktop: 1024,
  desktopLarge: 1280,
} as const;

export const opacity = {
  full: 1,
  high: 0.85,
  medium: 0.6,
  low: 0.4,
  faint: 0.2,
  transparent: 0,
  disabled: 0.5,
} as const;

export const fonts = {
  display: 'Nunito',       /* Open-source substitute for SF Pro Rounded */
  body: 'ui-sans-serif',   /* OS default — intentionally "stock" */
  mono: 'ui-monospace',    /* OS default mono */
} as const;

export const typography = {
  /* Display (Nunito / SF Pro Rounded) */
  displayXl:     { size: 36, weight: 500, lineHeight: 1.11, letterSpacing: 0 },
  displayLg:     { size: 30, weight: 500, lineHeight: 1.2,  letterSpacing: 0 },
  headingLg:     { size: 24, weight: 600, lineHeight: 1.33, letterSpacing: 0 },

  /* UI / Body (ui-sans-serif) */
  headingMd:     { size: 20, weight: 500, lineHeight: 1.4,  letterSpacing: 0 },
  headingSm:     { size: 18, weight: 500, lineHeight: 1.56, letterSpacing: 0 },
  bodyMd:        { size: 16, weight: 400, lineHeight: 1.5,  letterSpacing: 0 },
  bodyStrong:    { size: 16, weight: 500, lineHeight: 1.5,  letterSpacing: 0 },
  bodySm:        { size: 14, weight: 400, lineHeight: 1.43, letterSpacing: 0 },
  bodySmStrong:  { size: 14, weight: 500, lineHeight: 1.43, letterSpacing: 0 },
  captionSm:     { size: 12, weight: 400, lineHeight: 1.33, letterSpacing: 0 },
  button:        { size: 14, weight: 500, lineHeight: 1,    letterSpacing: 0 },

  /* Code / Mono (ui-monospace) */
  codeMd:        { size: 16, weight: 400, lineHeight: 1.5,  letterSpacing: 0 },
  codeSm:        { size: 14, weight: 400, lineHeight: 1.43, letterSpacing: 0 },
} as const;

export const tokens = {
  colors,
  spacing,
  radius,
  shadows,
  zIndex,
  breakpoints,
  opacity,
  fonts,
  typography,
} as const;
