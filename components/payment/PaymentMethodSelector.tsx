import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { BorderRadius, Spacing, FontSizes, Shadows } from '@/constants/theme';
import { PaymentMethod } from '@/types/ticket.types';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
  color: string;
  popular?: boolean;
}

const PAYMENT_METHODS_PERU: PaymentMethodOption[] = [
  {
    id: 'yape',
    name: 'Yape',
    icon: '💜',
    description: 'Pago instantáneo',
    color: '#6C2C91',
    popular: true,
  },
  {
    id: 'plin',
    name: 'Plin',
    icon: '💙',
    description: 'Pago instantáneo',
    color: '#00A9E0',
    popular: true,
  },
  {
    id: 'card',
    name: 'Tarjeta',
    icon: '💳',
    description: 'Crédito o Débito',
    color: '#4F46E5',
  },
];

interface PaymentMethodSelectorProps {
  selectedMethod?: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect,
}) => {
  const colors = useThemeColors();

  const handleSelect = (method: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(method);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Método de Pago
      </Text>

      <View style={styles.methodsGrid}>
        {PAYMENT_METHODS_PERU.map((method) => {
          const isSelected = selectedMethod === method.id;

          return (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? method.color : colors.border,
                },
                isSelected && styles.methodCardSelected,
                Shadows.sm,
              ]}
              onPress={() => handleSelect(method.id)}
              activeOpacity={0.7}
            >
              {method.popular && (
                <View style={[styles.popularBadge, { backgroundColor: method.color }]}>
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}

              <View style={styles.methodContent}>
                <Text style={styles.methodIcon}>{method.icon}</Text>
                <Text style={[styles.methodName, { color: colors.text }]}>
                  {method.name}
                </Text>
                <Text style={[styles.methodDescription, { color: colors.textSecondary }]}>
                  {method.description}
                </Text>

                {isSelected && (
                  <View style={[styles.checkmark, { backgroundColor: method.color }]}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info adicional según método seleccionado */}
      {selectedMethod === 'yape' && (
        <View style={[styles.infoCard, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            💜 Pago con Yape
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Al confirmar, tu pago se procesará instantáneamente (modo prueba).{'\n\n'}
            Tus entradas estarán disponibles de inmediato en "Mis Entradas".
          </Text>
        </View>
      )}

      {selectedMethod === 'plin' && (
        <View style={[styles.infoCard, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            💙 Pago con Plin
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Al confirmar, tu pago se procesará instantáneamente (modo prueba).{'\n\n'}
            Tus entradas estarán disponibles de inmediato en "Mis Entradas".
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  methodCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    padding: Spacing.md,
    minHeight: 120,
    position: 'relative',
  },
  methodCardSelected: {
    borderWidth: 3,
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  methodContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIcon: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  methodName: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  infoTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
});
