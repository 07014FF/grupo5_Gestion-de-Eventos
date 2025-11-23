/**
 * User Management Screen - SOLO SUPER_ADMIN
 * Gestión completa de usuarios: ver, editar roles, eliminar
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { AdminService, UserManagement } from '@/services/admin.service';
import { colors } from '@/constants/theme';

const ROLE_LABELS: Record<string, string> = {
  user: '👤 Usuario',
  qr_validator: '🎫 Validador',
  admin: '👨‍💼 Organizador',
  super_admin: '👑 Super Admin',
};

const ROLE_COLORS: Record<string, string> = {
  user: '#95E1D3',
  qr_validator: '#FFD93D',
  admin: '#FF6B6B',
  super_admin: '#9B59B6',
};

export default function UserManagementScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  // Redirigir si no es super_admin
  useEffect(() => {
    if (!isSuperAdmin) {
      Alert.alert(
        'Acceso Denegado',
        'Solo los super administradores pueden acceder a esta sección'
      );
      router.back();
    }
  }, [isSuperAdmin]);

  const loadUsers = async () => {
    if (!user) return;

    try {
      const result = await AdminService.getUsers(user.role);

      if (result.success) {
        setUsers(result.data);
      } else {
        Alert.alert('Error', result.error?.message || 'No se pudieron cargar los usuarios');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!user) return;

    try {
      const result = await AdminService.updateUserRole(userId, newRole, user.role);

      if (result.success) {
        Alert.alert('Éxito', 'Rol actualizado correctamente');
        setShowRoleModal(false);
        loadUsers();
      } else {
        Alert.alert('Error', result.error?.message || 'No se pudo actualizar el rol');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al actualizar el rol');
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar a ${userName}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;

            const result = await AdminService.deleteUser(userId, user.role);

            if (result.success) {
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
              loadUsers();
            } else {
              Alert.alert('Error', result.error?.message || 'No se pudo eliminar el usuario');
            }
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: UserManagement }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.fullName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: ROLE_COLORS[item.role] + '20', borderColor: ROLE_COLORS[item.role] },
            ]}
          >
            <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] }]}>
              {ROLE_LABELS[item.role]}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedUser(item);
            setShowRoleModal(true);
          }}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteUser(item.id, item.fullName)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👑 Gestión de Usuarios</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Usuarios</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {users.filter((u) => u.role === 'qr_validator').length}
          </Text>
          <Text style={styles.statLabel}>Validadores</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{users.filter((u) => u.role === 'admin').length}</Text>
          <Text style={styles.statLabel}>Organizadores</Text>
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No hay usuarios registrados</Text>
          </View>
        }
      />

      {/* Role Change Modal */}
      <Modal visible={showRoleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar Rol de Usuario</Text>
            <Text style={styles.modalSubtitle}>
              {selectedUser?.fullName} ({selectedUser?.email})
            </Text>

            <View style={styles.roleOptions}>
              {Object.entries(ROLE_LABELS).map(([roleKey, roleLabel]) => (
                <TouchableOpacity
                  key={roleKey}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor: ROLE_COLORS[roleKey] + '15',
                      borderColor:
                        selectedUser?.role === roleKey ? ROLE_COLORS[roleKey] : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    if (selectedUser) {
                      handleChangeRole(selectedUser.id, roleKey);
                    }
                  }}
                >
                  <Text style={[styles.roleOptionText, { color: ROLE_COLORS[roleKey] }]}>
                    {roleLabel}
                  </Text>
                  {selectedUser?.role === roleKey && (
                    <Ionicons name="checkmark-circle" size={20} color={ROLE_COLORS[roleKey]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  roleOptions: {
    gap: 12,
    marginBottom: 24,
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
