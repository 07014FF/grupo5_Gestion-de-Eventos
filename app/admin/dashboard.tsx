import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { Button, Card } from '@/components/ui';

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  pendingValidations: number;
  todaysSales: number;
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

  useEffect(() => {
    checkAdminAccess();
    loadDashboardData();
  }, []);

  const checkAdminAccess = async () => {
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
  };

  const loadDashboardData = async () => {
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
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar el dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CO')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Administración</Text>
        <Text style={styles.subtitle}>Gestiona eventos y ventas</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/admin/create-event')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Crear Evento</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => router.push('/(tabs)/qr')}
        >
          <Ionicons name="qr-code" size={24} color={Colors.dark.primary} />
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
            Escanear QR
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={28} color={Colors.dark.primary} />
          <Text style={styles.statValue}>{stats.activeEvents}</Text>
          <Text style={styles.statLabel}>Eventos Activos</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="ticket" size={28} color="#10B981" />
          <Text style={styles.statValue}>{stats.totalTicketsSold}</Text>
          <Text style={styles.statLabel}>Tickets Vendidos</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="cash" size={28} color="#F59E0B" />
          <Text style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</Text>
          <Text style={styles.statLabel}>Ingresos Totales</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time" size={28} color="#8B5CF6" />
          <Text style={styles.statValue}>{stats.pendingValidations}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>

        <View style={[styles.statCard, styles.statCardWide]}>
          <Ionicons name="trending-up" size={28} color="#EF4444" />
          <Text style={styles.statValue}>{formatCurrency(stats.todaysSales)}</Text>
          <Text style={styles.statLabel}>Ventas de Hoy</Text>
        </View>

        <View style={[styles.statCard, styles.statCardWide]}>
          <Ionicons name="albums" size={28} color="#06B6D4" />
          <Text style={styles.statValue}>{stats.totalEvents}</Text>
          <Text style={styles.statLabel}>Total Eventos</Text>
        </View>
      </View>

      {/* Recent Purchases */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Compras Recientes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver Todas</Text>
          </TouchableOpacity>
        </View>

        {recentPurchases.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No hay compras recientes</Text>
          </Card>
        ) : (
          recentPurchases.map((purchase) => (
            <Card key={purchase.id} style={styles.purchaseCard}>
              <View style={styles.purchaseHeader}>
                <View style={styles.purchaseInfo}>
                  <Text style={styles.purchaseEvent}>{purchase.event_title}</Text>
                  <Text style={styles.purchaseUser}>{purchase.user_name}</Text>
                </View>
                <View style={styles.purchaseAmount}>
                  <Text style={styles.purchasePrice}>
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
              <Text style={styles.purchaseDate}>{formatDate(purchase.created_at)}</Text>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dark.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  actionButtonSecondary: {
    backgroundColor: '#2A2A2A',
  },
  actionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonTextSecondary: {
    color: Colors.dark.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statCardWide: {
    width: '48%',
  },
  statValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: '#fff',
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#fff',
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    padding: Spacing.lg,
  },
  purchaseCard: {
    marginBottom: Spacing.md,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseEvent: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  purchaseUser: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
  },
  purchaseAmount: {
    alignItems: 'flex-end',
  },
  purchasePrice: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: '#fff',
  },
  purchaseDate: {
    fontSize: FontSizes.xs,
    color: Colors.dark.textSecondary,
  },
});
