import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Badge } from '@/components/ui';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';

// Ocultar header
export const options = {
  headerShown: false,
};


// Datos simulados de reportes
const EVENTS_DATA = [
  {
    id: '1',
    title: 'Festival de Jazz 2024',
    date: '2024-03-15',
    location: 'Centro Cultural',
    totalTickets: 500,
    soldTickets: 387,
    attendedTickets: 342,
    revenue: 19350000,
    status: 'completed',
  },
  {
    id: '2',
    title: 'Obra: Romeo y Julieta',
    date: '2024-03-20',
    location: 'Teatro Municipal',
    totalTickets: 200,
    soldTickets: 180,
    attendedTickets: 165,
    revenue: 6300000,
    status: 'completed',
  },
  {
    id: '3',
    title: 'Concierto Sinfónico',
    date: '2024-03-18',
    location: 'Auditorio Nacional',
    totalTickets: 800,
    soldTickets: 800,
    attendedTickets: 756,
    revenue: 48000000,
    status: 'completed',
  },
  {
    id: '4',
    title: 'Exposición de Arte Moderno',
    date: '2024-03-25',
    location: 'Museo Nacional',
    totalTickets: 150,
    soldTickets: 89,
    attendedTickets: 0,
    revenue: 2225000,
    status: 'upcoming',
  },
];

const ATTENDANCE_BY_HOUR = [
  { hour: '18:00', count: 45 },
  { hour: '18:30', count: 89 },
  { hour: '19:00', count: 156 },
  { hour: '19:30', count: 234 },
  { hour: '20:00', count: 287 },
  { hour: '20:30', count: 298 },
  { hour: '21:00', count: 312 },
];

export default function ReportsScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const calculateTotals = () => {
    const completedEvents = EVENTS_DATA.filter(event => event.status === 'completed');
    return {
      totalEvents: completedEvents.length,
      totalRevenue: completedEvents.reduce((sum, event) => sum + event.revenue, 0),
      totalSold: completedEvents.reduce((sum, event) => sum + event.soldTickets, 0),
      totalAttended: completedEvents.reduce((sum, event) => sum + event.attendedTickets, 0),
    };
  };

  const getAttendanceRate = (event: typeof EVENTS_DATA[0]) => {
    if (event.soldTickets === 0) return 0;
    return Math.round((event.attendedTickets / event.soldTickets) * 100);
  };

  const getSalesRate = (event: typeof EVENTS_DATA[0]) => {
    return Math.round((event.soldTickets / event.totalTickets) * 100);
  };

  const totals = calculateTotals();

  const renderEventReport = ({ item }: { item: typeof EVENTS_DATA[0] }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => setSelectedEvent(selectedEvent === item.id ? null : item.id)}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDate}>{item.date} - {item.location}</Text>
        </View>
        <Badge
          text={item.status === 'completed' ? 'Finalizado' : 'Próximo'}
          variant={item.status === 'completed' ? 'success' : 'warning'}
          size="small"
        />
      </View>

      <View style={styles.eventMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{item.soldTickets}/{item.totalTickets}</Text>
          <Text style={styles.metricLabel}>Vendidas</Text>
          <Text style={styles.metricPercentage}>{getSalesRate(item)}%</Text>
        </View>

        {item.status === 'completed' && (
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.attendedTickets}</Text>
            <Text style={styles.metricLabel}>Asistieron</Text>
            <Text style={styles.metricPercentage}>{getAttendanceRate(item)}%</Text>
          </View>
        )}

        <View style={styles.metric}>
          <Text style={styles.metricValue}>${(item.revenue / 1000000).toFixed(1)}M</Text>
          <Text style={styles.metricLabel}>Ingresos</Text>
        </View>
      </View>

      {selectedEvent === item.id && item.status === 'completed' && (
        <View style={styles.expandedDetails}>
          <Text style={styles.detailsTitle}>Asistencia por Hora</Text>
          <View style={styles.attendanceChart}>
            {ATTENDANCE_BY_HOUR.map((data, index) => (
              <View key={data.hour} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (data.count / Math.max(...ATTENDANCE_BY_HOUR.map(d => d.count))) * 60,
                      backgroundColor: Colors.light.primary,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{data.hour}</Text>
                <Text style={styles.barValue}>{data.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.light.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes de Asistencia</Text>
        <TouchableOpacity>
          <Ionicons name="download-outline" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['week', 'month', 'quarter', 'year'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive
                ]}>
                  {period === 'week' ? 'Semana' :
                   period === 'month' ? 'Mes' :
                   period === 'quarter' ? 'Trimestre' : 'Año'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Ionicons name="calendar-outline" size={24} color={Colors.light.primary} />
              <Text style={styles.summaryValue}>{totals.totalEvents}</Text>
              <Text style={styles.summaryLabel}>Eventos</Text>
            </View>

            <View style={styles.summaryCard}>
              <Ionicons name="ticket-outline" size={24} color={Colors.light.accent} />
              <Text style={styles.summaryValue}>{totals.totalSold.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Entradas Vendidas</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Ionicons name="people-outline" size={24} color={Colors.light.success} />
              <Text style={styles.summaryValue}>{totals.totalAttended.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Asistentes</Text>
            </View>

            <View style={styles.summaryCard}>
              <Ionicons name="cash-outline" size={24} color={Colors.light.warning} />
              <Text style={styles.summaryValue}>
                ${(totals.totalRevenue / 1000000).toFixed(1)}M
              </Text>
              <Text style={styles.summaryLabel}>Ingresos</Text>
            </View>
          </View>
        </View>

        {/* Overall Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tasa de Asistencia Promedio</Text>
              <Text style={styles.statValue}>
                {Math.round((totals.totalAttended / totals.totalSold) * 100)}%
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tasa de Ventas Promedio</Text>
              <Text style={styles.statValue}>
                {Math.round((totals.totalSold / (EVENTS_DATA.length * 400)) * 100)}%
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Ingreso Promedio por Evento</Text>
              <Text style={styles.statValue}>
                ${(totals.totalRevenue / totals.totalEvents / 1000000).toFixed(1)}M
              </Text>
            </View>
          </View>
        </View>

        {/* Events List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eventos por Período</Text>
          <FlatList
            data={EVENTS_DATA}
            renderItem={renderEventReport}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exportar Reportes</Text>
          <View style={styles.exportContainer}>
            <Button
              title="Exportar PDF"
              variant="outline"
              onPress={() => console.log('Export PDF')}
              style={styles.exportButton}
            />
            <Button
              title="Exportar Excel"
              variant="outline"
              onPress={() => console.log('Export Excel')}
              style={styles.exportButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  periodButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.light.backgroundSecondary,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  periodButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  periodButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  periodButtonTextActive: {
    color: Colors.light.textLight,
  },
  summaryContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  summaryValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  statsContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  statValue: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  eventCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.xs / 2,
  },
  eventDate: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  eventMetrics: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
  },
  metricLabel: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs / 2,
  },
  metricPercentage: {
    fontSize: FontSizes.xs,
    color: Colors.light.primary,
    fontWeight: '600',
    marginTop: Spacing.xs / 2,
  },
  expandedDetails: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  detailsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  attendanceChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    paddingVertical: Spacing.md,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  barLabel: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs / 2,
  },
  barValue: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.light.text,
  },
  separator: {
    height: Spacing.md,
  },
  exportContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  exportButton: {
    flex: 1,
  },
});