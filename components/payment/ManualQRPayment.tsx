/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { BorderRadius, Spacing, FontSizes, Shadows } from '@/constants/theme';

interface ManualQRPaymentProps {
  method: 'yape' | 'plin';
  amount: number;
  onPaymentConfirmed: (transactionRef: string) => void;
  onCancel: () => void;
}

// Configuración de QR por método de pago
// TODO: Reemplaza estas URLs con tu QR personal de Yape/Plin
// Puedes usar un servicio como imgur.com para subir tu QR y obtener la URL
const QR_CONFIGS = {
  yape: {
    name: 'Yape',
    color: '#6C2C91',
    icon: '💜',
    // INSTRUCCIONES:
    // 1. Ve a tu app de Yape
    // 2. Ve a "Mi código QR"
    // 3. Toma screenshot y súbelo a https://imgur.com
    // 4. Copia la URL directa de la imagen y pégala aquí
    qrImageUrl: 'https://via.placeholder.com/300x300.png?text=CONFIGURA+TU+QR+DE+YAPE',
    instructions: [
      'Abre tu app de Yape',
      'Toca en "Yapear"',
      'Escanea este código QR',
      'Verifica el monto y confirma',
      'Anota los últimos 4 dígitos de tu operación',
    ],
  },
  plin: {
    name: 'Plin',
    color: '#00A9E0',
    icon: '💙',
    // INSTRUCCIONES:
    // 1. Ve a tu app de Plin
    // 2. Ve a "Mi QR"
    // 3. Toma screenshot y súbelo a https://imgur.com
    // 4. Copia la URL directa de la imagen y pégala aquí
    qrImageUrl: 'https://via.placeholder.com/300x300.png?text=CONFIGURA+TU+QR+DE+PLIN',
    instructions: [
      'Abre tu app de Plin',
      'Toca en "Enviar dinero"',
      'Escanea este código QR',
      'Verifica el monto y confirma',
      'Anota los últimos 4 dígitos de tu operación',
    ],
  },
};

export const ManualQRPayment: React.FC<ManualQRPaymentProps> = ({
  method,
  amount,
  onPaymentConfirmed,
  onCancel,
}) => {
  const colors = useThemeColors();
  const [transactionRef, setTransactionRef] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const config = QR_CONFIGS[method];
  const formattedAmount = (amount / 100).toFixed(2);

  const handleConfirmPayment = async () => {
    if (!transactionRef.trim()) {
      Alert.alert(
        'Datos incompletos',
        'Por favor ingresa los últimos 4 dígitos de tu operación para confirmar el pago.'
      );
      return;
    }

    if (transactionRef.trim().length !== 4) {
      Alert.alert(
        'Código inválido',
        'Por favor ingresa exactamente los últimos 4 dígitos de tu operación.'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Confirmar pago',
      `¿Confirmás que realizaste el pago de S/ ${formattedAmount} por ${config.name}?\n\nReferencia: ${transactionRef}`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsConfirming(true);
            try {
              await onPaymentConfirmed(`${method.toUpperCase()}-${transactionRef}`);
            } catch {
              Alert.alert('Error', 'No se pudo confirmar el pago. Intenta nuevamente.');
              setIsConfirming(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: config.color }]}>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerIcon}>{config.icon}</Text>
        <Text style={styles.headerTitle}>Pagar con {config.name}</Text>
        <Text style={styles.headerAmount}>S/ {formattedAmount}</Text>
      </View>

      {/* QR Code */}
      <View style={[styles.qrContainer, { backgroundColor: colors.surface }, Shadows.lg]}>
        <Image
          source={{ uri: config.qrImageUrl }}
          style={styles.qrImage}
          resizeMode="contain"
        />
        <Text style={[styles.qrLabel, { color: colors.textSecondary }]}>
          Escanea este código desde tu app de {config.name}
        </Text>
      </View>

      {/* Instructions */}
      <View style={[styles.instructionsCard, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={[styles.instructionsTitle, { color: colors.text }]}>
          📱 Instrucciones
        </Text>
        {config.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionRow}>
            <View style={[styles.stepBadge, { backgroundColor: config.color }]}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </View>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              {instruction}
            </Text>
          </View>
        ))}
      </View>

      {/* Transaction Reference Input */}
      <View style={[styles.inputCard, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Últimos 4 dígitos de tu operación
        </Text>
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <Ionicons name="keypad-outline" size={20} color={colors.textSecondary} />
          <TextInput
            maxLength={4}
            placeholder="1234"
            placeholderTextColor={colors.textSecondary}
            value={transactionRef}
            onChangeText={(text) => setTransactionRef(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            style={[styles.textInput, { color: colors.text }]}
          />
        </View>
        <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
          Ingresa los últimos 4 dígitos que aparecen en tu comprobante de {config.name}
        </Text>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          { backgroundColor: config.color },
          (!transactionRef.trim() || isConfirming) && styles.confirmButtonDisabled,
          Shadows.md,
        ]}
        onPress={handleConfirmPayment}
        disabled={!transactionRef.trim() || isConfirming}
        activeOpacity={0.8}
      >
        {isConfirming ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>
              Confirmar pago de S/ {formattedAmount}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Warning */}
      <View style={[styles.warningCard, { backgroundColor: colors.surfaceElevated }]}>
        <Ionicons name="information-circle" size={20} color={config.color} />
        <Text style={[styles.warningText, { color: colors.textSecondary }]}>
          Tu compra estará en estado "Pendiente" hasta que confirmemos tu pago.
          Esto suele tardar unos minutos.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  headerAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  qrContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: -30,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  qrImage: {
    width: 250,
    height: 250,
    marginBottom: Spacing.md,
  },
  qrLabel: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  instructionsCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  instructionsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 24,
  },
  inputCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  textInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
  },
  inputHint: {
    fontSize: FontSizes.xs,
    lineHeight: 16,
  },
  confirmButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  warningCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: FontSizes.xs,
    lineHeight: 16,
  },
});
