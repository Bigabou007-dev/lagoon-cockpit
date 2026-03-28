/* ─────────────────────────────────────────────
 *  Lagoon Cockpit — Design Tokens v2
 *  Premium dark theme with depth & personality
 * ───────────────────────────────────────────── */

/* Surface elevation: darker = deeper, lighter = elevated */
export const COLORS = {
  /* Surfaces — luminance stepping for depth */
  bgDeep: '#08090f',     // deepest background (mesh gradient base)
  bg: '#0e1019',         // primary background
  card: '#161822',       // card surface (level 1)
  cardElevated: '#1e2030', // elevated card (level 2)
  border: 'rgba(255,255,255,0.06)',  // subtle glass border
  borderActive: 'rgba(99,155,255,0.3)', // active/selected border

  /* Primary accent — shifted from flat blue to vibrant cyan-blue */
  blue: '#639BFF',
  blueGlow: 'rgba(99,155,255,0.25)',

  /* Semantic palette — 5-level severity scale */
  optimal: '#22d3ee',    // cyan — cool, under control
  green: '#4ade80',      // success, running
  yellow: '#fbbf24',     // elevated, attention
  orange: '#f97316',     // warning, act soon
  red: '#f43f5e',        // critical, rose-red (not harsh)

  /* Accents */
  purple: '#a78bfa',
  pink: '#f472b6',
  teal: '#2dd4bf',
  indigo: '#818cf8',
  rose: '#fb7185',

  /* Text — heavier on dark for readability */
  textPrimary: '#f1f5f9',    // not pure white — easier on eyes
  textSecondary: '#94a3b8',  // slate-400
  textTertiary: '#64748b',   // slate-500

  /* Glass effect */
  glass: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glassHighlight: 'rgba(255,255,255,0.04)', // top-edge inner highlight
};

/* Mesh gradient colors for screen backgrounds */
export const MESH = {
  /* Deep aurora — navy/purple/teal undertones */
  overview: [
    '#08090f', '#0d1a2e', '#08090f',
    '#160a28', '#0e1019', '#0a1628',
    '#08090f', '#0a1628', '#08090f',
  ],
  /* Cool blue variant */
  containers: [
    '#08090f', '#0a1628', '#08090f',
    '#0e1019', '#0d1a2e', '#0e1019',
    '#08090f', '#0a1628', '#08090f',
  ],
  /* Subtle purple variant */
  manage: [
    '#08090f', '#0e1019', '#08090f',
    '#120a20', '#0e1019', '#0e1019',
    '#08090f', '#0e1019', '#08090f',
  ],
};

export const RADIUS = { sm: 10, md: 14, lg: 18, xl: 24 };

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const FONT = {
  hero: { fontFamily: 'Inter_800ExtraBold', fontSize: 32 } as const,
  title: { fontFamily: 'Inter_700Bold', fontSize: 20 } as const,
  heading: { fontFamily: 'Inter_600SemiBold', fontSize: 17 } as const,
  body: { fontFamily: 'Inter_400Regular', fontSize: 15 } as const,
  bodyMedium: { fontFamily: 'Inter_500Medium', fontSize: 15 } as const,
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  } as const,
  metric: { fontFamily: 'Inter_700Bold', fontSize: 28 } as const,
  metricLarge: { fontFamily: 'Inter_800ExtraBold', fontSize: 42 } as const,
  mono: { fontFamily: 'JetBrainsMono' as const, fontSize: 13 } as const,
};

/* Shadow presets for elevated surfaces (iOS + Android) */
export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  }),
};
