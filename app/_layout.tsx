import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

// Configurar QueryClient con opciones optimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cachear datos por 5 minutos por defecto
      gcTime: 1000 * 60 * 5,
      // Mantener datos en caché mientras están en uso
      staleTime: 1000 * 60 * 2,
      // Reintentar automáticamente en caso de error
      retry: 1,
      // No refrescar automáticamente al volver a la ventana (móvil)
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Reintentar mutaciones fallidas una vez
      retry: 1,
    },
  },
});

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const { isDark } = useTheme();

  // Custom theme based on your Colors configuration
  const customLightTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: Colors.light.primary,
        background: Colors.light.background,
        card: Colors.light.surface,
        text: Colors.light.text,
        border: Colors.light.border,
      },
    }),
    []
  );

  const customDarkTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: Colors.dark.primary,
        background: Colors.dark.background,
        card: Colors.dark.surface,
        text: Colors.dark.text,
        border: Colors.dark.border,
      },
    }),
    []
  );

  const navTheme = isDark ? customDarkTheme : customLightTheme;

  return (
    <NavThemeProvider value={navTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="login-modal" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="forgot-password" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="reset-password" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="event-detail" options={{ headerShown: false }} />
              <Stack.Screen name="purchase" options={{ headerShown: false }} />
              <Stack.Screen name="qr-validation" options={{ headerShown: false }} />
              <Stack.Screen name="reports" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style={isDark ? "light" : "dark"} />
          </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
