/* ─────────────────────────────────────────────
 *  Lagoon Cockpit — ThemeProvider
 *  Wraps the app root, syncs OS color scheme,
 *  and provides useTheme() hook.
 * ───────────────────────────────────────────── */

import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore, type ThemeMode } from './themeStore';
import type { ColorPalette } from './colors';

export interface ThemeContextValue {
  colors: ColorPalette;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

/**
 * ThemeProvider — place at the app root.
 * Syncs OS color scheme into the Zustand store and loads
 * the persisted preference on mount.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const setSystemScheme = useThemeStore((s) => s.setSystemScheme);
  const loadPreference = useThemeStore((s) => s.loadPreference);

  // Load saved preference on mount
  useEffect(() => {
    loadPreference();
  }, [loadPreference]);

  // Sync OS color scheme changes
  useEffect(() => {
    const scheme = systemColorScheme === 'light' ? 'light' : 'dark';
    setSystemScheme(scheme);
  }, [systemColorScheme, setSystemScheme]);

  return <>{children}</>;
}

/**
 * useTheme() — returns the current theme state.
 * Reads directly from the Zustand store, so any component
 * calling this will re-render when the theme changes.
 */
export function useTheme(): ThemeContextValue {
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const isDark = useThemeStore((s) => s.isDark);

  return { colors, mode, setMode, isDark };
}
