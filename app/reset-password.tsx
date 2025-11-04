import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, ControlledInput, FormContainer } from '@/components/ui';
import { Stack, router } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Keyboard,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import * as Linking from 'expo-linking';

// Constants
const MIN_PASSWORD_LENGTH = 6;

// Validation Schema
const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`),
  confirmPassword: z.string()
    .min(1, 'Confirma tu contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const { control, handleSubmit } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle deep link from email
  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          console.log('Deep link URL:', url);
          // El token viene en el hash de la URL
          // Supabase lo manejará automáticamente
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    handleDeepLink();

    // Listen for URL changes
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('URL changed:', url);
    });

    return () => subscription.remove();
  }, []);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      Keyboard.dismiss();

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        Alert.alert('Error', error.message || 'No se pudo actualizar la contraseña');
        return;
      }

      Alert.alert(
        '¡Éxito!',
        'Tu contraseña ha sido actualizada correctamente',
        [
          {
            text: 'Iniciar Sesión',
            onPress: () => router.replace('/login-modal'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error al restablecer contraseña:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    Keyboard.dismiss();
    router.back();
  };

  if (isInitializing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D084" />
          <ThemedText style={styles.loadingText}>Validando enlace...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Nueva Contraseña',
          headerShown: true,
        }}
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={28} color={Colors.dark.text} />
      </TouchableOpacity>

      <FormContainer
        contentContainerStyle={styles.scrollContainer}
        safeAreaEdges={[]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="key-outline" size={80} color={Colors.dark.primary} />
        </View>

        <ThemedText type="title" style={styles.title}>
          Crea tu nueva contraseña
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta
        </ThemedText>

        <ControlledInput
          control={control}
          name="newPassword"
          label="Nueva Contraseña"
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          leftIcon="lock-closed-outline"
          editable={!isLoading}
          returnKeyType="next"
        />

        <ControlledInput
          control={control}
          name="confirmPassword"
          label="Confirmar Contraseña"
          placeholder="Repite tu contraseña"
          secureTextEntry
          leftIcon="lock-closed-outline"
          editable={!isLoading}
          returnKeyType="done"
          onSubmitEditing={handleSubmit(handleResetPassword)}
        />

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.dark.primary} style={styles.button} />
        ) : (
          <Button
            title="Restablecer Contraseña"
            onPress={handleSubmit(handleResetPassword)}
            style={styles.button}
          />
        )}
      </FormContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 80,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: Spacing.lg,
    zIndex: 10,
    padding: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    opacity: 0.7,
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
    fontSize: FontSizes.md,
  },
  button: {
    marginTop: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    opacity: 0.7,
  },
});
