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

export default function UserManagementScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

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
              <View style={[styles.roleBadge, { backgroundColor: roleConfig.bgColor }]}>
                <Ionicons name={roleConfig.icon} size={12} color={roleConfig.color} />
                <Text style={[styles.roleText, { color: roleConfig.color }]}>
                  {roleConfig.label}
                </Text>
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

      {/* Stats Cards */}
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Buscar por nombre, email o rol..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          style={styles.searchInput}
        />
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserCard}
        contentContainerStyle={styles.listContent}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: -Spacing.xl,
    marginBottom: Spacing.lg,
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
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
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
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  roleText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
});
