import { Stack } from 'expo-router';
import { useMemo } from 'react';

import { useThemeColors } from '@/hooks/useThemeColors';

export default function AdminLayout() {
  const palette = useThemeColors();
  const headerStyle = useMemo(
    () => ({
      headerStyle: {
        backgroundColor: palette.background,
      },
      headerTintColor: palette.text,
      headerTitleStyle: {
        fontWeight: 'bold' as const,
        color: palette.text,
      },
    }),
    [palette],
  );

  return (
    <Stack
      screenOptions={headerStyle}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Panel de Administración',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="create-event"
        options={{
          title: 'Crear Evento',
          presentation: 'modal',
        }}
      />

    </Stack>
  );
}
