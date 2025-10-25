/**
 * Ticket QR Modal Component
 * Displays a full-screen QR code for ticket validation
 * Includes ticket details and security features
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ticket } from '@/types/ticket.types';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface TicketQRModalProps {
  visible: boolean;
  ticket: Ticket | null;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');
const QR_SIZE = Math.min(width * 0.7, 300);

export function TicketQRModal({ visible, ticket, onClose }: TicketQRModalProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  if (!ticket) {
    return null;
  }

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);

      // Generate HTML for PDF
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Helvetica', 'Arial', sans-serif;
                padding: 40px;
                background: white;
              }
              .ticket {
                max-width: 600px;
                margin: 0 auto;
                border: 2px solid #00D084;
                border-radius: 16px;
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #00D084 0%, #00A86B 100%);
                padding: 30px;
                text-align: center;
                color: white;
              }
              .header h1 {
                font-size: 28px;
                margin-bottom: 8px;
                font-weight: 700;
              }
              .header p {
                font-size: 16px;
                opacity: 0.9;
              }
              .qr-section {
                padding: 40px;
                text-align: center;
                background: white;
              }
              .qr-code {
                display: inline-block;
                padding: 20px;
                background: white;
                border: 2px solid #E5E7EB;
                border-radius: 12px;
                margin-bottom: 20px;
              }
              .qr-code img {
                display: block;
                width: 250px;
                height: 250px;
              }
              .ticket-code {
                font-size: 18px;
                font-weight: 700;
                color: #1F2937;
                font-family: 'Courier New', monospace;
                margin-top: 12px;
              }
              .security-badge {
                display: inline-block;
                padding: 8px 16px;
                background: #D1FAE5;
                color: #059669;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-top: 12px;
              }
              .details {
                padding: 30px 40px;
                background: #F9FAFB;
              }
              .detail-row {
                display: flex;
                padding: 16px 0;
                border-bottom: 1px solid #E5E7EB;
              }
              .detail-row:last-child {
                border-bottom: none;
              }
              .detail-label {
                font-size: 14px;
                color: #6B7280;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                width: 150px;
              }
              .detail-value {
                font-size: 16px;
                color: #1F2937;
                font-weight: 600;
                flex: 1;
              }
              .instructions {
                padding: 30px 40px;
                background: white;
              }
              .instructions h3 {
                font-size: 18px;
                color: #1F2937;
                margin-bottom: 16px;
                font-weight: 700;
              }
              .instructions ul {
                list-style: none;
                padding: 0;
              }
              .instructions li {
                padding: 8px 0;
                padding-left: 24px;
                position: relative;
                color: #4B5563;
                line-height: 1.6;
              }
              .instructions li:before {
                content: '•';
                position: absolute;
                left: 0;
                color: #00D084;
                font-size: 20px;
              }
              .footer {
                padding: 20px 40px;
                text-align: center;
                background: #F9FAFB;
                color: #6B7280;
                font-size: 12px;
                border-top: 1px solid #E5E7EB;
              }
              @media print {
                body {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h1>${ticket.event.title}</h1>
                ${ticket.event.subtitle ? `<p>${ticket.event.subtitle}</p>` : ''}
              </div>

              <div class="qr-section">
                <div class="qr-code">
                  ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : '<p>QR Code</p>'}
                </div>
                <div class="security-badge">🛡️ Código Seguro</div>
                <div class="ticket-code">${ticket.ticketCode}</div>
              </div>

              <div class="details">
                <div class="detail-row">
                  <div class="detail-label">Fecha</div>
                  <div class="detail-value">${new Date(ticket.event.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Hora</div>
                  <div class="detail-value">${ticket.event.time}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Ubicación</div>
                  <div class="detail-value">${ticket.event.location}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Tipo</div>
                  <div class="detail-value">${ticket.ticketType}</div>
                </div>
                ${ticket.seatNumber ? `
                <div class="detail-row">
                  <div class="detail-label">Asiento</div>
                  <div class="detail-value">${ticket.seatNumber}</div>
                </div>
                ` : ''}
              </div>

              <div class="instructions">
                <h3>Instrucciones</h3>
                <ul>
                  <li>Presenta este código QR en la entrada del evento</li>
                  <li>Puedes mostrar el código desde tu dispositivo móvil o imprimirlo</li>
                  <li>Llega al menos 30 minutos antes del inicio del evento</li>
                  <li>Este código es único y no debe ser compartido</li>
                </ul>
              </div>

              <div class="footer">
                <p>Entrada generada el ${new Date().toLocaleDateString('es-ES')} | ID: ${ticket.id}</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Share or save PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Guardar entrada',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Éxito', 'PDF generado exitosamente');
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tu Entrada</Text>
          <TouchableOpacity
            onPress={handleDownloadPDF}
            style={styles.downloadButton}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Ionicons name="download-outline" size={24} color={Colors.light.primary} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* QR Code Card */}
          <View style={styles.qrCard}>
            <View style={styles.qrContainer}>
              <QRCode
                value={ticket.qrCodeData}
                size={QR_SIZE}
                backgroundColor="white"
                color={Colors.light.text}
                logo={require('@/assets/images/icon.png')}
                logoSize={40}
                logoBackgroundColor="white"
                logoBorderRadius={8}
                getRef={(ref) => {
                  if (ref) {
                    ref.toDataURL((data: string) => {
                      setQrDataUrl(`data:image/png;base64,${data}`);
                    });
                  }
                }}
              />
            </View>

            {/* Security badge */}
            <View style={styles.securityBadge}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.light.success} />
              <Text style={styles.securityText}>Código Seguro</Text>
            </View>

            {/* Ticket Code */}
            <View style={styles.ticketCodeContainer}>
              <Text style={styles.ticketCodeLabel}>Código de Entrada</Text>
              <Text style={styles.ticketCodeValue}>{ticket.ticketCode}</Text>
            </View>
          </View>

          {/* Event Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.eventTitle}>{ticket.event.title}</Text>
            {ticket.event.subtitle && (
              <Text style={styles.eventSubtitle}>{ticket.event.subtitle}</Text>
            )}

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Fecha</Text>
                  <Text style={styles.detailValue}>
                    {new Date(ticket.event.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Hora</Text>
                  <Text style={styles.detailValue}>{ticket.event.time}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="location-outline" size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Ubicación</Text>
                  <Text style={styles.detailValue}>{ticket.event.location}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="ticket-outline" size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Tipo</Text>
                  <Text style={styles.detailValue}>{ticket.ticketType}</Text>
                </View>
              </View>

              {ticket.seatNumber && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="person-outline" size={20} color={Colors.light.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Asiento</Text>
                    <Text style={styles.detailValue}>{ticket.seatNumber}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle" size={24} color={Colors.light.primary} />
              <Text style={styles.instructionsTitle}>Instrucciones</Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionBullet} />
              <Text style={styles.instructionText}>
                Presenta este código QR en la entrada del evento
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionBullet} />
              <Text style={styles.instructionText}>
                Asegúrate de que el brillo de tu pantalla esté al máximo
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionBullet} />
              <Text style={styles.instructionText}>
                Llega al menos 30 minutos antes del inicio del evento
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionBullet} />
              <Text style={styles.instructionText}>
                Este código es único y no debe ser compartido
              </Text>
            </View>
          </View>

          {/* Status indicator */}
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor:
                  ticket.status === 'active'
                    ? Colors.light.success
                    : Colors.light.textSecondary,
              },
            ]}
          >
            <Ionicons
              name={ticket.status === 'active' ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color="white"
            />
            <Text style={styles.statusText}>
              {ticket.status === 'active' ? 'Entrada Activa' : 'Entrada Usada'}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    ...Platform.select({
      ios: {
        paddingTop: Spacing.xl,
      },
    }),
  },
  closeButton: {
    padding: Spacing.xs,
  },
  downloadButton: {
    padding: Spacing.xs,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  qrCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  qrContainer: {
    padding: Spacing.lg,
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.round,
  },
  securityText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.success,
  },
  ticketCodeContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  ticketCodeLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  ticketCodeValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  detailsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  eventTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  eventSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.lg,
  },
  detailsGrid: {
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs / 2,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  instructionsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  instructionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginTop: 7,
  },
  instructionText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    lineHeight: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  statusText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
});
