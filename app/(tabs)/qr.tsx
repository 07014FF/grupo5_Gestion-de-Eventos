import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function QRScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);

  const handleStartScan = () => {
    setIsScanning(true);
    // Simular escaneo de QR
    setTimeout(() => {
      setIsScanning(false);
      setScannedData('EVENTO_TICKET_12345_VALID');
      Alert.alert(
        'QR Escaneado',
        'Entrada válida para Festival de Jazz 2024',
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  const handleStopScan = () => {
    setIsScanning(false);
  };

  const handleValidateTicket = () => {
    if (scannedData) {
      Alert.alert(
        'Validación de Entrada',
        'La entrada ha sido validada correctamente. El usuario puede ingresar al evento.',
        [
          {
            text: 'Permitir Ingreso',
            onPress: () => {
              setScannedData(null);
              console.log('Entrada validada y acceso permitido');
            }
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const clearScannedData = () => {
    setScannedData(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.light.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Escáner QR</Text>
        <Text style={styles.headerSubtitle}>
          Escanea códigos QR de las entradas para validar el acceso
        </Text>
      </View>

      {/* Scanner Area */}
      <View style={styles.scannerContainer}>
        <View style={[
          styles.scannerArea,
          isScanning && styles.scannerAreaActive
        ]}>
          {isScanning ? (
            <View style={styles.scanningIndicator}>
              <View style={styles.scanningLine} />
              <Ionicons
                name="scan-outline"
                size={80}
                color={Colors.light.primary}
              />
              <Text style={styles.scanningText}>Escaneando...</Text>
            </View>
          ) : (
            <View style={styles.scannerPlaceholder}>
              <Ionicons
                name="qr-code-outline"
                size={80}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.placeholderText}>
                Presiona el botón para comenzar a escanear
              </Text>
            </View>
          )}
        </View>

        {/* Scanner Frame */}
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* Scanned Data Display */}
      {scannedData && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
            <Text style={styles.resultTitle}>QR Escaneado</Text>
          </View>
          <View style={styles.resultData}>
            <Text style={styles.resultLabel}>Código:</Text>
            <Text style={styles.resultValue}>{scannedData}</Text>
          </View>
          <View style={styles.resultActions}>
            <Button
              title="Validar Entrada"
              variant="primary"
              onPress={handleValidateTicket}
              style={styles.validateButton}
            />
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearScannedData}
            >
              <Ionicons name="close-outline" size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!isScanning ? (
          <Button
            title="Comenzar Escaneo"
            variant="primary"
            onPress={handleStartScan}
            style={styles.scanButton}
            leftIcon="scan-outline"
          />
        ) : (
          <Button
            title="Detener Escaneo"
            variant="secondary"
            onPress={handleStopScan}
            style={styles.scanButton}
            leftIcon="stop-outline"
          />
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Instrucciones:</Text>
        <View style={styles.instructionItem}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.light.primary} />
          <Text style={styles.instructionText}>
            Mantén el código QR dentro del marco de escaneo
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.light.primary} />
          <Text style={styles.instructionText}>
            Asegúrate de tener buena iluminación
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.light.primary} />
          <Text style={styles.instructionText}>
            El escaneo es automático cuando se detecta un código
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="flashlight-outline" size={24} color={Colors.light.textSecondary} />
          <Text style={styles.quickActionText}>Flash</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="image-outline" size={24} color={Colors.light.textSecondary} />
          <Text style={styles.quickActionText}>Galería</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.light.textSecondary} />
          <Text style={styles.quickActionText}>Ayuda</Text>
        </TouchableOpacity>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    position: 'relative',
  },
  scannerArea: {
    width: 250,
    height: 250,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  scannerAreaActive: {
    borderColor: Colors.light.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  scanningIndicator: {
    alignItems: 'center',
  },
  scanningLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.light.primary,
  },
  scanningText: {
    fontSize: FontSizes.md,
    color: Colors.light.primary,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  scannerPlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  scannerFrame: {
    position: 'absolute',
    width: 250,
    height: 250,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.light.primary,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  resultContainer: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.success,
    ...Shadows.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginLeft: Spacing.sm,
  },
  resultData: {
    marginBottom: Spacing.md,
  },
  resultLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs / 2,
  },
  resultValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'monospace',
  },
  resultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  validateButton: {
    flex: 1,
  },
  clearButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  controls: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  scanButton: {
    paddingVertical: Spacing.md,
  },
  instructions: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  instructionsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  instructionText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  quickAction: {
    alignItems: 'center',
    padding: Spacing.sm,
  },
  quickActionText: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
});