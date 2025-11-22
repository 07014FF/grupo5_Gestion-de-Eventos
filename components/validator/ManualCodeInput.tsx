/**
 * Componente para ingresar códigos de tickets manualmente
 * Útil cuando el QR no funciona o está dañado
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

interface ManualCodeInputProps {
  onSubmit: (code: string) => void;
  isProcessing?: boolean;
  onCancel?: () => void;
}

export const ManualCodeInput: React.FC<ManualCodeInputProps> = ({
  onSubmit,
  isProcessing = false,
  onCancel,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // Validar formato del código
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError('Ingresa un código de ticket');
      return;
    }

    if (trimmedCode.length < 10) {
      setError('El código parece ser muy corto');
      return;
    }

    setError('');
    onSubmit(trimmedCode);
    setCode('');
  };

  const handleCodeChange = (text: string) => {
    setCode(text.toUpperCase());
    setError('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <View style={styles.cardContainer}>
        {onCancel && (
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
        )}
        <View style={styles.header}>
          <Ionicons name="keypad" size={32} color={Colors.dark.primary} />
          <Text style={styles.title}>Ingresar código manualmente</Text>
          <Text style={styles.subtitle}>
            Si el código QR no funciona, ingresa el código del ticket aquí
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
            <Ionicons
              name="ticket-outline"
              size={20}
              color={error ? Colors.dark.error : Colors.dark.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={handleCodeChange}
              placeholder="TKT-XXXX-XXXX-XXXX"
              placeholderTextColor={Colors.dark.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isProcessing}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
              autoFocus
            />
            {code.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setCode('');
                  setError('');
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={Colors.dark.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!code.trim() || isProcessing) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!code.trim() || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.buttonContent}>
              <Ionicons name="hourglass" size={20} color={Colors.dark.white} />
              <Text style={styles.submitButtonText}>Validando...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.dark.white} />
              <Text style={styles.submitButtonText}>Validar Código</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  closeButton: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.md,
  },
  inputError: {
    borderColor: Colors.dark.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: FontSizes.md,
    color: Colors.dark.text,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.dark.error,
  },
  submitButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.dark.textSecondary,
    opacity: 0.5,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: Colors.dark.white,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
