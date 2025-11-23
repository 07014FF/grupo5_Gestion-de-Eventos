/**
 * Statistics Screen - Gráficos y estadísticas visuales
 * Admin: Solo estadísticas de sus eventos
 * Super Admin: Estadísticas globales
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { AdminService, EventStatistics, SalesReport } from '@/services/admin.service';
import { ReportService } from '@/services/report.service';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 200;

export default function StatisticsScreen() {
  const { user } = useAuth();
  const [eventStats, setEventStats] = useState<EventStatistics[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

  const isSuperAdmin = user?.role === 'super_admin';

  const loadStatistics = async () => {
    if (!user) return;

    try {
      // Cargar estadísticas de eventos
      const statsResult = await AdminService.getEventStatistics(user.id, user.role);
      if (statsResult.success) {
        setEventStats(statsResult.data);
      }

      // Cargar reporte de ventas
      let startDate: string | undefined;
      const endDate = new Date().toISOString();

      if (selectedPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString();
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString();
      }

      const salesResult = await AdminService.getSalesReport(
        user.id,
        user.role,
        startDate,
        endDate
      );

      if (salesResult.success) {
        setSalesReport(salesResult.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [user, selectedPeriod]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  const handleExportComplete = async () => {
    if (!user) return;

    const result = await ReportService.exportCompleteReportCSV(user.id, user.role);

    if (result.success) {
      Alert.alert('Éxito', 'Reporte completo exportado correctamente');
    } else {
      Alert.alert('Error', result.error?.message || 'No se pudo exportar el reporte');
    }
  };

  const handleExportSales = async () => {
    if (!user) return;

    let startDate: string | undefined;
    const endDate = new Date().toISOString();

    if (selectedPeriod === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString();
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString();
    }

    const result = await ReportService.exportSalesReportCSV(user.id, user.role, startDate, endDate);

    if (result.success) {
      Alert.alert('Éxito', 'Reporte de ventas exportado correctamente');
    } else {
      Alert.alert('Error', result.error?.message || 'No se pudo exportar el reporte');
    }
  };

  const handleExportStats = async () => {
    if (!user) return;

    const result = await ReportService.exportEventStatisticsCSV(user.id, user.role);

    if (result.success) {
      Alert.alert('Éxito', 'Estadísticas de eventos exportadas correctamente');
    } else {
      Alert.alert('Error', result.error?.message || 'No se pudo exportar las estadísticas');
    }
  };

  // Calcular totales
  const totalRevenue = salesReport.reduce((sum, s) => sum + s.revenue, 0);
  const totalTicketsSold = salesReport.reduce((sum, s) => sum + s.ticketsSold, 0);
  const totalValidated = eventStats.reduce((sum, e) => sum + e.validatedTickets, 0);
  const avgValidationRate =
    eventStats.length > 0
      ? eventStats.reduce((sum, e) => sum + e.validationRate, 0) / eventStats.length
      : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Estadísticas y Reportes</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'week' && styles.periodButtonTextActive,
              ]}
            >
              Semana
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'month' && styles.periodButtonTextActive,
              ]}
            >
              Mes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'all' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('all')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'all' && styles.periodButtonTextActive,
              ]}
            >
              Todo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Export Buttons */}
        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>📤 Exportar Reportes</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity style={styles.exportButton} onPress={handleExportComplete}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={styles.exportButtonText}>Completo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton} onPress={handleExportSales}>
              <Ionicons name="receipt" size={20} color={colors.primary} />
              <Text style={styles.exportButtonText}>Ventas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton} onPress={handleExportStats}>
              <Ionicons name="bar-chart" size={20} color={colors.primary} />
              <Text style={styles.exportButtonText}>Estadísticas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="cash"
            label="Ingresos Totales"
            value={`S/ ${totalRevenue.toFixed(2)}`}
            color="#FFD93D"
          />
          <SummaryCard
            icon="ticket"
            label="Tickets Vendidos"
            value={totalTicketsSold.toString()}
            color="#4ECDC4"
          />
          <SummaryCard
            icon="checkmark-circle"
            label="Tickets Validados"
            value={totalValidated.toString()}
            color="#95E1D3"
          />
          <SummaryCard
            icon="trending-up"
            label="Tasa de Validación"
            value={`${avgValidationRate.toFixed(1)}%`}
            color="#FF6B6B"
          />
        </View>

        {/* Revenue Bar Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>💰 Ingresos por Evento</Text>
          <View style={styles.chartContainer}>
            {eventStats.length > 0 ? (
              <RevenueBarChart data={eventStats} />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyChartText}>No hay datos disponibles</Text>
              </View>
            )}
          </View>
        </View>

        {/* Validation Rate Progress Bars */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>🎫 Tasa de Validación por Evento</Text>
          <View style={styles.progressContainer}>
            {eventStats.length > 0 ? (
              eventStats.map((event) => (
                <ValidationProgressBar
                  key={event.eventId}
                  title={event.eventTitle}
                  progress={event.validationRate}
                  validated={event.validatedTickets}
                  total={event.totalTicketsSold}
                />
              ))
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="stats-chart-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyChartText}>No hay eventos con ventas</Text>
              </View>
            )}
          </View>
        </View>

        {/* Detailed Event Statistics */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>📈 Detalle por Evento</Text>
          {eventStats.map((event) => (
            <EventStatCard key={event.eventId} event={event} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Summary Card Component
interface SummaryCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function SummaryCard({ icon, label, value, color }: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// Revenue Bar Chart Component
interface RevenueBarChartProps {
  data: EventStatistics[];
}

function RevenueBarChart({ data }: RevenueBarChartProps) {
  const maxRevenue = Math.max(...data.map((e) => e.revenue), 1);

  return (
    <View style={styles.barChart}>
      {data.slice(0, 5).map((event, index) => {
        const barHeight = (event.revenue / maxRevenue) * (CHART_HEIGHT - 40);

        return (
          <View key={event.eventId} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <Text style={styles.barValue}>S/ {event.revenue.toFixed(0)}</Text>
              <LinearGradient
                colors={['#FFD93D', '#FFA500']}
                style={[styles.bar, { height: Math.max(barHeight, 20) }]}
              />
            </View>
            <Text style={styles.barLabel} numberOfLines={2}>
              {event.eventTitle.slice(0, 15)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// Validation Progress Bar Component
interface ValidationProgressBarProps {
  title: string;
  progress: number;
  validated: number;
  total: number;
}

function ValidationProgressBar({ title, progress, validated, total }: ValidationProgressBarProps) {
  const progressWidth = Math.min(progress, 100);
  const progressColor = progress >= 80 ? '#4ECDC4' : progress >= 50 ? '#FFD93D' : '#FF6B6B';

  return (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>{title}</Text>
        <Text style={styles.progressPercent}>{progress.toFixed(1)}%</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressWidth}%`, backgroundColor: progressColor }]} />
      </View>
      <Text style={styles.progressStats}>
        {validated} de {total} tickets validados
      </Text>
    </View>
  );
}

// Event Stat Card Component
interface EventStatCardProps {
  event: EventStatistics;
}

function EventStatCard({ event }: EventStatCardProps) {
  return (
    <View style={styles.eventStatCard}>
      <Text style={styles.eventStatTitle}>{event.eventTitle}</Text>
      <View style={styles.eventStatGrid}>
        <View style={styles.eventStatItem}>
          <Text style={styles.eventStatValue}>{event.totalTicketsSold}</Text>
          <Text style={styles.eventStatLabel}>Vendidos</Text>
        </View>
        <View style={styles.eventStatItem}>
          <Text style={styles.eventStatValue}>S/ {event.revenue.toFixed(2)}</Text>
          <Text style={styles.eventStatLabel}>Ingresos</Text>
        </View>
        <View style={styles.eventStatItem}>
          <Text style={styles.eventStatValue}>{event.validatedTickets}</Text>
          <Text style={styles.eventStatLabel}>Validados</Text>
        </View>
        <View style={styles.eventStatItem}>
          <Text style={styles.eventStatValue}>{event.availableTickets}</Text>
          <Text style={styles.eventStatLabel}>Disponibles</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chartSection: {
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    height: CHART_HEIGHT,
  },
  barChart: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: CHART_HEIGHT - 40,
  },
  bar: {
    width: 40,
    borderRadius: 8,
    marginTop: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    width: 60,
  },
  emptyChart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressContainer: {
    gap: 16,
  },
  progressItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  eventStatCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventStatTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  eventStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventStatItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  eventStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  eventStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  exportSection: {
    padding: 16,
    paddingTop: 0,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
