import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '@/constants/theme';

// Ocultar header
export const options = {
  headerShown: false,
};

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconBadge}>
          <Ionicons name="sparkles-outline" size={28} color={Colors.dark.primary} />
        </View>

        <ThemedText type="title" style={styles.title}>
          Centro de Acciones Rápidas
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Gestiona tus eventos recientes, comparte accesos y revisa los reportes en segundos.
        </ThemedText>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="share-outline" size={20} color={Colors.dark.primary} />
            <Text style={styles.quickActionLabel}>Compartir QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="pie-chart-outline" size={20} color={Colors.dark.primary} />
            <Text style={styles.quickActionLabel}>Ver reportes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="create-outline" size={20} color={Colors.dark.primary} />
            <Text style={styles.quickActionLabel}>Editar evento</Text>
          </TouchableOpacity>
        </View>

        <Link href="/(tabs)" asChild>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.88}>
            <Ionicons name="calendar-outline" size={20} color={Colors.dark.textLight} />
            <Text style={styles.primaryButtonText}>Ir a eventos</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.dark.background,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadows.lg,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(0, 208, 132, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: FontSizes.md,
    lineHeight: 22,
    color: Colors.dark.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.dark.surface,
    ...Shadows.sm,
  },
  quickActionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
    ...Shadows.md,
  },
  primaryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.dark.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
