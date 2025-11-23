/**
 * Componente QR Scanner para validar tickets
 * Usa expo-camera para escanear códigos QR
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.7;

interface QRScannerProps {
  onScan: (code: string) => void;
  isProcessing?: boolean;
  onCancel?: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  isProcessing = false,
  onCancel,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (!scanned && !isProcessing) {
      console.log('📱 QR escaneado:', data);
      setScanned(true);
      onScan(data);

      // Permitir escanear nuevamente después de 2 segundos
      setTimeout(() => {
        setScanned(false);
      }, 2000);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Solicitando permisos de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="videocam-off" size={64} color={Colors.dark.textSecondary} />
        <Text style={styles.noPermissionText}>No hay acceso a la cámara</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permissionButtonText}>Solicitar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Overlay con marco de escaneo */}
        <View style={styles.overlay}>
          {onCancel && (
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Ionicons name="close" size={32} color={Colors.dark.white} />
            </TouchableOpacity>
          )}

          {/* Top dark overlay */}
          <View style={styles.overlayTop} />

          {/* Middle row with scanner frame */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scannerFrame}>
              {/* Esquinas del marco */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {/* Línea de escaneo animada */}
              {!scanned && <View style={styles.scanLine} />}

              {/* Indicador de escaneado */}
              {scanned && (
                <View style={styles.scannedIndicator}>
                  <Ionicons name="checkmark-circle" size={48} color={Colors.dark.success} />
                  <Text style={styles.scannedText}>Escaneado</Text>
                </View>
              )}
            </View>
            <View style={styles.overlaySide} />
          </View>

          {/* Bottom dark overlay */}
          <View style={styles.overlayBottom}>
            <Text style={styles.instructionText}>
              Apunta la cámara al código QR del ticket
            </Text>

            {/* Botón de linterna */}
            <TouchableOpacity
              style={styles.torchButton}
              onPress={() => setTorch(!torch)}
            >
              <Ionicons
                name={torch ? 'flash' : 'flash-off'}
                size={24}
                color={Colors.dark.white}
              />
              <Text style={styles.torchText}>
                {torch ? 'Apagar' : 'Encender'} linterna
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Indicador de procesamiento */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={Colors.dark.white} />
            <Text style={styles.processingText}>Validando ticket...</Text>
          </View>
        )}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.dark.text,
  },
  noPermissionText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  permissionButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  permissionButtonText: {
    color: Colors.dark.white,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.dark.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.dark.primary,
    opacity: 0.8,
  },
  scannedIndicator: {
    alignItems: 'center',
  },
  scannedText: {
    marginTop: Spacing.sm,
    color: Colors.dark.success,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  instructionText: {
    color: Colors.dark.white,
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  torchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  torchText: {
    color: Colors.dark.white,
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: Spacing.md,
    color: Colors.dark.white,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
});
