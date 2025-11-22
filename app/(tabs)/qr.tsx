import { Button } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { QRService } from '@/services/qr.service';
import { ValidatorService } from '@/services/validator.service';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface ValidationInfo {
  isValid: boolean;
  message: string;
  ticketCode?: string;
  eventTitle?: string;
  status?: string;
}

export default function QRScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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
        // Parse QR data to get ticket info
        const parseResult = QRService.parseQRData(data);

        if (parseResult.success) {
          const payload = parseResult.data;

          // El QR ya contiene toda la información necesaria
          // No necesitamos hacer query adicional por ID
          setValidationInfo({
            isValid: true,
            message: validationResult.message,
            ticketCode: payload.ticketId, // ticketId en QR = ticket_code
            eventTitle: 'Ver en validador',
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
                // Parsear el QR data
                const parseResult = QRService.parseQRData(scannedData);
                if (parseResult.success) {
                  const payload = parseResult.data;

                  // Usar ValidatorService que maneja correctamente ticket_code
                  // El servicio detecta el evento automáticamente del QR
                  const result = await ValidatorService.validateTicket(
                    scannedData, // Pasar el QR completo
                    payload.eventId, // ID del evento
                    user.id,
                    user.email || 'Super Admin'
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
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
          <Text style={styles.loadingTitle}>Solicitando permisos</Text>
          <Text style={styles.loadingSubtitle}>Necesitamos acceso a tu cámara</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="camera-outline" size={64} color={Colors.dark.primary} />
          </View>
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
      <View style={[styles.controls, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + Spacing.md : Spacing.md }]}>
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
      <View style={[styles.instructions, { paddingBottom: Platform.OS === 'ios' ? 100 + insets.bottom : 90 }]}>
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
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  loadingTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  loadingSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl * 2,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  placeholderText: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 22,
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
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    ...Shadows.md,
    elevation: 4,
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
  },
  scanButton: {
    paddingVertical: Spacing.md,
    ...Shadows.lg,
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  instructions: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
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