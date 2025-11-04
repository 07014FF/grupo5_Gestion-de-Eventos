import { Button } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

// Ocultar header
export const options = {
  headerShown: false,
};

const { width } = Dimensions.get('window');

// Definición de la interfaz ValidationResult
interface ValidationResult {
  ticketId: string | null;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  ticketType?: string;
  seatNumber?: string;
  price?: string;
  purchaseDate?: string;
  status: 'valid' | 'used' | 'expired' | 'invalid';
  usedAt?: string;
}

// Simulación de datos del QR
const QR_DATA: ValidationResult = {
  ticketId: 'TKT-2024-001234',
  eventTitle: 'Festival de Jazz 2024',
  eventDate: '2024-03-15',
  eventTime: '19:30',
  location: 'Centro Cultural - Lima',
  ticketType: 'General',
  seatNumber: 'A-15',
  price: 'S/ 45.00',
  purchaseDate: '2024-03-10',
  status: 'valid', // valid, used, expired, invalid
};

export default function QRValidationScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const screenActions = [
    {
      key: 'history',
      icon: 'time-outline',
      label: 'Historial',
      onPress: () =>
        Alert.alert('Historial de accesos', 'Consulta los últimos códigos validados.'),
    },
    {
      key: 'flash',
      icon: 'flashlight-outline',
      label: 'Flash',
      onPress: () =>
        Alert.alert('Control de linterna', 'Pronto podrás activar la linterna desde aquí.'),
    },
    {
      key: 'manual',
      icon: 'document-text-outline',
      label: 'Ingreso manual',
      onPress: () =>
        Alert.alert('Ingreso manual', 'Ingresa el código si el QR no está disponible.'),
    },
  ];

  const instructions = [
    'Mantén el código QR dentro del marco',
    'Asegúrate de tener buena iluminación',
    'El código debe estar completamente visible',
  ];

  // Simulación del escáner QR
  const simulateQRScan = () => {
    setIsScanning(true);

    // Simular tiempo de escaneo
    setTimeout(() => {
      setIsScanning(false);

      // Simular diferentes resultados de validación
      const results: ValidationResult[] = [
        { ...QR_DATA, status: 'valid' },
        { ...QR_DATA, status: 'used', usedAt: '2024-03-15 20:15' },
        { ...QR_DATA, status: 'expired' },
        { ticketId: null, status: 'invalid' },
      ];

      const randomResult = results[Math.floor(Math.random() * results.length)];
      setValidationResult(randomResult);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return Colors.light.success;
      case 'used':
        return Colors.light.warning;
      case 'expired':
      case 'invalid':
        return Colors.light.error;
      default:
        return Colors.light.textSecondary;
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'valid':
        return 'rgba(16, 185, 129, 0.12)';
      case 'used':
        return 'rgba(245, 158, 11, 0.12)';
      case 'expired':
      case 'invalid':
        return 'rgba(239, 68, 68, 0.12)';
      default:
        return 'rgba(148, 163, 184, 0.12)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Entrada Válida';
      case 'used':
        return 'Entrada Ya Utilizada';
      case 'expired':
        return 'Entrada Expirada';
      case 'invalid':
        return 'Entrada Inválida';
      default:
        return 'Estado Desconocido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return 'checkmark-circle';
      case 'used':
        return 'warning';
      case 'expired':
      case 'invalid':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const handleAllowEntry = () => {
    if (validationResult?.status === 'valid') {
      Alert.alert(
        'Acceso Permitido',
        'La entrada ha sido validada correctamente. El asistente puede ingresar al evento.',
        [
          {
            text: 'Marcar como Usada',
            onPress: () => {
              setValidationResult(prev => prev ? { ...prev, status: 'used', usedAt: new Date().toLocaleString() } as ValidationResult : null);
            },
          },
        ]
      );
    }
  };

  const resetValidation = () => {
    setValidationResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.light.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validación QR</Text>
        <TouchableOpacity onPress={resetValidation}>
          <Ionicons name="refresh" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.topActions}>
        {screenActions.map(action => (
          <TouchableOpacity
            key={action.key}
            style={styles.topActionButton}
            onPress={action.onPress}
            activeOpacity={0.85}
          >
            <Ionicons
              name={action.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={Colors.light.primary}
            />
            <Text style={styles.topActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {!validationResult ? (
          // Scanner Interface
          <View style={styles.scannerContainer}>
            <View style={styles.scannerFrame}>
              {isScanning ? (
                <View style={styles.scanningOverlay}>
                  <Ionicons
                    name="scan"
                    size={80}
                    color={Colors.light.primary}
                    style={styles.scanningIcon}
                  />
                  <Text style={styles.scanningText}>Escaneando...</Text>
                </View>
              ) : (
                <View style={styles.scannerPlaceholder}>
                  <Ionicons name="qr-code-outline" size={100} color={Colors.light.textSecondary} />
                  <Text style={styles.scannerPlaceholderText}>
                    Coloca el código QR dentro del marco
                  </Text>
                </View>
              )}

              {/* Scanner Frame Corners */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Instrucciones</Text>
              {instructions.map((instruction) => (
                <View key={instruction} style={styles.instructionItem}>
                  <View style={styles.instructionIcon}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.light.primary} />
                  </View>
                  <Text style={styles.instructionsText}>{instruction}</Text>
                </View>
              ))}
            </View>

            <Button
              title={isScanning ? "Escaneando..." : "Iniciar Escaneo"}
              onPress={simulateQRScan}
              disabled={isScanning}
              loading={isScanning}
              style={styles.scanButton}
            />
          </View>
        ) : (
          // Validation Result
          <View style={styles.resultContainer}>
            <View
              style={[
                styles.statusCard,
                {
                  borderLeftColor: getStatusColor(validationResult.status),
                  backgroundColor: getStatusBackground(validationResult.status),
                },
              ]}
            >
              <View style={styles.statusHeader}>
                <View style={styles.statusIconWrapper}>
                  <Ionicons
                    name={getStatusIcon(validationResult.status)}
                    size={36}
                    color={getStatusColor(validationResult.status)}
                  />
                </View>
                <View style={styles.statusHeaderText}>
                  <Text style={[styles.statusText, { color: getStatusColor(validationResult.status) }]}>
                    {getStatusText(validationResult.status)}
                  </Text>
                  <Text style={styles.statusSubtext}>
                    {validationResult.purchaseDate
                      ? `Compra: ${validationResult.purchaseDate}`
                      : 'Listo para validar'}
                  </Text>
                </View>
              </View>

              {validationResult.ticketId && (
                <View style={styles.ticketDetails}>
                  <Text style={styles.ticketTitle}>{validationResult.eventTitle}</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ID de Entrada:</Text>
                    <Text style={styles.detailValue}>{validationResult.ticketId}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fecha del Evento:</Text>
                    <Text style={styles.detailValue}>
                      {validationResult.eventDate} - {validationResult.eventTime}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ubicación:</Text>
                    <Text style={styles.detailValue}>{validationResult.location}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tipo de Entrada:</Text>
                    <Text style={styles.detailValue}>{validationResult.ticketType}</Text>
                  </View>

                  {validationResult.seatNumber && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Asiento:</Text>
                      <Text style={styles.detailValue}>{validationResult.seatNumber}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Precio:</Text>
                    <Text style={styles.detailValue}>{validationResult.price}</Text>
                  </View>

                  {validationResult.status === 'used' && validationResult.usedAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Usado el:</Text>
                      <Text style={styles.detailValue}>{validationResult.usedAt}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              {validationResult.status === 'valid' && (
                <Button
                  title="Permitir Acceso"
                  onPress={handleAllowEntry}
                  style={{ ...styles.actionButton, backgroundColor: Colors.light.success }}
                />
              )}

              <Button
                title="Escanear Otro Código"
                variant="outline"
                onPress={resetValidation}
                style={styles.actionButton}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.light.text,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  topActionButton: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  topActionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  scannerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  scannerPlaceholderText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  scanningOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    opacity: 0.9,
  },
  scanningIcon: {
    marginBottom: Spacing.md,
  },
  scanningText: {
    fontSize: FontSizes.md,
    color: Colors.light.textLight,
    fontWeight: '600',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.light.primary,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionsContainer: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  instructionsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  instructionIcon: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  scanButton: {
    width: '100%',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusCard: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderLeftWidth: 4,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  statusHeaderText: {
    flex: 1,
    gap: Spacing.xs / 2,
  },
  statusText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  statusSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  ticketDetails: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  ticketTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.sm,
    backgroundColor: Colors.light.surfaceElevated,
    borderRadius: BorderRadius.md,
  },
  detailLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    gap: Spacing.md,
  },
  actionButton: {
    width: '100%',
  } as ViewStyle,
});
