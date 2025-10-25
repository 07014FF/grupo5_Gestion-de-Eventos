
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginModal() {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error || 'No se pudo iniciar sesión');
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    const result = await signup(email, password, name);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error || 'No se pudo crear la cuenta');
    } else {
      Alert.alert('Éxito', 'Cuenta creada exitosamente');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta' }} />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons name="arrow-back" size={28} color="#000" />
      </TouchableOpacity>
      <ThemedText type="title" style={styles.title}>
        {mode === 'login' ? 'Bienvenido' : 'Crear Cuenta'}
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {mode === 'login'
          ? 'Ingresa a tu cuenta para continuar'
          : 'Regístrate para comprar entradas'}
      </ThemedText>

      {mode === 'signup' && (
        <Input
          label="Nombre completo"
          placeholder="Tu nombre"
          value={name}
          onChangeText={setName}
          leftIcon="person-outline"
          editable={!isLoading}
        />
      )}

      <Input
        label="Correo electrónico"
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        leftIcon="mail-outline"
        editable={!isLoading}
      />
      <Input
        label="Contraseña"
        placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        leftIcon="lock-closed-outline"
        editable={!isLoading}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#00D084" style={styles.button} />
      ) : (
        <>
          <Button
            title={mode === 'login' ? 'Ingresar' : 'Crear Cuenta'}
            onPress={mode === 'login' ? handleLogin : handleSignup}
            style={styles.button}
          />
          <TouchableOpacity
            onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
            style={styles.switchButton}
          >
            <ThemedText style={styles.switchText}>
              {mode === 'login'
                ? '¿No tienes cuenta? Regístrate'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </ThemedText>
          </TouchableOpacity>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    marginTop: 8,
  },
  switchButton: {
    marginTop: 16,
    padding: 8,
  },
  switchText: {
    textAlign: 'center',
    color: '#00D084',
    fontWeight: '600',
  },
});
