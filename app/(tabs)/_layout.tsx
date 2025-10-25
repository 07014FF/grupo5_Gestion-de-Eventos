import { Link, Tabs } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

function AuthButton() {
  const { user, logout } = useAuth();

  if (user) {
    return (
      <Pressable onPress={logout} style={{ marginRight: 16 }}>
        <ThemedText>Logout</ThemedText>
      </Pressable>
    );
  }

  return (
    <Link href="/login-modal" asChild>
      <Pressable style={{ marginRight: 16 }}>
        <ThemedText>Login</ThemedText>
      </Pressable>
    </Link>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <Tabs
      screenOptions={{
        // Ícono activo: verde claro (#00D084)
        // Ícono inactivo: gris oscuro
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
        tabBarInactiveTintColor: '#94A3B8',
        // headerShown false para ocultar el header en el home
        headerShown: false,
        tabBarButton: HapticTab,
        headerRight: () => <AuthButton />,
        // Configuración de la barra de navegación inferior con tema oscuro
        tabBarStyle: {
          backgroundColor: '#2A2A2A',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        // Animaciones suaves para transiciones entre tabs
        animation: 'shift',
        // Transición suave al cambiar de pantalla
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="my-tickets"
        options={{
          title: 'Mis Entradas',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="ticket" color={color} />,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: 'QR',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="qrcode" color={color} />,
          href: isAdmin ? '/qr' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
