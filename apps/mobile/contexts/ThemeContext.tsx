import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryLight: string;
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
}

interface ThemeContextType {
  isDark: boolean;
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const lightColors: ThemeColors = {
  background: Colors.background,
  card: Colors.card,
  text: Colors.text,
  textSecondary: Colors.textSecondary,
  border: Colors.gray200,
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  success: Colors.success,
  successLight: Colors.successLight,
  danger: Colors.danger,
  dangerLight: Colors.dangerLight,
  warning: Colors.warning,
  warningLight: Colors.warningLight,
};

const darkColors: ThemeColors = {
  background: Colors.backgroundDark,
  card: Colors.cardDark,
  text: Colors.textDark,
  textSecondary: Colors.textSecondaryDark,
  border: Colors.gray700,
  primary: Colors.primary,
  primaryLight: Colors.primaryDark,
  success: Colors.success,
  successLight: Colors.successDark,
  danger: Colors.danger,
  dangerLight: Colors.dangerDark,
  warning: Colors.warning,
  warningLight: Colors.warning,
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = '@app_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        // Fallback to system
      } finally {
        setIsLoaded(true);
      }
    };
    loadThemePreference();
  }, []);

  // Determine actual dark mode state
  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  // Get appropriate colors based on theme
  const colors = isDark ? darkColors : lightColors;

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      // Silent fail
    }
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        themeMode,
        colors,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export type { ThemeColors, ThemeMode };
