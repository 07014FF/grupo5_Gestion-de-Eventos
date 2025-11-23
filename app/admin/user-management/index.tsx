import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, getUsers, updateUserRole, UserRole } from '@/services/user.service';
import Input from '@/components/ui/Input';
import { Colors, Spacing, FontSizes, BorderRadius, AdminGradients, AdminColors } from '@/constants/theme';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { ActivityLogEntry, ActivityLogService } from '@/services/activity-log.service';

const ROLE_CONFIG = {
  super_admin: {
    label: 'Super Admin',
    icon: 'shield-checkmark' as const,
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
  },
  admin: {
    label: 'Admin',
    icon: 'shield' as const,
    color: '#EA580C',
    bgColor: 'rgba(234, 88, 12, 0.1)',
  },
  qr_validator: {
    label: 'Validador QR',
    icon: 'qr-code' as const,
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.1)',
  },
  client: {
    label: 'Cliente',
    icon: 'person' as const,
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.1)',
  },
};

const FILTER_OPTIONS = [
  { label: 'Todos', value: 'all', icon: 'layers-outline' as const },
  { label: 'Admins', value: 'admin', icon: 'shield-checkmark-outline' as const },
  { label: 'Validadores', value: 'qr_validator', icon: 'qr-code-outline' as const },
  { label: 'Clientes', value: 'client', icon: 'people-outline' as const },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]['value'];

export default function UserManagementScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [roleUpdating, setRoleUpdating] = useState<Record<string, UserRole | null>>({});
  const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      setActivityLoading(true);
      const data = await ActivityLogService.getRecentLogs(5);
      setRecentActivity(data);
    } catch (error) {
      console.error('Error fetching activity log:', error);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchActivity();
  }, [fetchUsers, fetchActivity]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchActivity()]);
  }, [fetchUsers, fetchActivity]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        user.email?.toLowerCase().includes(normalizedQuery) ||
        user.role?.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        activeFilter === 'all'
          ? true
          : activeFilter === 'admin'
            ? user.role === 'admin' || user.role === 'super_admin'
            : user.role === activeFilter;

      return matchesQuery && matchesFilter;
    });
  }, [users, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
      validators: users.filter((u) => u.role === 'qr_validator').length,
      clients: users.filter((u) => u.role === 'client').length,
    };
  }, [users]);

  const getRoleConfig = useCallback((role: UserRole | null) => {
    if (!role) return ROLE_CONFIG.client;
    return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.client;
  }, []);

  const handleQuickRoleUpdate = useCallback(
    async (userId: string, targetRole: Extract<UserRole, 'admin' | 'qr_validator'>) => {
      if (!isSuperAdmin) return;
      if (!currentUser?.id) {
        Alert.alert('Acción no permitida', 'Tu sesión no está disponible. Intenta nuevamente.');
        return;
      }
      if (userId === currentUser?.id) {
        Alert.alert('Acción no permitida', 'No puedes modificar tu propio rol desde este panel.');
        return;
      }

      setRoleUpdating((prev) => ({ ...prev, [userId]: targetRole }));
      try {
        const updatedUser = await updateUserRole(userId, targetRole, {
          performedBy: currentUser.id,
          previousRole: users.find((u) => u.id === userId)?.role ?? null,
          context: 'quick_action',
          actorEmail: currentUser.email,
        });
        setUsers((prev) => prev.map((user) => (user.id === userId ? updatedUser : user)));
        const feedback = getRoleConfig(updatedUser.role).label;
        Alert.alert('Rol actualizado', `El usuario ahora es ${feedback}.`);
        fetchActivity();
      } catch (error) {
        console.error('Error updating user role:', error);
        Alert.alert('Error', 'No se pudo actualizar el rol. Intenta nuevamente.');
      } finally {
        setRoleUpdating((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    },
    [currentUser?.email, currentUser?.id, fetchActivity, getRoleConfig, isSuperAdmin, users]
  );

  const renderActivityLog = useCallback(() => {
    if (!isSuperAdmin) return null;

    const renderEntry = (entry: ActivityLogEntry) => {
      const actorEmail = entry.user_email || 'Sistema';
      const timestamp = new Date(entry.created_at || '').toLocaleString('es-PE');
      let description = entry.description;
      let iconName: keyof typeof Ionicons.glyphMap = 'time-outline';
      let iconColor = Colors.dark.primary;

      // Personalizar icono y color según el tipo de acción
      if (entry.action === 'role_change') {
        iconName = 'shield-outline';
        iconColor = '#EA580C';
      } else if (entry.action === 'payment_completed') {
        iconName = 'checkmark-circle-outline';
        iconColor = '#10B981';
      } else if (entry.action === 'payment_failed') {
        iconName = 'close-circle-outline';
        iconColor = '#EF4444';
      } else if (entry.action === 'payment_mock') {
        iconName = 'flask-outline';
        iconColor = '#8B5CF6';
      } else if (entry.action === 'payment_manual') {
        iconName = 'document-text-outline';
        iconColor = '#F59E0B';
      } else if (entry.action === 'ticket_validated') {
        iconName = 'qr-code-outline';
        iconColor = '#7C3AED';
      }

      return (
        <View key={entry.id} style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={iconName} size={16} color={iconColor} />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityDescription}>{description}</Text>
            <Text style={styles.activityMeta}>
              {actorEmail} · {timestamp}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionTitle}>Actividad reciente</Text>
          <Text style={styles.sectionSubtitle}>Últimas acciones registradas</Text>
        </View>
        {activityLoading ? (
          <ActivityIndicator size="small" color={Colors.dark.primary} />
        ) : recentActivity.length === 0 ? (
          <Text style={styles.activityEmpty}>Aún no hay acciones registradas</Text>
        ) : (
          <View style={styles.activityList}>{recentActivity.map(renderEntry)}</View>
        )}
      </View>
    );
  }, [activityLoading, isSuperAdmin, recentActivity]);

  const renderUserCard = useCallback(
    ({ item }: { item: User }) => {
      const roleConfig = getRoleConfig(item.role);
      const showQuickActions = isSuperAdmin && item.role !== 'super_admin' && item.id !== currentUser?.id;
      const updatingRole = roleUpdating[item.id];

      return (
        <View style={styles.userCard}>
          <TouchableOpacity
            style={styles.userCardContent}
            onPress={() => router.push(`/admin/user-management/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: roleConfig.bgColor }]}>
              <Ionicons name={roleConfig.icon} size={24} color={roleConfig.color} />
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.email || 'Sin email'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                ID: {item.id.substring(0, 8)}...
              </Text>

              <View style={styles.userMetaRow}>
                <View style={[styles.roleBadge, { backgroundColor: roleConfig.bgColor }]}>
                  <Ionicons name={roleConfig.icon} size={12} color={roleConfig.color} />
                  <Text style={[styles.roleText, { color: roleConfig.color }]}>
                    {roleConfig.label}
                  </Text>
                </View>
                <Text style={styles.userMetaHint}>
                  {showQuickActions ? 'Gestión rápida disponible' : 'Toca para gestionar'}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color={Colors.dark.textSecondary} />
          </TouchableOpacity>

          {showQuickActions && (
            <View style={styles.userQuickActions}>
              <TouchableOpacity
                style={[
                  styles.quickActionButton,
                  styles.quickActionAdmin,
                  (updatingRole || item.role === 'admin') && styles.quickActionButtonDisabled,
                ]}
                onPress={() => handleQuickRoleUpdate(item.id, 'admin')}
                disabled={Boolean(updatingRole) || item.role === 'admin'}
                activeOpacity={0.8}
              >
                {updatingRole === 'admin' ? (
                  <ActivityIndicator size="small" color="#EA580C" />
                ) : (
                  <>
                    <Ionicons name="shield" size={16} color="#EA580C" />
                    <Text style={[styles.quickActionText, { color: '#EA580C' }]}>Hacer Admin</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickActionButton,
                  styles.quickActionValidator,
                  (updatingRole || item.role === 'qr_validator') && styles.quickActionButtonDisabled,
                ]}
                onPress={() => handleQuickRoleUpdate(item.id, 'qr_validator')}
                disabled={Boolean(updatingRole) || item.role === 'qr_validator'}
                activeOpacity={0.8}
              >
                {updatingRole === 'qr_validator' ? (
                  <ActivityIndicator size="small" color="#7C3AED" />
                ) : (
                  <>
                    <Ionicons name="qr-code" size={16} color="#7C3AED" />
                    <Text style={[styles.quickActionText, { color: '#7C3AED' }]}>Hacer Validador</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    },
    [router, isSuperAdmin, currentUser?.id, roleUpdating, handleQuickRoleUpdate, getRoleConfig]
  );

  const renderListHeader = useCallback(() => (
    <View style={styles.preList}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionTitle}>Resumen de roles</Text>
          <Text style={styles.sectionSubtitle}>Usuarios activos en cada perfil</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}>
            <Ionicons name="shield-checkmark" size={20} color="#DC2626" />
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.admins}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
            <Ionicons name="qr-code" size={20} color="#7C3AED" />
            <Text style={[styles.statValue, { color: '#7C3AED' }]}>{stats.validators}</Text>
            <Text style={styles.statLabel}>Validadores</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
            <Ionicons name="people" size={20} color="#059669" />
            <Text style={[styles.statValue, { color: '#059669' }]}>{stats.clients}</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionTitle}>Búsqueda y filtros</Text>
          <Text style={styles.sectionSubtitle}>Encuentra rápidamente al usuario correcto</Text>
        </View>
        <View style={styles.searchContainer}>
          <Input
            placeholder="Buscar por nombre, email o rol..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon="search"
            style={styles.searchInput}
          />
        </View>
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterChip,
                activeFilter === filter.value && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.value)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={filter.icon}
                size={14}
                color={activeFilter === filter.value ? Colors.dark.text : Colors.dark.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter.value && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.metaStrip}>
          <Text style={styles.metaText}>Mostrando {filteredUsers.length} usuarios</Text>
          <Text style={styles.metaHint}>Total registrados: {stats.total}</Text>
        </View>
      </View>

      {renderActivityLog()}

      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>Usuarios</Text>
        <Text style={styles.listHeaderSubtitle}>
          {isSuperAdmin
            ? 'Selecciona un usuario o usa los accesos rápidos para asignar roles'
            : 'Selecciona un usuario para gestionar su rol'}
        </Text>
      </View>
    </View>
  ), [activeFilter, filteredUsers.length, isSuperAdmin, renderActivityLog, searchQuery, stats.admins, stats.clients, stats.total, stats.validators]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />

      {/* Header with Gradient */}
      <LinearGradient colors={AdminGradients.header} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark.textLight} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
          <Text style={styles.headerSubtitle}>{users.length} usuarios registrados</Text>
        </View>
      </LinearGradient>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderListHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No hay usuarios"
            description={
              searchQuery
                ? 'No se encontraron usuarios con ese criterio'
                : 'Aún no hay usuarios registrados'
            }
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: AdminColors.headingPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: AdminColors.headingSecondary,
  },
  preList: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionCard: {
    backgroundColor: AdminColors.cardBackground,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: AdminColors.borderMedium,
    gap: Spacing.md,
  },
  sectionCardHeader: {
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: AdminColors.headingPrimary,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: AdminColors.headingSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    borderWidth: 1,
    borderColor: AdminColors.borderMedium,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: AdminColors.bodySecondary,
    marginTop: Spacing.xs,
  },
  searchContainer: {
    marginBottom: Spacing.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: AdminColors.borderMedium,
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
    borderColor: Colors.dark.primary,
  },
  filterChipText: {
    fontSize: FontSizes.xs,
    color: AdminColors.bodySecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: AdminColors.headingPrimary,
  },
  metaStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: AdminColors.borderSubtle,
  },
  metaText: {
    fontSize: FontSizes.sm,
    color: AdminColors.headingPrimary,
    fontWeight: '600',
  },
  metaHint: {
    fontSize: FontSizes.xs,
    color: AdminColors.bodySecondary,
  },
  listHeaderRow: {
    gap: Spacing.xs,
  },
  listHeaderTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: AdminColors.headingPrimary,
  },
  listHeaderSubtitle: {
    fontSize: FontSizes.sm,
    color: AdminColors.bodySecondary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  userCard: {
    backgroundColor: AdminColors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AdminColors.borderSubtle,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: AdminColors.headingPrimary,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: FontSizes.sm,
    color: AdminColors.bodyPrimary,
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  roleText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  userMetaHint: {
    fontSize: FontSizes.xs,
    color: AdminColors.bodySecondary,
  },
  activityList: {
    gap: Spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: FontSizes.sm,
    color: AdminColors.headingPrimary,
    fontWeight: '600',
  },
  activityMeta: {
    fontSize: FontSizes.xs,
    color: AdminColors.bodySecondary,
  },
  activityEmpty: {
    fontSize: FontSizes.sm,
    color: AdminColors.bodySecondary,
    fontStyle: 'italic',
  },
  userQuickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: AdminColors.borderSubtle,
    backgroundColor: AdminColors.cardBackground,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  quickActionAdmin: {
    borderColor: 'rgba(234, 88, 12, 0.4)',
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
  },
  quickActionValidator: {
    borderColor: 'rgba(124, 58, 237, 0.4)',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  quickActionButtonDisabled: {
    opacity: 0.5,
  },
  quickActionText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
