import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1A1A1A',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
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
      <Stack.Screen
        name="edit-event"
        options={{
          title: 'Editar Evento',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
