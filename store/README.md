# Zustand Store

Este proyecto usa **Zustand** para el manejo del estado global con persistencia usando **AsyncStorage**.

## Uso

### Importar el store

```typescript
import { useAppStore } from '@/store/useAppStore';
```

### Usar en componentes

```typescript
// Leer valores del store
const theme = useAppStore((state) => state.settings.theme);
const favoriteEvents = useAppStore((state) => state.favoriteEvents);

// Usar acciones
const setTheme = useAppStore((state) => state.setTheme);
const toggleFavorite = useAppStore((state) => state.toggleFavorite);

// En el componente
<Button onPress={() => setTheme('dark')}>
  Cambiar a modo oscuro
</Button>

<Button onPress={() => toggleFavorite(eventId)}>
  {useAppStore((state) => state.isFavorite(eventId))
    ? 'Quitar de favoritos'
    : 'Agregar a favoritos'}
</Button>
```

### Ejemplo completo

```typescript
import React from 'react';
import { View, Text, Switch, Button } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsScreen() {
  const { theme, notifications, language } = useAppStore((state) => state.settings);
  const setTheme = useAppStore((state) => state.setTheme);
  const setNotifications = useAppStore((state) => state.setNotifications);
  const recentSearches = useAppStore((state) => state.recentSearches);
  const clearRecentSearches = useAppStore((state) => state.clearRecentSearches);

  return (
    <View>
      <Text>Tema: {theme}</Text>
      <Button onPress={() => setTheme('dark')}>Modo Oscuro</Button>
      <Button onPress={() => setTheme('light')}>Modo Claro</Button>

      <Text>Notificaciones</Text>
      <Switch
        value={notifications}
        onValueChange={setNotifications}
      />

      <Text>Búsquedas Recientes:</Text>
      {recentSearches.map((search) => (
        <Text key={search}>{search}</Text>
      ))}
      <Button onPress={clearRecentSearches}>Limpiar</Button>
    </View>
  );
}
```

## Características

- **Persistencia automática**: Los datos se guardan automáticamente en AsyncStorage
- **Type-safe**: Totalmente tipado con TypeScript
- **Selectores**: Solo re-renderiza cuando los datos seleccionados cambian
- **Acciones**: Funciones organizadas para modificar el estado
- **Reset**: Función para resetear todo el store al estado inicial

## Estado Global

### Settings
- `theme`: 'light' | 'dark' | 'auto'
- `notifications`: boolean
- `language`: 'es' | 'en'

### User Preferences
- `recentSearches`: string[] - Últimas 10 búsquedas
- `favoriteEvents`: string[] - IDs de eventos favoritos

### Cart (opcional)
- `cartItems`: Array<{ eventId: string; quantity: number }>
