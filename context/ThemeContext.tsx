import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { Colors } from '@/constants/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';
const getSystemTheme = (): ThemeMode => (Appearance.getColorScheme() === 'light' ? 'light' : 'dark');

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(getSystemTheme());
  const [hasStoredPreference, setHasStoredPreference] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          if (isMounted) {
            setTheme(savedTheme);
            setHasStoredPreference(true);
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadThemePreference();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hasStoredPreference) {
      return;
    }

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const nextTheme: ThemeMode = colorScheme === 'light' ? 'light' : 'dark';
      setTheme(nextTheme);
    });

    return () => subscription.remove();
  }, [hasStoredPreference]);

  useEffect(() => {
    const palette = theme === 'dark' ? Colors.dark : Colors.light;
    const backgroundColor = palette.background;

    SystemUI.setBackgroundColorAsync(backgroundColor).catch((error) => {
      console.warn('Error setting system UI background color:', error);
    });
  }, [theme]);

  const toggleTheme = async () => {
    try {
      const newTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      setHasStoredPreference(true);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
