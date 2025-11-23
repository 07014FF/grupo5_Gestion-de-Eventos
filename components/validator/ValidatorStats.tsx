/**
 * Componente de estadísticas del validador
 * Muestra estadísticas avanzadas en tiempo real
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import type { ValidatorStats as ValidatorStatsType } from '@/types/validator.types';

interface ValidatorStatsProps {
  stats: ValidatorStatsType | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const ValidatorStats: React.FC<ValidatorStatsProps> = ({
  stats,
  isLoading = false,
  onRefresh,
}) => {
  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="stats-chart-outline" size={64} color={Colors.dark.textSecondary} />
        <Text style={styles.emptyText}>No hay estadísticas disponibles</Text>
      </View>
    );
  }

  const capacityPercentage = (stats.totalValidated / stats.totalCapacity) * 100;
  const todayPercentage = (stats.validatedToday / stats.totalCapacity) * 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {/* Evento */}
      <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>{stats.eventTitle}</Text>
        <View style={styles.eventMeta}>
          <Ionicons name="calendar-outline" size={16} color={Colors.dark.textSecondary} />
          <Text style={styles.eventMetaText}>Evento Activo</Text>
        </View>
      </View>

      {/* Estadísticas principales */}
      <View style={styles.mainStatsGrid}>
        {/* Total validados */}
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Ionicons name="checkmark-done-circle" size={32} color={Colors.dark.success} />
          <Text style={styles.statValue}>{stats.totalValidated}</Text>
          <Text style={styles.statLabel}>Total Validados</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(capacityPercentage, 100)}%`, backgroundColor: Colors.dark.success },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {capacityPercentage.toFixed(1)}% de {stats.totalCapacity}
          </Text>
        </View>

        {/* Validados hoy */}
        <View style={[styles.statCard, styles.statCardSecondary]}>
          <Ionicons name="today" size={32} color={Colors.dark.primary} />
          <Text style={styles.statValue}>{stats.validatedToday}</Text>
          <Text style={styles.statLabel}>Validados Hoy</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(todayPercentage, 100)}%`, backgroundColor: Colors.dark.primary },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {todayPercentage.toFixed(1)}% del total
          </Text>
        </View>
      </View>

      {/* Por tipo de entrada */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="ticket" size={20} color={Colors.dark.primary} />
          <Text style={styles.sectionTitle}>Por Tipo de Entrada</Text>
        </View>
        <View style={styles.typeStatsContainer}>
          <View style={styles.typeStatCard}>
            <View style={[styles.typeIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="people" size={24} color={Colors.dark.success} />
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeLabel}>General</Text>
              <Text style={styles.typeValue}>{stats.validatedByType.general}</Text>
            </View>
            <View style={styles.typeProgress}>
              <View
                style={[
                  styles.typeProgressFill,
                  {
                    width: `${
                      (stats.validatedByType.general / stats.totalValidated) * 100 || 0
                    }%`,
                    backgroundColor: Colors.dark.success,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.typeStatCard}>
            <View style={[styles.typeIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Ionicons name="school" size={24} color="#3B82F6" />
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeLabel}>Estudiante</Text>
              <Text style={styles.typeValue}>{stats.validatedByType.student}</Text>
            </View>
            <View style={styles.typeProgress}>
              <View
                style={[
                  styles.typeProgressFill,
                  {
                    width: `${
                      (stats.validatedByType.student / stats.totalValidated) * 100 || 0
                    }%`,
                    backgroundColor: '#3B82F6',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Ingresos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cash" size={20} color={Colors.dark.primary} />
          <Text style={styles.sectionTitle}>Ingresos</Text>
        </View>
        <View style={styles.revenueContainer}>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total</Text>
            <Text style={styles.revenueValue}>S/ {stats.revenue.total.toFixed(2)}</Text>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Hoy</Text>
            <Text style={styles.revenueValue}>S/ {stats.revenue.today.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Validaciones por hora (hoy) */}
      {stats.validatedByHour.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color={Colors.dark.primary} />
            <Text style={styles.sectionTitle}>Actividad por Hora (Hoy)</Text>
          </View>
          <View style={styles.hourlyChart}>
            {stats.validatedByHour.map((hourData, index) => {
              const maxCount = Math.max(...stats.validatedByHour.map((h) => h.count));
              const barHeight = (hourData.count / maxCount) * 100;

              return (
                <View key={index} style={styles.hourlyBar}>
                  <View style={styles.hourlyBarContainer}>
                    <View
                      style={[
                        styles.hourlyBarFill,
                        { height: `${barHeight}%` },
                      ]}
                    >
                      {hourData.count > 0 && (
                        <Text style={styles.hourlyBarValue}>{hourData.count}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.hourlyLabel}>{hourData.hour}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Última validación */}
      {stats.lastValidation && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color={Colors.dark.primary} />
            <Text style={styles.sectionTitle}>Última Validación</Text>
          </View>
          <View style={styles.lastValidationCard}>
            <View style={styles.lastValidationIcon}>
              <Ionicons name="person" size={24} color={Colors.dark.primary} />
            </View>
            <View style={styles.lastValidationInfo}>
              <Text style={styles.lastValidationUser}>{stats.lastValidation.userName}</Text>
              <Text style={styles.lastValidationTime}>
                {new Date(stats.lastValidation.time).toLocaleString('es-PE')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Indicadores adicionales */}
      <View style={styles.indicatorsGrid}>
        <View style={styles.indicator}>
          <View style={[styles.indicatorIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <Ionicons name="trending-up" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.indicatorLabel}>Ritmo</Text>
          <Text style={styles.indicatorValue}>
            {stats.validatedToday > 0 ? `${stats.validatedToday}/día` : '—'}
          </Text>
        </View>

        <View style={styles.indicator}>
          <View style={[styles.indicatorIcon, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
            <Ionicons name="speedometer" size={20} color="#EC4899" />
          </View>
          <Text style={styles.indicatorLabel}>Restantes</Text>
          <Text style={styles.indicatorValue}>
            {Math.max(0, stats.totalCapacity - stats.totalValidated)}
          </Text>
        </View>

        <View style={styles.indicator}>
          <View style={[styles.indicatorIcon, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
            <Ionicons name="calculator" size={20} color="#F97316" />
          </View>
          <Text style={styles.indicatorLabel}>Promedio</Text>
          <Text style={styles.indicatorValue}>
            S/ {stats.totalValidated > 0 ? (stats.revenue.total / stats.totalValidated).toFixed(0) : '0'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary,
  },
  eventTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  eventMetaText: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
  },
  mainStatsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statCardPrimary: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statCardSecondary: {
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 208, 132, 0.3)',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.dark.text,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.dark.border,
    borderRadius: 3,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSizes.xs,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  typeStatsContainer: {
    gap: Spacing.md,
  },
  typeStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  typeValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  typeProgress: {
    width: 60,
    height: 6,
    backgroundColor: Colors.dark.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  typeProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  revenueContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  revenueCard: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  revenueDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
  },
  revenueLabel: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  revenueValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.dark.success,
  },
  hourlyChart: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 150,
  },
  hourlyBar: {
    flex: 1,
    alignItems: 'center',
  },
  hourlyBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  hourlyBarFill: {
    width: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.xs,
    minHeight: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  hourlyBarValue: {
    fontSize: FontSizes.xs,
    color: Colors.dark.white,
    fontWeight: '600',
  },
  hourlyLabel: {
    fontSize: FontSizes.xs,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  lastValidationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  lastValidationIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 208, 132, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastValidationInfo: {
    flex: 1,
  },
  lastValidationUser: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  lastValidationTime: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  indicatorsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  indicator: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  indicatorIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  indicatorLabel: {
    fontSize: FontSizes.xs,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  indicatorValue: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: Spacing.xs,
  },
});
