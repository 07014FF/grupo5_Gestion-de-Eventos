import { AdminHeroHeader } from '@/components/admin/AdminHeroHeader';
import { StatCardPremium } from '@/components/admin/StatCardPremium';
import { AdminColors, AdminFontSizes, AdminGradients, AdminSpacing, BorderRadius, Colors, FontSizes, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getNewUsersOverTime, getSalesByCategory, getTicketValidationStatus, NewUsersData, SalesByCategory, TicketValidationData } from '@/services/analytics.service';
import { ReportService } from '@/services/report.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [lastUpdated, setLastUpdated] = useState<string>('');

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

      setLastUpdated(new Date().toLocaleString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      }));

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
  const averageTicketPrice = stats.totalTicketsSold
    ? stats.totalRevenue / stats.totalTicketsSold
    : 0;
  const validationRate = stats.totalTicketsSold
    ? ((stats.totalTicketsSold - stats.pendingValidations) / stats.totalTicketsSold) * 100
    : 0;
  const activeEventShare = stats.totalEvents
    ? (stats.activeEvents / stats.totalEvents) * 100
    : 0;
  const weeklyMaxRevenue = chartData.weeklyRevenue.length
    ? Math.max(...chartData.weeklyRevenue)
    : 0;
  const weeklyAvgRevenue = chartData.weeklyRevenue.length
    ? chartData.weeklyRevenue.reduce((acc, value) => acc + value, 0) / chartData.weeklyRevenue.length
    : 0;
  const topEventName = chartData.eventTickets.labels?.[0] || 'Sin datos';

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
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Acciones rápidas</Text>
                <Text style={styles.sectionSubtitle}>Coordina eventos, accesos y reportes en segundos</Text>
              </View>
              {!!lastUpdated && (
                <View style={styles.metaPill}>
                  <View style={styles.metaDot} />
                  <Text style={styles.metaPillText}>Actualizado {lastUpdated}</Text>
                </View>
              )}
            </View>

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

              <TouchableOpacity
                style={styles.actionCard}
                onPress={handleExportPDF}
                accessibilityLabel="Exportar panel en PDF"
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={AdminGradients.actions.reports}
                  style={styles.actionCardGradient}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="document-text" size={28} color={Colors.dark.textLight} />
                  </View>
                  <View style={styles.actionCardContent}>
                    <Text style={styles.actionCardTitle}>Reportes</Text>
                    <Text style={styles.actionCardSubtitle}>PDF ejecutivo</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* === SECTION 2: SALES ANALYTICS === */}
        <View style={styles.sectionContainer}>
          <View style={[styles.sectionCard, styles.spaciousCard]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Análisis de ventas</Text>
                <Text style={styles.sectionSubtitle}>Progreso financiero y desempeño por evento</Text>
              </View>
              <View style={styles.legendPill}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Ingresos confirmados</Text>
              </View>
            </View>

            <View style={styles.analyticsGrid}>
              {/* Revenue Trend Chart */}
              <View style={[styles.chartContainer, styles.chartCard]}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartHeaderLeft}>
                    <Ionicons name="trending-up" size={22} color={Colors.dark.primary} />
                    <Text style={styles.chartTitle}>Ingresos Semanales</Text>
                  </View>
                  <Text style={styles.chartSubtitle}>Últimos 7 días</Text>
                </View>

                <View style={[styles.chartWrapper, { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm }]}>
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
                    width={Dimensions.get('window').width - 100}
                    height={180}
                    chartConfig={{
                      backgroundColor: 'transparent',
                      backgroundGradientFrom: 'transparent',
                      backgroundGradientTo: 'transparent',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(0, 208, 132, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.6})`,
                      propsForDots: {
                        r: '5',
                        strokeWidth: '2',
                        stroke: Colors.dark.primary,
                        fill: Colors.dark.background,
                      },
                      propsForBackgroundLines: {
                        strokeWidth: 0,
                      },
                    }}
                    bezier
                    style={{
                      marginVertical: Spacing.xs,
                      borderRadius: BorderRadius.md,
                    }}
                  />
                </View>

                <View style={styles.chartFooter}>
                  <Text style={styles.chartFooterLabel}>Pico semanal: {formatCurrency(weeklyMaxRevenue)}</Text>
                  <Text style={styles.chartFooterLabel}>Promedio: {formatCurrency(weeklyAvgRevenue)}</Text>
                </View>
              </View>

              {/* Top Events Chart */}
              <View style={[styles.chartContainer, styles.chartCard]}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartHeaderLeft}>
                    <Ionicons name="bar-chart" size={22} color={Colors.dark.primary} />
                    <Text style={styles.chartTitle}>Eventos Destacados</Text>
                  </View>
                  <Text style={styles.chartSubtitle}>Top por tickets vendidos</Text>
                </View>
                <View style={[styles.chartWrapper, { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm }]}>
                  <BarChart
                    data={{
                      labels: chartData.eventTickets.labels,
                      datasets: [{ data: chartData.eventTickets.data }],
                    }}
                    width={Dimensions.get('window').width - 100}
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero
                    showValuesOnTopOfBars
                    chartConfig={{
                      backgroundColor: 'transparent',
                      backgroundGradientFrom: 'transparent',
                      backgroundGradientTo: 'transparent',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(20, 184, 166, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.6})`,
                      barPercentage: 0.5,
                      propsForBackgroundLines: {
                        strokeWidth: 0,
                      },
                    }}
                    style={{
                      marginVertical: Spacing.xs,
                      borderRadius: BorderRadius.md,
                    }}
                  />
                </View>
                <View style={styles.chartFooter}>
                  <Text style={styles.chartFooterLabel}>Mejor evento: {topEventName}</Text>
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => router.push('/admin/create-event')}
                  >
                    <Text style={styles.viewAllText}>Optimizar oferta</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.dark.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* === SECTION 2: STATS OVERVIEW === */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Resumen general</Text>
                <Text style={styles.sectionSubtitle}>Estado de operaciones y salud comercial</Text>
              </View>
              <TouchableOpacity
                style={styles.sectionCTA}
                onPress={handleExportCSV}
              >
                <Ionicons name="download-outline" size={16} color={Colors.dark.textLight} />
                <Text style={styles.sectionCTAText}>Descargar CSV</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricBanner}>
              <View>
                <Text style={styles.metricBannerLabel}>Ingresos acumulados</Text>
                <Text style={styles.metricBannerValue}>{formatCurrency(stats.totalRevenue)}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View>
                <Text style={styles.metricBannerLabel}>Ventas del día</Text>
                <Text style={styles.metricBannerValue}>{formatCurrency(stats.todaysSales)}</Text>
              </View>
            </View>

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

            <View style={styles.insightGrid}>
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>Ticket promedio</Text>
                <Text style={styles.insightValue}>{formatCurrency(averageTicketPrice)}</Text>
                <Text style={styles.insightHint}>Basado en ventas totales</Text>
              </View>
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>Validación completada</Text>
                <Text style={styles.insightValue}>{validationRate.toFixed(1)}%</Text>
                <Text style={styles.insightHint}>Tickets activos vs validados</Text>
              </View>
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>Eventos activos</Text>
                <Text style={styles.insightValue}>{activeEventShare.toFixed(1)}%</Text>
                <Text style={styles.insightHint}>Del total publicados</Text>
              </View>
            </View>
          </View>
        </View>

        {/* === SECTION 4: RECENT ACTIVITY === */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Actividad reciente</Text>
                <Text style={styles.sectionSubtitle}>Últimas 10 transacciones</Text>
              </View>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Ver todo</Text>
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
                recentPurchases.map((purchase, index) => {
                  const isLast = index === recentPurchases.length - 1;
                  return (
                    <View key={purchase.id} style={styles.purchaseRow}>
                      <View style={styles.timelineColumn}>
                        <View style={styles.timelineDot} />
                        {!isLast && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.purchaseCard}>
                        <View style={styles.purchaseHeader}>
                          <View style={[styles.purchaseIconContainer, { backgroundColor: purchase.payment_status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)' }]}>
                            <Ionicons
                              name={purchase.payment_status === 'completed' ? 'checkmark-circle' : 'time-outline'}
                              size={24}
                              color={purchase.payment_status === 'completed' ? Colors.dark.success : Colors.dark.warning}
                            />
                          </View>
                          <View style={styles.purchaseHeaderInfo}>
                            <Text style={styles.purchaseEvent} numberOfLines={2}>
                              {purchase.event_title}
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
                        <View style={styles.purchaseDetails}>
                          <View style={styles.purchaseDetailRow}>
                            <Ionicons name="person-outline" size={14} color={AdminColors.bodySecondary} />
                            <Text style={styles.purchaseDetailLabel}>Cliente:</Text>
                            <Text style={styles.purchaseDetailValue}>{purchase.user_name}</Text>
                          </View>
                          <View style={styles.purchaseDetailRow}>
                            <Ionicons name="calendar-outline" size={14} color={AdminColors.bodySecondary} />
                            <Text style={styles.purchaseDetailLabel}>Fecha:</Text>
                            <Text style={styles.purchaseDetailValue}>{formatDate(purchase.created_at)}</Text>
                          </View>
                          <View style={styles.purchaseDetailRow}>
                            <Ionicons name="cash-outline" size={14} color={AdminColors.bodySecondary} />
                            <Text style={styles.purchaseDetailLabel}>Monto:</Text>
                            <Text style={styles.purchaseAmount}>
                              {formatCurrency(purchase.total_amount)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>

        {/* === SECTION 5: EXPORT TOOLS === */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Herramientas de reporte</Text>
                <Text style={styles.sectionSubtitle}>Comparte dashboards y tablas con tu equipo</Text>
              </View>
            </View>

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
        </View>

        {/* Bottom Padding for Tab Navigation */}
        <View style={styles.bottomSpacer} />

        {/* === SECTION 6: ADVANCED ANALYTICS === */}
        <View style={styles.sectionContainer}>
          <View style={[styles.sectionCard, styles.spaciousCard]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Análisis avanzado</Text>
                <Text style={styles.sectionSubtitle}>Comportamiento por categoría, usuarios y validaciones</Text>
              </View>
            </View>

            <View style={styles.advancedGrid}>
              {/* Sales by Category Chart */}
              <View style={[styles.chartContainer, styles.chartCard]}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartHeaderLeft}>
                    <Ionicons name="pie-chart" size={22} color={Colors.dark.primary} />
                    <Text style={styles.chartTitle}>Ventas por Categoría</Text>
                  </View>
                </View>
                <View style={[styles.chartWrapper, { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm }]}>
                  <PieChart
                    data={salesByCategory}
                    width={Dimensions.get('window').width - 100}
                    height={180}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    }}
                    accessor={"total"}
                    backgroundColor={"transparent"}
                    paddingLeft={"10"}
                    absolute
                  />
                </View>
              </View>

              {/* New Users Over Time Chart */}
              <View style={[styles.chartContainer, styles.chartCard]}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartHeaderLeft}>
                    <Ionicons name="trending-up" size={22} color={Colors.dark.primary} />
                    <Text style={styles.chartTitle}>Nuevos Usuarios</Text>
                  </View>
                  <Text style={styles.chartSubtitle}>Últimos 30 días</Text>
                </View>
                <View style={[styles.chartWrapper, { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm }]}>
                  <LineChart
                    data={newUsersData}
                    width={Dimensions.get('window').width - 100}
                    height={180}
                    chartConfig={{
                      backgroundColor: 'transparent',
                      backgroundGradientFrom: 'transparent',
                      backgroundGradientTo: 'transparent',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(0, 208, 132, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.6})`,
                      propsForBackgroundLines: {
                        strokeWidth: 0,
                      },
                    }}
                    bezier
                    style={{
                      marginVertical: Spacing.xs,
                      borderRadius: BorderRadius.md,
                    }}
                  />
                </View>
              </View>

              {/* Ticket Validation Status Chart */}
              <View style={[styles.chartContainer, styles.chartCard]}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartHeaderLeft}>
                    <Ionicons name="checkmark-done-circle" size={22} color={Colors.dark.primary} />
                    <Text style={styles.chartTitle}>Estado de Tickets</Text>
                  </View>
                </View>
                <View style={[styles.chartWrapper, { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm }]}>
                  <PieChart
                    data={ticketValidationData}
                    width={Dimensions.get('window').width - 100}
                    height={180}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    }}
                    accessor={"count"}
                    backgroundColor={"transparent"}
                    paddingLeft={"10"}
                  />
                </View>
              </View>
            </View>
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

  sectionCard: {
    backgroundColor: AdminColors.sectionBackground,
    borderRadius: BorderRadius.xl,
    padding: AdminSpacing.cardInternal,
    borderWidth: 1,
    borderColor: AdminColors.borderMedium,
    gap: AdminSpacing.cardGroup,
  },

  spaciousCard: {
    padding: AdminSpacing.cardInternal * 1.2,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
    gap: Spacing.md,
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

  sectionCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: AdminColors.buttonSecondaryBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: AdminColors.borderMedium,
  },

  sectionCTAText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.dark.textLight,
  },

  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: AdminColors.cardBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: AdminColors.borderSubtle,
  },

  metaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.primary,
  },

  metaPillText: {
    fontSize: FontSizes.xs,
    color: AdminColors.bodySecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    flexWrap: 'wrap',
    gap: Spacing.md,
  },

  actionCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },

  actionCardGradient: {
    padding: Spacing.lg,
    minHeight: 160,
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

  metricBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: AdminColors.borderSubtle,
    gap: Spacing.lg,
  },

  metricBannerLabel: {
    fontSize: FontSizes.sm,
    color: AdminColors.bodySecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  metricBannerValue: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: AdminColors.headingPrimary,
  },

  metricDivider: {
    width: 1,
    height: '100%',
    backgroundColor: AdminColors.borderMedium,
  },

  insightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },

  insightCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: AdminColors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: AdminColors.borderSubtle,
    gap: Spacing.xs,
  },

  insightLabel: {
    fontSize: FontSizes.sm,
    color: AdminColors.bodySecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  insightValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.dark.text,
  },

  insightHint: {
    fontSize: FontSizes.xs,
    color: AdminColors.bodyPrimary,
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

  chartCard: {
    flex: 1,
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
    marginHorizontal: -Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },

  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.primary,
  },

  legendText: {
    fontSize: FontSizes.xs,
    color: Colors.dark.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  analyticsGrid: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },

  advancedGrid: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },

  chartFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AdminColors.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },

  chartFooterLabel: {
    fontSize: FontSizes.sm,
    color: AdminColors.bodyPrimary,
  },

  chart: {
    borderRadius: BorderRadius.lg,
    marginLeft: -Spacing.lg,
  },

  // === RECENT PURCHASES ===
  purchasesList: {
    gap: Spacing.md,
  },

  purchaseRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  timelineColumn: {
    alignItems: 'center',
  },

  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.primary,
    marginTop: Spacing.sm,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: AdminColors.borderMedium,
    marginTop: Spacing.sm,
  },

  purchaseCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: AdminColors.cardBackground,
    borderWidth: 1,
    borderColor: AdminColors.borderSubtle,
    gap: Spacing.md,
  },

  purchaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.borderSubtle,
  },

  purchaseHeaderInfo: {
    flex: 1,
    gap: Spacing.xs,
  },

  purchaseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  purchaseEvent: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: AdminColors.headingPrimary,
    lineHeight: 22,
  },

  purchaseDetails: {
    gap: Spacing.sm,
  },

  purchaseDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },

  purchaseDetailLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: AdminColors.bodySecondary,
    minWidth: 60,
  },

  purchaseDetailValue: {
    fontSize: FontSizes.sm,
    color: AdminColors.bodyPrimary,
    flex: 1,
  },

  purchaseAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.dark.primary,
  },

  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
  },

  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },

  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },

  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.dark.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
