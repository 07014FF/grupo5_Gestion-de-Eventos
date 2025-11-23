/**
 * Admin Dashboard - Panel de administración con métricas en tiempo real
 * Diferenciado por rol: super_admin vs admin (organizador)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { AdminService, DashboardMetrics } from '@/services/admin.service';
import { colors } from '@/constants/theme';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  // Redirigir si no es admin
  useEffect(() => {
    if (!isAdmin) {
      router.replace('/');
    }
  }, [isAdmin]);

  // Animaciones de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Cargar métricas
  const loadMetrics = async () => {
    if (!user) return;

    try {
      const result = await AdminService.getDashboardMetrics(user.id, user.role);

      if (result.success) {
        setMetrics(result.data);
      } else {
        console.error('Error loading metrics:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();

    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadMetrics, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando panel de administración...</Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header con gradiente */}
        <LinearGradient
          colors={[colors.primary, colors.primary + 'DD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>
                {isSuperAdmin ? '👑 Super Administrador' : '👨‍💼 Organizador'}
              </Text>
              <Text style={styles.userName}>{user?.fullName || user?.email}</Text>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Métricas principales */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="calendar"
            label="Eventos Totales"
            value={metrics?.totalEvents || 0}
            color="#FF6B6B"
            onPress={() => router.push('/admin/events')}
          />
          <MetricCard
            icon="flash"
            label="Eventos Activos"
            value={metrics?.activeEvents || 0}
            color="#4ECDC4"
            onPress={() => router.push('/admin/events')}
          />
          <MetricCard
            icon="ticket"
            label="Ventas Totales"
            value={metrics?.totalSales || 0}
            color="#95E1D3"
            onPress={() => router.push('/admin/sales')}
          />
          <MetricCard
            icon="cash"
            label="Ingresos"
            value={`S/ ${metrics?.totalRevenue.toFixed(2) || '0.00'}`}
            color="#FFD93D"
            onPress={() => router.push('/admin/sales')}
          />

          {isSuperAdmin && (
            <>
              <MetricCard
                icon="people"
                label="Total Usuarios"
                value={metrics?.totalUsers || 0}
                color="#A8E6CF"
                onPress={() => router.push('/admin/users')}
              />
              <MetricCard
                icon="shield-checkmark"
                label="Validadores"
                value={metrics?.totalValidators || 0}
                color="#C7CEEA"
                onPress={() => router.push('/admin/users')}
              />
            </>
          )}
        </View>

        {/* Acciones rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/events')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF6B6B15' }]}>
              <Ionicons name="calendar" size={24} color="#FF6B6B" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gestionar Eventos</Text>
              <Text style={styles.actionSubtitle}>
                {isSuperAdmin ? 'Ver, crear, editar y eliminar eventos' : 'Ver y editar tus eventos'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/users')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#4ECDC415' }]}>
                <Ionicons name="people" size={24} color="#4ECDC4" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Gestionar Usuarios</Text>
                <Text style={styles.actionSubtitle}>Administrar roles y permisos</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/statistics')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#95E1D315' }]}>
              <Ionicons name="bar-chart" size={24} color="#95E1D3" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Estadísticas y Reportes</Text>
              <Text style={styles.actionSubtitle}>Ver métricas detalladas y exportar reportes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/validators')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFD93D15' }]}>
              <Ionicons name="qr-code" size={24} color="#FFD93D" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Asignar Validadores</Text>
              <Text style={styles.actionSubtitle}>Gestionar validadores de eventos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Actividad reciente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Actividad Reciente</Text>

          {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
            metrics.recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={getActivityIcon(activity.action)}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {activity.userName} - {activity.action}
                  </Text>
                  <Text style={styles.activitySubtitle}>
                    {activity.entityType} • {new Date(activity.timestamp).toLocaleString('es-PE')}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="timer-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No hay actividad reciente</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
}

// Componente de tarjeta de métrica
interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
}

function MetricCard({ icon, label, value, color, onPress }: MetricCardProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.metricCard,
          {
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        <View style={[styles.metricIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Helper para obtener el icono según la acción
function getActivityIcon(action: string): any {
  const iconMap: Record<string, string> = {
    create_event: 'add-circle',
    update_event: 'create',
    delete_event: 'trash',
    purchase_ticket: 'ticket',
    validate_ticket: 'checkmark-circle',
    create_user: 'person-add',
    update_user: 'person',
    delete_user: 'person-remove',
  };

  return iconMap[action] || 'ellipse';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: colors.white + 'CC',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
