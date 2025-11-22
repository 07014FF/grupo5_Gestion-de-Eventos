/**
 * Componente para mostrar el resultado de la validación
 * Con feedback háptico (vibración)
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import type { ValidationResult as ValidationResultType } from '@/types/validator.types';

interface ValidationResultProps {
  visible: boolean;
  result: ValidationResultType | null;
  onClose: () => void;
}

export const ValidationResult: React.FC<ValidationResultProps> = ({
  visible,
  result,
  onClose,
}) => {
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible && result) {
      // Feedback háptico según el resultado
      triggerHapticFeedback(result.status);

      // Animación de entrada
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, result]);

  const triggerHapticFeedback = (status: string) => {
    switch (status) {
      case 'valid':
        // Vibración de éxito (doble vibración corta)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'already_used':
        // Vibración de advertencia
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'invalid':
      case 'cancelled':
        // Vibración de error
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  };

  const getStatusConfig = () => {
    switch (result?.status) {
      case 'valid':
        return {
          icon: 'checkmark-circle',
          iconColor: Colors.dark.success,
          bgColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: Colors.dark.success,
          title: '✅ TICKET VÁLIDO',
          subtitle: 'Entrada permitida',
        };
      case 'already_used':
        return {
          icon: 'warning',
          iconColor: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: '#F59E0B',
          title: '⚠️ TICKET YA UTILIZADO',
          subtitle: 'Este ticket ya fue validado anteriormente',
        };
      case 'invalid':
        return {
          icon: 'close-circle',
          iconColor: Colors.dark.error,
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: Colors.dark.error,
          title: '❌ TICKET INVÁLIDO',
          subtitle: 'Este ticket no existe o no es válido',
        };
      case 'cancelled':
        return {
          icon: 'ban',
          iconColor: Colors.dark.error,
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: Colors.dark.error,
          title: '❌ TICKET CANCELADO',
          subtitle: 'El pago no ha sido completado',
        };
      default:
        return {
          icon: 'help-circle',
          iconColor: Colors.dark.textSecondary,
          bgColor: Colors.dark.surface,
          borderColor: Colors.dark.border,
          title: 'Resultado desconocido',
          subtitle: '',
        };
    }
  };

  if (!result) return null;

  const config = getStatusConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Header con ícono y estado */}
            <View
              style={[
                styles.header,
                { backgroundColor: config.bgColor, borderColor: config.borderColor },
              ]}
            >
              <Ionicons name={config.icon as any} size={64} color={config.iconColor} />
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.subtitle}>{config.subtitle}</Text>
            </View>

            {/* Detalles del ticket (solo si es válido o ya usado) */}
            {result.ticket && (
              <View style={styles.details}>
                {/* Código del ticket */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Código</Text>
                  <Text style={styles.codeText}>{result.ticket.code}</Text>
                </View>

                {/* Información del cliente */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="person" size={20} color={Colors.dark.primary} />
                    <Text style={styles.sectionTitle}>Cliente</Text>
                  </View>
                  <Text style={styles.detailText}>{result.ticket.userName}</Text>
                  <Text style={styles.detailTextSecondary}>{result.ticket.userEmail}</Text>
                </View>

                {/* Detalles del ticket */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="ticket" size={20} color={Colors.dark.primary} />
                    <Text style={styles.sectionTitle}>Detalles</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tipo:</Text>
                    <View
                      style={[
                        styles.typeBadge,
                        result.ticket.ticketType?.toLowerCase().includes('student') ||
                        result.ticket.ticketType?.toLowerCase().includes('estudiante')
                          ? styles.typeBadgeStudent
                          : styles.typeBadgeGeneral,
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {result.ticket.ticketType?.toLowerCase().includes('student') ||
                        result.ticket.ticketType?.toLowerCase().includes('estudiante')
                          ? 'Estudiante'
                          : 'General'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cantidad:</Text>
                    <Text style={styles.detailValue}>{result.ticket.quantity} ticket(s)</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Monto:</Text>
                    <Text style={styles.detailValue}>S/ {result.ticket.totalAmount.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Información del evento */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="calendar" size={20} color={Colors.dark.primary} />
                    <Text style={styles.sectionTitle}>Evento</Text>
                  </View>
                  <Text style={styles.detailText}>{result.ticket.eventTitle}</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color={Colors.dark.textSecondary} />
                    <Text style={styles.detailTextSecondary}>{result.ticket.eventLocation}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color={Colors.dark.textSecondary} />
                    <Text style={styles.detailTextSecondary}>
                      {new Date(result.ticket.eventDate).toLocaleString('es-PE')}
                    </Text>
                  </View>
                </View>

                {/* Información de validación previa (si ya fue usado) */}
                {result.ticket.previousValidation && (
                  <View style={[styles.section, styles.warningSection]}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="time" size={20} color="#F59E0B" />
                      <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>
                        Validación Anterior
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Validado por:</Text>
                      <Text style={styles.detailValue}>
                        {result.ticket.previousValidation.validatorName}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fecha:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(result.ticket.previousValidation.validatedAt).toLocaleString('es-PE')}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Mensaje de error (si no es válido y no hay detalles) */}
            {!result.ticket && (
              <View style={styles.errorMessage}>
                <Text style={styles.errorMessageText}>{result.message}</Text>
              </View>
            )}

            {/* Botón de cerrar */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                result.status === 'valid'
                  ? styles.closeButtonSuccess
                  : styles.closeButtonError,
              ]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>
                {result.status === 'valid' ? 'Aceptar' : 'Entendido'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  details: {
    gap: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  warningSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  codeText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.dark.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  detailLabel: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: FontSizes.md,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  detailText: {
    fontSize: FontSizes.md,
    color: Colors.dark.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  detailTextSecondary: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
  },
  typeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeStudent: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  typeBadgeGeneral: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  typeBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  errorMessage: {
    padding: Spacing.xl,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorMessageText: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  closeButtonSuccess: {
    backgroundColor: Colors.dark.success,
  },
  closeButtonError: {
    backgroundColor: Colors.dark.error,
  },
  closeButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.dark.white,
  },
});
