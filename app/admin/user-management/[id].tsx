import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { User, getUserById, updateUserRole, UserRole } from '@/services/user.service';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');

  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      try {
        const fetchedUser = await getUserById(id);
        setUser(fetchedUser);
        setSelectedRole(fetchedUser?.role || 'client');
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleSaveChanges = async () => {
    if (!id || !selectedRole) return;
    if (!currentUser?.role || !currentUser.id) {
      Alert.alert('Acción no permitida', 'Tu sesión no está disponible. Intenta nuevamente.');
      return;
    }

    // Prevent admin from changing super_admin role
    if (user?.role === 'super_admin' && currentUser.role !== 'super_admin') {
      Alert.alert('Acción no permitida', 'No puedes modificar a otro Super Admin.');
      return;
    }

    // Prevent admin from assigning super_admin role
    if (selectedRole === 'super_admin' && currentUser.role !== 'super_admin') {
      Alert.alert('Acción no permitida', 'No puedes asignar el rol de Super Admin.');
      return;
    }

    try {
      const updatedUser = await updateUserRole(id, selectedRole, {
        performedBy: currentUser.id,
        previousRole: user?.role ?? null,
        context: 'detail_screen',
        actorEmail: currentUser.email,
      });
      setUser(updatedUser);
      Alert.alert('Rol actualizado', 'El rol del usuario se actualizó correctamente.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el rol.');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>User not found.</ThemedText>
      </ThemedView>
    );
  }

  const canEditRole = (targetRole: UserRole | null) => {
    if (currentUser?.role === 'super_admin') {
      return true;
    }
    if (currentUser?.role === 'admin' && targetRole !== 'super_admin') {
      return true;
    }
    return false;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.label}>Email:</ThemedText>
      <ThemedText style={styles.value}>{user.email}</ThemedText>

      <ThemedText style={styles.label}>Role:</ThemedText>
      {canEditRole(user.role) ? (
        <View style={styles.pickerContainer}>
            <Picker
            selectedValue={selectedRole}
            onValueChange={(itemValue) => handleRoleChange(itemValue as UserRole)}
            >
            {currentUser?.role === 'super_admin' && <Picker.Item label="Super Admin" value="super_admin" />}
            <Picker.Item label="Admin" value="admin" />
            <Picker.Item label="Client" value="client" />
            <Picker.Item label="QR Validator" value="qr_validator" />
            </Picker>
        </View>
      ) : (
        <ThemedText style={styles.value}>{user.role}</ThemedText>
      )}

      {canEditRole(user.role) && <Button title="Save Changes" onPress={handleSaveChanges} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  value: {
    fontSize: 16,
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
  }
});
