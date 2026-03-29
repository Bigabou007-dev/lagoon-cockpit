/* ─────────────────────────────────────────────
 *  Lagoon Cockpit — Theme Store (Zustand)
 *  Provides reactive theme state for the entire app.
 *  COLORS getter in tokens.ts reads from this store,
 *  so all existing COLORS.xxx references update automatically.
 * ───────────────────────────────────────────── */

import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { darkColors, lightColors, type ColorPalette } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'cockpit_theme_mode';

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
};

interface ThemeState {
  /** User preference: 'light' | 'dark' | 'system' */
  mode: ThemeMode;
  /** System color scheme reported by OS */
  systemScheme: 'light' | 'dark';
  /** Resolved: is the active palette dark? */
  isDark: boolean;
  /** Current active color palette */
  colors: ColorPalette;

  /** Load saved preference from secure store */
  loadPreference: () => Promise<void>;
  /** Set user preference and persist */
  setMode: (mode: ThemeMode) => Promise<void>;
  /** Update the OS-reported color scheme (called from ThemeProvider) */
  setSystemScheme: (scheme: 'light' | 'dark') => void;
}

function resolveColors(mode: ThemeMode, systemScheme: 'light' | 'dark'): { isDark: boolean; colors: ColorPalette } {
  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  return { isDark, colors: isDark ? darkColors : lightColors };
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  systemScheme: 'dark',
  isDark: true,
  colors: darkColors,

  loadPreference: async () => {
    try {
      const raw = await storage.getItem(THEME_KEY);
      if (raw && (raw === 'light' || raw === 'dark' || raw === 'system')) {
        const mode = raw as ThemeMode;
        const { systemScheme } = get();
        const { isDark, colors } = resolveColors(mode, systemScheme);
        set({ mode, isDark, colors });
      }
    } catch {
      // Use default (dark) on error
    }
  },

  setMode: async (mode: ThemeMode) => {
    const { systemScheme } = get();
    const { isDark, colors } = resolveColors(mode, systemScheme);
    set({ mode, isDark, colors });
    try {
      await storage.setItem(THEME_KEY, mode);
    } catch {
      // Persist failed — preference will reset next launch
    }
  },

  setSystemScheme: (scheme: 'light' | 'dark') => {
    const { mode } = get();
    const { isDark, colors } = resolveColors(mode, scheme);
    set({ systemScheme: scheme, isDark, colors });
  },
}));
