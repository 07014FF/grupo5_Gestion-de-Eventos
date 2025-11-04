import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { User, getUserById } from '@/services/user.service';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

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

  const handleRoleChange = (role: string | null) => {
    setSelectedRole(role);
  };

  const handleSaveChanges = async () => {
    if (!id || !selectedRole) return;

    // Prevent admin from changing super_admin role
    if (user?.role === 'super_admin' && currentUser?.role !== 'super_admin') {
        alert("You cannot change the role of a super admin.");
        return;
    }

    // Prevent admin from assigning super_admin role
    if (selectedRole === 'super_admin' && currentUser?.role !== 'super_admin') {
        alert("You cannot assign the super admin role.");
        return;
    }

    const { error } = await supabase
      .from('users')
      .update({ role: selectedRole })
      .eq('id', id);

    if (error) {
      alert('Error updating user role.');
      console.error(error);
    } else {
      alert('User role updated successfully.');
      // Optionally, refresh user data
      const fetchedUser = await getUserById(id);
      setUser(fetchedUser);
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

  const canEditRole = (targetRole: string | null) => {
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
      <ThemedText style={styles.label}>Name:</ThemedText>
      <ThemedText style={styles.value}>{user.fullName}</ThemedText>

      <ThemedText style={styles.label}>Email:</ThemedText>
      <ThemedText style={styles.value}>{user.email}</ThemedText>

      <ThemedText style={styles.label}>Role:</ThemedText>
      {canEditRole(user.role) ? (
        <View style={styles.pickerContainer}>
            <Picker
            selectedValue={selectedRole}
            onValueChange={(itemValue) => handleRoleChange(itemValue)}
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
