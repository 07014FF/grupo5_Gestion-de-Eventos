import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AdminGradients, AdminSpacing, AdminFontSizes, Shadows, Spacing, BorderRadius, Colors, AdminEffects, AdminColors } from '@/constants/theme';

interface AdminHeroHeaderProps {
  adminName?: string;
  todayRevenue?: number;
  revenueChange?: number;
}

export const AdminHeroHeader: React.FC<AdminHeroHeaderProps> = ({
  adminName = 'Administrador',
  todayRevenue = 0,
  revenueChange = 0,
}) => {

  return (
    <LinearGradient
      colors={AdminGradients.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SUPERADMIN</Text>
          </View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Bienvenido, {adminName}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsContent}>
            <Text style={styles.statsLabel}>Ingresos del Día</Text>
            <Text style={styles.statsValue}>
              S/ {todayRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </Text>
            <View style={styles.changeContainer}>
              <Text style={[styles.changeText, revenueChange >= 0 ? styles.positive : styles.negative]}>
                {revenueChange >= 0 ? '▲' : '▼'} {Math.abs(revenueChange).toFixed(1)}% vs ayer
              </Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    height: AdminSpacing.heroHeight,
    paddingTop: 60, // More space for status bar
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    justifyContent: 'flex-end',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerSection: {
    flex: 1,
  },
  titleContainer: {},
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    color: AdminColors.headingPrimary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: AdminFontSizes.heroTitle,
    fontWeight: '900',
    color: AdminColors.headingPrimary,
    lineHeight: 36,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: AdminFontSizes.heroSubtitle,
    color: AdminColors.headingSecondary,
    fontWeight: '500',
  },
  statsCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...AdminEffects.glassmorphism,
    ...Shadows.sm,
  },
  statsContent: {
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 12,
    color: AdminColors.headingSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AdminColors.headingPrimary,
    lineHeight: 28,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  positive: {
    color: Colors.light.primaryLight,
  },
  negative: {
    color: '#FF8A8A',
  },
});
