import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { Button } from '@/components/ui';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { QRService } from '@/services/qr.service';
import { TicketServiceSupabase } from '@/services/ticket.service.supabase';
import { useAuth } from '@/context/AuthContext';

interface ValidationInfo {
  isValid: boolean;
  message: string;
  ticketCode?: string;
  eventTitle?: string;
  status?: string;
}

export default function QRScreen() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [validationInfo, setValidationInfo] = useState<ValidationInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);
    setScannedData(data);
    setIsValidating(true);

    try {
      // Validate the QR code
      const validationResult = await QRService.validateTicket(data);

      if (validationResult.isValid) {
        // Get ticket details
        const parseResult = QRService.parseQRData(data);

        if (parseResult.success) {
          const payload = parseResult.data;
          const ticketResult = await TicketServiceSupabase.getTicketById(payload.ticketId);

          if (ticketResult.success) {
            const ticket = ticketResult.data;

            setValidationInfo({
              isValid: true,
              message: validationResult.message,
              ticketCode: ticket.ticketCode,
              eventTitle: ticket.event.title,
              status: validationResult.status,
            });
          } else {
            setValidationInfo({
              isValid: true,
              message: validationResult.message,
              status: validationResult.status,
            });
          }
        } else {
          setValidationInfo({
            isValid: true,
            message: validationResult.message,
            status: validationResult.status,
          });
        }
      } else {
        setValidationInfo({
          isValid: false,
          message: validationResult.message,
          status: validationResult.status,
        });
      }
    } catch (error) {
      console.error('Error validating ticket:', error);
      setValidationInfo({
        isValid: false,
        message: 'Error al validar la entrada. Intenta nuevamente.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleStartScan = () => {
    setIsScanning(true);
    setScanned(false);
    setScannedData(null);
    setValidationInfo(null);
  };

  const handleStopScan = () => {
    setIsScanning(false);
    setScanned(false);
  };

  const handleValidateTicket = async () => {
    if (!scannedData || !validationInfo || !user?.id) return;

    if (validationInfo.isValid) {
      Alert.alert(
        'Validar Entrada',
        '¿Confirmar ingreso del usuario al evento?',
        [
          {
            text: 'Permitir Ingreso',
            onPress: async () => {
              try {
                // Mark ticket as used
                const parseResult = QRService.parseQRData(scannedData);
                if (parseResult.success) {
                  const result = await TicketServiceSupabase.markTicketAsUsed(
                    parseResult.data.ticketId,
                    user.id
                  );

                  if (result.success) {
                    Alert.alert('Éxito', 'Entrada validada. Acceso permitido.');
                    clearScannedData();
                  } else {
                    Alert.alert('Error', result.error.getUserMessage());
                  }
                }
              } catch (error) {
                console.error('Error marking ticket as used:', error);
                Alert.alert('Error', 'No se pudo marcar la entrada como usada.');
              }
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert('Entrada Inválida', validationInfo.message);
    }
  };

  const clearScannedData = () => {
    setScannedData(null);
    setValidationInfo(null);
    setScanned(false);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Solicitando permisos de cámara...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.dark.textSecondary} />
          <Text style={styles.emptyTitle}>Sin acceso a la cámara</Text>
          <Text style={styles.emptySubtitle}>
            Por favor, habilita los permisos de cámara en la configuración de tu dispositivo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.dark.background} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Escáner QR</Text>
        <Text style={styles.headerSubtitle}>
          Escanea códigos QR de las entradas para validar el acceso
        </Text>
      </View>

      {/* Scanner Area */}
      <View style={styles.scannerContainer}>
        {isScanning ? (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanningText}>
                {isValidating ? 'Validando...' : 'Escanea el código QR'}
              </Text>
            </View>
          </CameraView>
        ) : (
          <View style={styles.scannerPlaceholder}>
            <Ionicons
              name="qr-code-outline"
              size={80}
              color={Colors.dark.textSecondary}
            />
            <Text style={styles.placeholderText}>
              Presiona el botón para comenzar a escanear
            </Text>
          </View>
        )}
      </View>

      {/* Validation Result Display */}
      {validationInfo && (
        <View style={[
          styles.resultContainer,
          { borderColor: validationInfo.isValid ? Colors.dark.success : Colors.dark.error }
        ]}>
          <View style={styles.resultHeader}>
            <Ionicons
              name={validationInfo.isValid ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={validationInfo.isValid ? Colors.dark.success : Colors.dark.error}
            />
            <Text style={styles.resultTitle}>
              {validationInfo.isValid ? 'Entrada Válida' : 'Entrada Inválida'}
            </Text>
          </View>

          {validationInfo.eventTitle && (
            <View style={styles.resultData}>
              <Text style={styles.resultLabel}>Evento:</Text>
              <Text style={styles.resultValue}>{validationInfo.eventTitle}</Text>
            </View>
          )}

          {validationInfo.ticketCode && (
            <View style={styles.resultData}>
              <Text style={styles.resultLabel}>Código:</Text>
              <Text style={styles.resultValue}>{validationInfo.ticketCode}</Text>
            </View>
          )}

          <View style={styles.resultData}>
            <Text style={styles.resultLabel}>Estado:</Text>
            <Text style={[
              styles.resultValue,
              { color: validationInfo.isValid ? Colors.dark.success : Colors.dark.error }
            ]}>
              {validationInfo.message}
            </Text>
          </View>

          <View style={styles.resultActions}>
            {validationInfo.isValid && (
              <Button
                title="Permitir Ingreso"
                variant="primary"
                onPress={handleValidateTicket}
                style={styles.validateButton}
              />
            )}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearScannedData}
            >
              <Ionicons name="refresh-outline" size={20} color={Colors.dark.primary} />
              <Text style={{ marginLeft: 4, color: Colors.dark.primary }}>Escanear Otro</Text>
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
          <Ionicons name="information-circle-outline" size={16} color={Colors.dark.primary} />
          <Text style={styles.instructionText}>
            Mantén el código QR dentro del marco de escaneo
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.dark.primary} />
          <Text style={styles.instructionText}>
            Asegúrate de tener buena iluminación
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.dark.primary} />
          <Text style={styles.instructionText}>
            El escaneo es automático cuando se detecta un código
          </Text>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  scannerContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    fontSize: FontSizes.lg,
    color: 'white',
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  scannerPlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  scannerFrame: {
    width: 250,
    height: 250,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
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
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.success,
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
    color: Colors.dark.text,
    marginLeft: Spacing.sm,
  },
  resultData: {
    marginBottom: Spacing.md,
  },
  resultLabel: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs / 2,
  },
  resultValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.dark.text,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: Colors.dark.text,
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
    color: Colors.dark.textSecondary,
    flex: 1,
  },
});