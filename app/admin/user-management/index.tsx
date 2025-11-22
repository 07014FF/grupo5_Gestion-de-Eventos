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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, getUsers } from '@/services/user.service';
import Input from '@/components/ui/Input';
import { Colors, Spacing, FontSizes, BorderRadius, AdminGradients, AdminColors } from '@/constants/theme';
import EmptyState from '@/components/ui/EmptyState';

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
  }, [fetchUsers]);

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

  const getRoleConfig = (role: string | null) => {
    if (!role) return ROLE_CONFIG.client;
    return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.client;
  };

  const renderUserCard = useCallback(
    ({ item }: { item: User }) => {
      const roleConfig = getRoleConfig(item.role);

      return (
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => router.push(`/admin/user-management/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.userCardContent}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: roleConfig.bgColor }]}>
              <Ionicons name={roleConfig.icon} size={24} color={roleConfig.color} />
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.email || 'Sin email'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                ID: {item.id.substring(0, 8)}...
              </Text>

              {/* Role Badge */}
              <View style={styles.userMetaRow}>
                <View style={[styles.roleBadge, { backgroundColor: roleConfig.bgColor }]}>
                  <Ionicons name={roleConfig.icon} size={12} color={roleConfig.color} />
                  <Text style={[styles.roleText, { color: roleConfig.color }]}>
                    {roleConfig.label}
                  </Text>
                </View>
                <Text style={styles.userMetaHint}>Toca para gestionar</Text>
              </View>
            </View>

            {/* Arrow Icon */}
            <Ionicons name="chevron-forward" size={20} color={Colors.dark.textSecondary} />
          </View>
        </TouchableOpacity>
      );
    },
    [router]
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

      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>Usuarios</Text>
        <Text style={styles.listHeaderSubtitle}>Selecciona un usuario para gestionar su rol</Text>
      </View>
    </View>
  ), [activeFilter, filteredUsers.length, searchQuery, stats.admins, stats.clients, stats.total, stats.validators]);

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
});
