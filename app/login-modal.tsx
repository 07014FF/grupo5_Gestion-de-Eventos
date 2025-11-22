import { ThemedText } from '@/components/themed-text';
import FormContainer from '@/components/FormContainer';
import { Button, ControlledInput } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, router } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { z } from 'zod';

// Constants
const MIN_PASSWORD_LENGTH = 6;

// Types
type AuthMode = 'login' | 'signup';

// Unified Schema - includes all fields but validates conditionally
const authSchema = z.object({
  name: z.string().optional(),
  email: z.string()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido'),
  password: z.string()
    .min(1, 'La contraseña es requerida'),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function LoginModal() {
  const { login, signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');

  // Single unified form
  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  // Handlers
  const handleLogin = useCallback(async (data: AuthFormData) => {
    try {
      setIsLoading(true);
      const result = await login(data.email, data.password);

      if (!result.success) {
        Alert.alert('Error', result.error || 'No se pudo iniciar sesión');
      } else {
        // Login exitoso - cerrar modal
        if (router.canDismiss()) {
          router.dismiss();
        } else {
          router.replace('/(tabs)');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const handleSignup = useCallback(async (data: AuthFormData) => {
    // Validate name for signup
    if (!data.name || data.name.trim().length < 2) {
      Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (data.password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Error', `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
      return;
    }

    try {
      setIsLoading(true);
      const result = await signup(data.email, data.password, data.name);

      if (!result.success) {
        Alert.alert('Error', result.error || 'No se pudo crear la cuenta');
      } else {
        Alert.alert('Éxito', 'Cuenta creada exitosamente');
        form.reset({ name: '', email: '', password: '' });
        setMode('login');
      }
    } finally {
      setIsLoading(false);
    }
    // form.reset is stable from react-hook-form, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signup]);

  const toggleMode = useCallback(() => {
    Keyboard.dismiss();
    setMode(prevMode => prevMode === 'login' ? 'signup' : 'login');
    form.reset({ name: '', email: '', password: '' });
    // form.reset is stable from react-hook-form, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBackPress = useCallback(() => {
    Keyboard.dismiss();
    router.push('/(tabs)');
  }, []);

  const onSubmit = useCallback(() => {
    form.handleSubmit(mode === 'login' ? handleLogin : handleSignup)();
    // form.handleSubmit is stable from react-hook-form, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, handleLogin, handleSignup]);

  // Configurar opciones de Stack fuera del render principal
  const screenOptions = useMemo(() => ({
    title: mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta',
    headerShown: true,
  }), [mode]);

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <FormContainer contentContainerStyle={styles.formWrapper}>

      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
        activeOpacity={0.7}
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

      <View style={styles.inputsContainer}>
        {mode === 'signup' && (
          <ControlledInput
            control={form.control}
            name="name"
            label="Nombre completo"
            placeholder="Tu nombre"
            leftIcon="person-outline"
            editable={!isLoading}
            autoCapitalize="words"
            returnKeyType="next"
            blurOnSubmit={false}
          />
        )}

        <ControlledInput
          control={form.control}
          name="email"
          label="Correo electrónico"
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail-outline"
          editable={!isLoading}
          returnKeyType="next"
          blurOnSubmit={false}
        />

        <ControlledInput
          control={form.control}
          name="password"
          label="Contraseña"
          placeholder={mode === 'signup' ? "Mínimo 6 caracteres" : "Tu contraseña"}
          secureTextEntry
          leftIcon="lock-closed-outline"
          editable={!isLoading}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        {mode === 'login' && (
          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            style={styles.forgotPasswordButton}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.forgotPasswordText}>
              ¿Olvidaste tu contraseña?
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#00D084" style={styles.button} />
      ) : (
        <>
          <Button
            title={mode === 'login' ? 'Ingresar' : 'Crear Cuenta'}
            onPress={onSubmit}
            style={styles.button}
          />

          <TouchableOpacity
            onPress={toggleMode}
            style={styles.switchButton}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.switchText}>
              {mode === 'login'
                ? '¿No tienes cuenta? Regístrate'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </ThemedText>
          </TouchableOpacity>
        </>
      )}
      </FormContainer>
    </>
  );
}

const styles = StyleSheet.create({
  formWrapper: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  inputsContainer: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
  switchButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  switchText: {
    textAlign: 'center',
    color: '#00D084',
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    padding: 4,
  },
  forgotPasswordText: {
    color: '#00D084',
    fontSize: 14,
    fontWeight: '500',
  },
});
