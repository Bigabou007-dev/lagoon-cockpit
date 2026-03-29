/* ─────────────────────────────────────────────
 *  Lagoon Cockpit — Design Tokens v2
 *  Premium dark theme with depth & personality
 *
 *  COLORS is now a Proxy that reads from the Zustand
 *  theme store. All existing `COLORS.bg` references
 *  automatically resolve to the active palette.
 * ───────────────────────────────────────────── */

import { useThemeStore } from './themeStore';
import { darkColors, lightColors, type ColorPalette } from './colors';

export { darkColors, lightColors } from './colors';
export type { ColorPalette } from './colors';

/**
 * COLORS — reactive proxy.
 * When accessed (e.g. COLORS.bg), reads the current colors
 * from the Zustand theme store. Falls back to darkColors
 * if the store hasn't initialized yet.
 *
 * NOTE: This works for runtime reads inside render functions,
 * event handlers, and effects. For StyleSheet.create() calls
 * at module scope, the value is captured at import time (dark).
 * Components that need dynamic styles should use useTheme().colors
 * or inline styles.
 */
export const COLORS: ColorPalette = new Proxy(darkColors, {
  get(_target, prop: string) {
    try {
      const storeColors = useThemeStore.getState().colors;
      return (storeColors as any)[prop];
    } catch {
      return (darkColors as any)[prop];
    }
  },
});

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

/**
 * useColors() — React hook for components that need to
 * re-render when the theme changes. Returns the active palette.
 * Prefer this over COLORS in components where dynamic theme
 * switching matters (StyleSheet.create values won't update).
 */
export function useColors(): ColorPalette {
  return useThemeStore((s) => s.colors);
}
