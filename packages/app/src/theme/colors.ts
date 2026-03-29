/* ─────────────────────────────────────────────
 *  Lagoon Cockpit — Color Palettes
 *  Dark + Light themes with matching shapes
 * ───────────────────────────────────────────── */

export interface ColorPalette {
  /* Surfaces */
  bgDeep: string;
  bg: string;
  card: string;
  cardElevated: string;
  border: string;
  borderActive: string;

  /* Primary accent */
  blue: string;
  blueGlow: string;

  /* Semantic palette */
  optimal: string;
  green: string;
  yellow: string;
  orange: string;
  red: string;

  /* Accents */
  purple: string;
  pink: string;
  teal: string;
  indigo: string;
  rose: string;

  /* Text */
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  /* Glass effect */
  glass: string;
  glassBorder: string;
  glassHighlight: string;
}

export const darkColors: ColorPalette = {
  /* Surfaces — luminance stepping for depth */
  bgDeep: '#08090f',
  bg: '#0e1019',
  card: '#161822',
  cardElevated: '#1e2030',
  border: 'rgba(255,255,255,0.06)',
  borderActive: 'rgba(99,155,255,0.3)',

  /* Primary accent — vibrant cyan-blue */
  blue: '#639BFF',
  blueGlow: 'rgba(99,155,255,0.25)',

  /* Semantic palette — 5-level severity scale */
  optimal: '#22d3ee',
  green: '#4ade80',
  yellow: '#fbbf24',
  orange: '#f97316',
  red: '#f43f5e',

  /* Accents */
  purple: '#a78bfa',
  pink: '#f472b6',
  teal: '#2dd4bf',
  indigo: '#818cf8',
  rose: '#fb7185',

  /* Text */
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',

  /* Glass effect */
  glass: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glassHighlight: 'rgba(255,255,255,0.04)',
};

export const lightColors: ColorPalette = {
  /* Surfaces — iOS system grays */
  bgDeep: '#F2F2F7',
  bg: '#FFFFFF',
  card: '#F9FAFB',
  cardElevated: '#FFFFFF',
  border: 'rgba(0,0,0,0.06)',
  borderActive: 'rgba(59,130,246,0.3)',

  /* Primary accent — slightly darker for light background */
  blue: '#3B82F6',
  blueGlow: 'rgba(59,130,246,0.15)',

  /* Semantic palette — darker for light-bg readability */
  optimal: '#0891B2',
  green: '#16A34A',
  yellow: '#D97706',
  orange: '#EA580C',
  red: '#E11D48',

  /* Accents */
  purple: '#7C3AED',
  pink: '#DB2777',
  teal: '#0D9488',
  indigo: '#6366F1',
  rose: '#E11D48',

  /* Text — slate scale */
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  /* Glass effect — inverted for light */
  glass: 'rgba(0,0,0,0.03)',
  glassBorder: 'rgba(0,0,0,0.08)',
  glassHighlight: 'rgba(255,255,255,0.5)',
};
