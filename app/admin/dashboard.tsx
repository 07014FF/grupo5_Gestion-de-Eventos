import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, AdminGradients, AdminSpacing, AdminFontSizes, Shadows, AdminEffects, AdminColors } from '@/constants/theme';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { getSalesByCategory, getNewUsersOverTime, getTicketValidationStatus, SalesByCategory, NewUsersData, TicketValidationData } from '@/services/analytics.service';
import { ReportService } from '@/services/report.service';
import { AdminHeroHeader } from '@/components/admin/AdminHeroHeader';
import { StatCardPremium } from '@/components/admin/StatCardPremium';
import { LinearGradient } from 'expo-linear-gradient';

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  pendingValidations: number;
  todaysSales: number;
}

interface ChartData {
  weeklyRevenue: number[];
  eventTickets: {
    labels: string[];
    data: number[];
  };
}

interface RecentPurchase {
  id: string;
  event_title: string;
  user_name: string;
  total_amount: number;
  created_at: string;
  payment_status: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    pendingValidations: 0,
    todaysSales: 0,
  });
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    weeklyRevenue: [0, 0, 0, 0, 0, 0, 0],
    eventTickets: {
      labels: ['Cargando...'],
      data: [0],
    },
  });
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
  const [newUsersData, setNewUsersData] = useState<NewUsersData>({ labels: [], datasets: [{ data: [] }] });
  const [ticketValidationData, setTicketValidationData] = useState<TicketValidationData[]>([]);

  const checkAdminAccess = useCallback(async () => {
    if (!user) {
      Alert.alert('Acceso Denegado', 'Debes iniciar sesión.');
      router.replace('/');
      return;
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      Alert.alert(
        'Acceso Denegado',
        'No tienes permisos para acceder a esta sección.'
      );
      router.replace('/');
    }
  }, [router, user]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Get total events
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Get active events
      const { count: activeEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total tickets sold
      const { count: totalTicketsSold } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true });

      // Get total revenue
      const { data: purchases } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('payment_status', 'completed');

      const totalRevenue = purchases?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

      // Get pending validations (active tickets)
      const { count: pendingValidations } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get today's sales
      const today = new Date().toISOString().split('T')[0];
      const { data: todayPurchases } = await supabase
        .from('purchases')
        .select('total_amount')
        .gte('created_at', `${today}T00:00:00`)
        .eq('payment_status', 'completed');

      const todaysSales = todayPurchases?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

      // Get recent purchases
      const { data: recentData } = await supabase
        .from('purchases')
        .select(`
          id,
          total_amount,
          user_name,
          payment_status,
          created_at,
          events (title)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedPurchases = recentData?.map(p => ({
        id: p.id,
        event_title: (p.events as any)?.title || 'Evento desconocido',
        user_name: p.user_name,
        total_amount: p.total_amount,
        created_at: p.created_at,
        payment_status: p.payment_status,
      })) || [];

      setStats({
        totalEvents: totalEvents || 0,
        activeEvents: activeEvents || 0,
        totalTicketsSold: totalTicketsSold || 0,
        totalRevenue,
        pendingValidations: pendingValidations || 0,
        todaysSales,
      });

      setRecentPurchases(formattedPurchases);

      // Get weekly revenue data (last 7 days)
      const weeklyRevenue = await getWeeklyRevenue();

      // Get top events by tickets sold
      const topEvents = await getTopEventsByTickets();

      setChartData({
        weeklyRevenue,
        eventTickets: topEvents,
      });

      const salesByCategoryData = await getSalesByCategory();
      setSalesByCategory(salesByCategoryData);

      const newUsersData = await getNewUsersOverTime();
      setNewUsersData(newUsersData);

      const ticketValidationData = await getTicketValidationStatus();
      setTicketValidationData(ticketValidationData);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar el dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkAdminAccess();
    loadDashboardData();
  }, [checkAdminAccess, loadDashboardData]);

  // Get revenue for last 7 days
  const getWeeklyRevenue = async (): Promise<number[]> => {
    try {
      const revenue: number[] = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const { data } = await supabase
          .from('purchases')
          .select('total_amount')
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`)
          .eq('payment_status', 'completed');

        const dayRevenue = data?.reduce((sum, p) => sum + p.total_amount, 0) || 0;
        revenue.push(dayRevenue);
      }

      return revenue;
    } catch (error) {
      console.error('Error getting weekly revenue:', error);
      return [0, 0, 0, 0, 0, 0, 0];
    }
  };

  // Get top 5 events by tickets sold
  const getTopEventsByTickets = async (): Promise<{ labels: string[]; data: number[] }> => {
    try {
      const { data: events } = await supabase
        .from('events')
        .select(`
          id,
          title,
          tickets (id)
        `)
        .eq('status', 'active')
        .limit(5);

      if (!events || events.length === 0) {
        return {
          labels: ['Sin eventos'],
          data: [0],
        };
      }

      const eventData = events.map(event => ({
        title: event.title.length > 10 ? event.title.substring(0, 10) + '...' : event.title,
        count: (event.tickets as any[])?.length || 0,
      }));

      // Sort by ticket count
      eventData.sort((a, b) => b.count - a.count);

      return {
        labels: eventData.map(e => e.title),
        data: eventData.map(e => e.count),
      };
    } catch (error) {
      console.error('Error getting top events:', error);
      return {
        labels: ['Error'],
        data: [0],
      };
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleExportPDF = async () => {
    try {
      await ReportService.exportToPDF(stats, recentPurchases, chartData.weeklyRevenue);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte');
    }
  };

  const handleExportCSV = async () => {
    try {
      await ReportService.exportToCSV(recentPurchases);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte');
    }
  };

  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={false} />
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </SafeAreaView>
    );
  }

  const todayRevenueChange = stats.todaysSales > 0
    ? ((stats.todaysSales / (stats.totalRevenue / 30)) - 1) * 100
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={false} />

      {/* Hero Header - Optimized height */}
      <AdminHeroHeader
        adminName={user?.email?.split('@')[0] || 'Admin'}
        todayRevenue={stats.todaysSales}
        revenueChange={todayRevenueChange}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.dark.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* === SECTION 1: QUICK ACTIONS === */}
        <View style={styles.sectionContainer}>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/admin/create-event')}
              accessibilityLabel="Crear nuevo evento"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={AdminGradients.actions.create}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="add-circle" size={28} color={Colors.dark.textLight} />
                </View>
                <View style={styles.actionCardContent}>
                  <Text style={styles.actionCardTitle}>Crear Evento</Text>
                  <Text style={styles.actionCardSubtitle}>Nuevo evento</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/qr')}
              accessibilityLabel="Escanear código QR"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={AdminGradients.actions.scan}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="qr-code" size={28} color={Colors.dark.textLight} />
                </View>
                <View style={styles.actionCardContent}>
                  <Text style={styles.actionCardTitle}>Escanear QR</Text>
                  <Text style={styles.actionCardSubtitle}>Validar tickets</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/admin/user-management')}
              accessibilityLabel="Gestionar usuarios"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={AdminGradients.actions.users}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="people" size={28} color={Colors.dark.textLight} />
                </View>
                <View style={styles.actionCardContent}>
                  <Text style={styles.actionCardTitle}>Usuarios</Text>
                  <Text style={styles.actionCardSubtitle}>Gestionar roles</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* === SECTION 2: STATS OVERVIEW === */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Resumen General</Text>

          <View style={styles.statsGrid}>
            {/* Primary Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statHalf}>
                <StatCardPremium
                  icon="📅"
                  title="Eventos Activos"
                  value={stats.activeEvents}
                  change={12}
                  changeLabel="esta semana"
                  gradientColors={AdminGradients.stats.events}
                />
              </View>
              <View style={styles.statHalf}>
                <StatCardPremium
                  icon="🎫"
                  title="Tickets Vendidos"
                  value={stats.totalTicketsSold}
                  change={28}
                  changeLabel="este mes"
                  gradientColors={AdminGradients.stats.tickets}
                />
              </View>
            </View>

            {/* Featured Revenue Stat */}
            <View style={styles.statFull}>
              <StatCardPremium
                icon="💰"
                title="Ingresos Totales"
                value={formatCurrency(stats.totalRevenue)}
                change={15}
                changeLabel="vs mes anterior"
                gradientColors={AdminGradients.stats.revenue}
              />
            </View>

            {/* Secondary Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statHalf}>
                <StatCardPremium
                  icon="⏱️"
                  title="Pendientes"
                  value={stats.pendingValidations}
                  gradientColors={AdminGradients.stats.pending}
                />
              </View>
              <View style={styles.statHalf}>
                <StatCardPremium
                  icon="📊"
                  title="Total Eventos"
                  value={stats.totalEvents}
                  gradientColors={AdminGradients.actions.users}
                />
              </View>
            </View>
          </View>
        </View>

        {/* === SECTION 3: ANALYTICS CHARTS === */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Análisis de Ventas</Text>

          {/* Revenue Trend Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <View style={styles.chartHeaderLeft}>
                <Ionicons name="trending-up" size={22} color={Colors.dark.primary} />
                <Text style={styles.chartTitle}>Ingresos Semanales</Text>
              </View>
              <Text style={styles.chartSubtitle}>Últimos 7 días</Text>
            </View>

            <View style={styles.chartWrapper}>
              <LineChart
                data={{
                  labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                  datasets: [
                    {
                      data: chartData.weeklyRevenue.length > 0
                        ? chartData.weeklyRevenue.map(v => Math.max(v, 1))
                        : [1, 1, 1, 1, 1, 1, 1],
                    },
                  ],
                }}
                width={Dimensions.get('window').width - (Spacing.lg * 2)}
                height={200}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 208, 132, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: Colors.dark.primary,
                    fill: Colors.dark.background,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: 'rgba(255, 255, 255, 0.08)',
                    strokeWidth: 1,
                  },
                }}
                bezier
                style={styles.chart}
                withInnerLines
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines
              />
            </View>
          </View>

          {/* Tickets Distribution Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <View style={styles.chartHeaderLeft}>
                <Ionicons name="bar-chart" size={22} color={Colors.dark.primary} />
                <Text style={styles.chartTitle}>Distribución de Tickets</Text>
              </View>
              <Text style={styles.chartSubtitle}>Top eventos</Text>
            </View>

            <View style={styles.chartWrapper}>
              <BarChart
                data={{
                  labels: chartData.eventTickets.labels,
                  datasets: [
                    {
                      data: chartData.eventTickets.data.length > 0
                        ? chartData.eventTickets.data.map(v => Math.max(v, 1))
                        : [1],
                    },
                  ],
                }}
                width={Dimensions.get('window').width - (Spacing.lg * 2)}
                height={200}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 208, 132, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
                  barPercentage: 0.6,
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: 'rgba(255, 255, 255, 0.08)',
                    strokeWidth: 1,
                  },
                }}
                style={styles.chart}
                withInnerLines
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          </View>
        </View>

        {/* === SECTION 4: RECENT ACTIVITY === */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Actividad Reciente</Text>
              <Text style={styles.sectionSubtitle}>Últimas 10 transacciones</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>Ver Todo</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.dark.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.purchasesList}>
            {recentPurchases.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={Colors.dark.textSecondary} />
                <Text style={styles.emptyStateTitle}>No hay compras recientes</Text>
                <Text style={styles.emptyStateText}>
                  Las transacciones aparecerán aquí
                </Text>
              </View>
            ) : (
              recentPurchases.map((purchase) => (
                <View key={purchase.id} style={styles.purchaseCard}>
                  <View style={styles.purchaseLeft}>
                    <View style={[styles.purchaseIconContainer, { backgroundColor: purchase.payment_status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}]}>
                      <Ionicons
                        name={purchase.payment_status === 'completed' ? 'checkmark-circle' : 'time-outline'}
                        size={24}
                        color={purchase.payment_status === 'completed' ? Colors.dark.success : Colors.dark.warning}
                      />
                    </View>
                    <View style={styles.purchaseInfo}>
                      <Text style={styles.purchaseEvent} numberOfLines={1}>
                        {purchase.event_title}
                      </Text>
                      <Text style={styles.purchaseUser}>{purchase.user_name}</Text>
                      <Text style={styles.purchaseDate}>{formatDate(purchase.created_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.purchaseRight}>
                    <Text style={styles.purchaseAmount}>
                      {formatCurrency(purchase.total_amount)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        purchase.payment_status === 'completed'
                          ? styles.statusCompleted
                          : styles.statusPending,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {purchase.payment_status === 'completed' ? 'Pagado' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* === SECTION 5: EXPORT TOOLS === */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Herramientas de Reporte</Text>

          <View style={styles.exportContainer}>
            <TouchableOpacity
              style={styles.exportCard}
              onPress={handleExportPDF}
              accessibilityLabel="Exportar reporte en PDF"
              accessibilityRole="button"
            >
              <View style={styles.exportIconContainer}>
                <Ionicons name="document-text" size={24} color={Colors.dark.primary} />
              </View>
              <View style={styles.exportInfo}>
                <Text style={styles.exportTitle}>Exportar PDF</Text>
                <Text style={styles.exportSubtitle}>Reporte completo</Text>
              </View>
              <Ionicons name="download-outline" size={20} color={Colors.dark.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportCard}
              onPress={handleExportCSV}
              accessibilityLabel="Exportar reporte en CSV"
              accessibilityRole="button"
            >
              <View style={styles.exportIconContainer}>
                <Ionicons name="grid" size={24} color={Colors.dark.primary} />
              </View>
              <View style={styles.exportInfo}>
                <Text style={styles.exportTitle}>Exportar CSV</Text>
                <Text style={styles.exportSubtitle}>Datos en tabla</Text>
              </View>
              <Ionicons name="download-outline" size={20} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Padding for Tab Navigation */}
        <View style={styles.bottomSpacer} />

        {/* === SECTION 6: ADVANCED ANALYTICS === */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Análisis Avanzado</Text>

          {/* Sales by Category Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <View style={styles.chartHeaderLeft}>
                <Ionicons name="pie-chart" size={22} color={Colors.dark.primary} />
                <Text style={styles.chartTitle}>Ventas por Categoría</Text>
              </View>
            </View>
            <PieChart
              data={salesByCategory}
              width={Dimensions.get('window').width - (Spacing.lg * 2)}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor={"total"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </View>

          {/* New Users Over Time Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <View style={styles.chartHeaderLeft}>
                <Ionicons name="trending-up" size={22} color={Colors.dark.primary} />
                <Text style={styles.chartTitle}>Nuevos Usuarios</Text>
              </View>
              <Text style={styles.chartSubtitle}>Últimos 30 días</Text>
            </View>
            <LineChart
              data={newUsersData}
              width={Dimensions.get('window').width - (Spacing.lg * 2)}
              height={220}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 208, 132, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
              }}
              bezier
            />
          </View>

          {/* Ticket Validation Status Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <View style={styles.chartHeaderLeft}>
                <Ionicons name="checkmark-done-circle" size={22} color={Colors.dark.primary} />
                <Text style={styles.chartTitle}>Estado de Tickets</Text>
              </View>
            </View>
            <PieChart
              data={ticketValidationData}
              width={Dimensions.get('window').width - (Spacing.lg * 2)}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor={"count"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 110,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
  },

  // === SECTION CONTAINER ===
  sectionContainer: {
    marginBottom: AdminSpacing.section,
    marginTop: Spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: AdminFontSizes.sectionTitle,
    fontWeight: '800',
    color: AdminColors.headingPrimary,
    letterSpacing: 0.5,
  },

  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: AdminColors.headingSecondary,
    fontWeight: '500',
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: AdminColors.buttonSecondaryBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: AdminColors.borderMedium,
  },

  viewAllText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.dark.primary,
  },

  // === QUICK ACTIONS ===
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  actionCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },

  actionCardGradient: {
    padding: Spacing.lg,
    minHeight: 150,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  actionCardContent: {},

  actionCardTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: AdminColors.headingPrimary,
    marginBottom: Spacing.xs,
  },

  actionCardSubtitle: {
    fontSize: FontSizes.md,
    color: AdminColors.headingPrimary,
    fontWeight: '600',
  },

  // === STATS GRID ===
  statsGrid: {
    gap: AdminSpacing.cardGroup,
  },

  statsRow: {
    flexDirection: 'row',
    gap: AdminSpacing.cardGroup,
  },

  statHalf: {
    flex: 1,
  },

  statFull: {
    width: '100%',
  },

  // === CHARTS ===
  chartContainer: {
    backgroundColor: AdminColors.cardBackground,
    borderRadius: BorderRadius.xl,
    padding: AdminSpacing.cardInternal,
    marginBottom: AdminSpacing.section,
    borderWidth: 1,
    borderColor: AdminColors.borderMedium,
    ...Shadows.md,
  },

  chartHeader: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  chartTitle: {
    fontSize: AdminFontSizes.cardTitle,
    fontWeight: '800',
    color: AdminColors.headingPrimary,
  },

  chartSubtitle: {
    fontSize: FontSizes.sm,
    color: AdminColors.bodyPrimary,
    fontWeight: '600',
  },

  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
  },

  chart: {
    borderRadius: BorderRadius.lg,
    marginLeft: -Spacing.lg,
  },

  // === RECENT PURCHASES ===
  purchasesList: {
    gap: Spacing.md,
  },

  purchaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: AdminColors.cardBackground,
    borderWidth: 1,
    borderColor: AdminColors.borderSubtle,
  },

  purchaseLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginRight: Spacing.md,
  },

  purchaseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },

  purchaseInfo: {
    flex: 1,
  },

  purchaseEvent: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: AdminColors.headingPrimary,
    marginBottom: 2,
  },

  purchaseUser: {
    fontSize: FontSizes.sm,
    color: AdminColors.bodyPrimary,
    marginBottom: 4,
  },

  purchaseDate: {
    fontSize: FontSizes.xs,
    color: AdminColors.bodySecondary,
  },

  purchaseRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },

  purchaseAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.dark.primary,
  },

  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
  },

  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },

  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },

  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.dark.textLight,
    textTransform: 'uppercase',
  },

  // === EMPTY STATE ===
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: AdminColors.cardBackground,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: AdminColors.borderSubtle,
  },

  emptyStateTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: AdminColors.headingPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },

  emptyStateText: {
    fontSize: FontSizes.md,
    color: AdminColors.bodyPrimary,
    textAlign: 'center',
  },

  // === EXPORT TOOLS ===
  exportContainer: {
    gap: Spacing.md,
  },

  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: AdminColors.cardBackground,
    borderWidth: 1,
    borderColor: AdminColors.borderMedium,
  },

  exportIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  exportInfo: {
    flex: 1,
  },

  exportTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: AdminColors.headingPrimary,
    marginBottom: 2,
  },

  exportSubtitle: {
    fontSize: FontSizes.md,
    color: AdminColors.bodyPrimary,
  },

  // === SPACING ===
  bottomSpacer: {
    height: Spacing.lg,
  },
});
