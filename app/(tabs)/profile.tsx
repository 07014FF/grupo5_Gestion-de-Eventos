import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Switch,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const colors = useThemeColors();

  // Debug: Ver qué rol tiene el usuario
  React.useEffect(() => {
    console.log('👤 Profile Screen - Usuario actual:', {
      name: user?.name,
      email: user?.email,
      role: user?.role,
      hasUser: !!user
    });
  }, [user]);

  const handleEditProfile = () => {
    console.log('Edit Profile');
    // Aquí puedes navegar a una pantalla de edición o mostrar un modal
  };

  const handleChangePhoto = () => {
    console.log('Change Photo');
    // Aquí puedes implementar la selección de imagen
  };

  const handleLogout = async () => {
    console.log('🚪 Cerrando sesión...');
    await logout();
    console.log('✅ Sesión cerrada');
  };

  const profileOptions = [
    {
      id: 'edit-profile',
      title: 'Editar Perfil',
      icon: 'create-outline',
      onPress: handleEditProfile,
      isToggle: false,
    },
    {
      id: 'theme',
      title: 'Modo Oscuro',
      icon: isDark ? 'moon' : 'sunny',
      onPress: toggleTheme,
      isToggle: true,
      toggleValue: isDark,
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: 'notifications-outline',
      onPress: () => console.log('Notifications'),
      isToggle: false,
    },
    {
      id: 'payment',
      title: 'Métodos de Pago',
      icon: 'card-outline',
      onPress: () => console.log('Payment'),
      isToggle: false,
    },
    {
      id: 'help',
      title: 'Ayuda y Soporte',
      icon: 'help-circle-outline',
      onPress: () => console.log('Help'),
      isToggle: false,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.background} barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'ios' ? 100 + insets.bottom : 90 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color={Colors.dark.primary} />
            </View>
            {/* Botón para editar foto */}
            <TouchableOpacity
              style={styles.editPhotoButton}
              onPress={handleChangePhoto}
              activeOpacity={0.8}
              accessibilityLabel="Cambiar foto de perfil"
              accessibilityRole="button"
            >
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>
            {user?.name || 'Usuario Invitado'}
          </Text>

          {user?.email && (
            <Text style={styles.userEmail}>{user.email}</Text>
          )}

          {/* Mostrar rol del usuario - DEBUG */}
          {user?.role ? (
            <View style={[
              styles.roleBadge,
              user.role === 'super_admin' && styles.roleBadgeSuperAdmin,
              user.role === 'admin' && styles.roleBadgeAdmin,
              user.role === 'client' && styles.roleBadgeClient,
            ]}>
              <Ionicons
                name={user.role === 'super_admin' ? 'shield' : user.role === 'admin' ? 'shield-checkmark' : 'person'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.roleText}>
                {user.role === 'super_admin' ? 'SUPER ADMIN' :
                 user.role === 'admin' ? 'ADMINISTRADOR' :
                 'CLIENTE'} ({user.role})
              </Text>
            </View>
          ) : (
            <Text style={styles.userEmail}>Sin rol asignado</Text>
          )}

          {/* Botón para editar perfil o iniciar sesión */}
          {user ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
              activeOpacity={0.8}
              accessibilityLabel="Editar perfil"
              accessibilityRole="button"
            >
              <Ionicons name="create-outline" size={16} color={Colors.dark.primary} />
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/login-modal')}
              activeOpacity={0.8}
              accessibilityLabel="Iniciar sesión"
              accessibilityRole="button"
            >
              <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Admin Panel Access - Solo para admins */}
        {user && (user.role === 'admin' || user.role === 'super_admin') && (
          <View style={styles.adminSection}>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/admin/dashboard')}
              activeOpacity={0.8}
              accessibilityLabel="Abrir panel de administración"
              accessibilityHint="Gestiona eventos y ventas"
              accessibilityRole="button"
            >
              <View style={styles.adminButtonContent}>
                <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
                <View style={styles.adminButtonText}>
                  <Text style={styles.adminButtonTitle}>Panel de Administración</Text>
                  <Text style={styles.adminButtonSubtitle}>
                    Gestionar eventos y ventas
                  </Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
              activeOpacity={0.7}
              accessibilityLabel={option.title}
              accessibilityRole="button"
            >
              <View style={styles.optionLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={option.icon as any}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
              </View>
              {option.isToggle ? (
                <Switch
                  value={option.toggleValue}
                  onValueChange={option.onPress}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.textLight}
                  ios_backgroundColor={colors.border}
                />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button - SIEMPRE VISIBLE SI HAY USUARIO */}
        {user && (
          <>
            <View style={styles.divider} />
            <View style={styles.logoutContainer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
                accessibilityLabel="Cerrar sesión"
                accessibilityRole="button"
              >
                <Ionicons name="log-out-outline" size={24} color={Colors.dark.error} />
                <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Debug: Mostrar si hay usuario */}
        {!user && (
          <View style={styles.logoutContainer}>
            <Text style={styles.userEmail}>No hay sesión activa</Text>
          </View>
        )}

        {/* App Version */}
        <Text style={styles.versionText}>Versión 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    // paddingBottom dinámico aplicado inline
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.dark.background,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.dark.primary,
    ...Shadows.lg,
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.dark.background,
    ...Shadows.md,
  },
  userName: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  userEmail: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.round,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  roleBadgeSuperAdmin: {
    backgroundColor: '#9333EA', // Morado
  },
  roleBadgeAdmin: {
    backgroundColor: Colors.dark.primary, // Verde
  },
  roleBadgeClient: {
    backgroundColor: '#3B82F6', // Azul
  },
  roleText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.round,
    borderWidth: 1.5,
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    marginTop: Spacing.sm,
  },
  editButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.dark.primary,
    letterSpacing: 0.3,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.dark.primary,
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  loginButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  optionsContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.1)',
    ...Shadows.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  logoutContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.error,
    ...Shadows.md,
    shadowColor: Colors.dark.error,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  logoutButtonText: {
    fontSize: FontSizes.lg, // Más grande
    fontWeight: '800',
    color: '#FFFFFF', // Texto blanco sobre rojo
    letterSpacing: 0.5,
  },
  versionText: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  adminSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.primary,
    ...Shadows.lg,
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  adminButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  adminButtonText: {
    flex: 1,
  },
  adminButtonTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  adminButtonSubtitle: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
