import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';

export const useThemeColors = () => {
  const { isDark } = useTheme();

  return useMemo(() => {
    return isDark ? Colors.dark : Colors.light;
  }, [isDark]);
};
