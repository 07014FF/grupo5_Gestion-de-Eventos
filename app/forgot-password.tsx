import { ThemedText } from '@/components/themed-text';
import { Button, ControlledInput, FormContainer } from '@/components/ui';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
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

// Validation Schema
const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { control, handleSubmit } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const handleResetPassword = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      Keyboard.dismiss();

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: 'x01proyect://reset-password',
      });

      if (error) {
        Alert.alert('Error', error.message || 'No se pudo enviar el correo de recuperación');
        return;
      }

      setEmailSent(true);
      Alert.alert(
        'Correo Enviado',
        'Te hemos enviado un correo con instrucciones para restablecer tu contraseña. Por favor revisa tu bandeja de entrada.',
        [
          {
            text: 'Entendido',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error al recuperar contraseña:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    Keyboard.dismiss();
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Recuperar Contraseña',
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
          <Ionicons name="lock-closed-outline" size={80} color={Colors.dark.primary} />
        </View>

        <ThemedText type="title" style={styles.title}>
          ¿Olvidaste tu contraseña?
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          No te preocupes, te enviaremos instrucciones para restablecer tu contraseña
        </ThemedText>

        {!emailSent ? (
          <>
            <ControlledInput
              control={control}
              name="email"
              label="Correo electrónico"
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleSubmit(handleResetPassword)}
            />

            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.dark.primary} style={styles.button} />
            ) : (
              <Button
                title="Enviar correo de recuperación"
                onPress={handleSubmit(handleResetPassword)}
                style={styles.button}
              />
            )}
          </>
        ) : (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.dark.primary} />
            <ThemedText style={styles.successText}>
              Correo enviado exitosamente
            </ThemedText>
            <ThemedText style={styles.successSubtext}>
              Revisa tu bandeja de entrada y sigue las instrucciones
            </ThemedText>
          </View>
        )}

        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backToLoginButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-circle-outline" size={20} color={Colors.dark.primary} />
          <ThemedText style={styles.backToLoginText}>
            Volver al inicio de sesión
          </ThemedText>
        </TouchableOpacity>
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
  backToLoginButton: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  backToLoginText: {
    color: Colors.dark.primary,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  successText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  successSubtext: {
    marginTop: Spacing.sm,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    fontSize: FontSizes.md,
  },
});
