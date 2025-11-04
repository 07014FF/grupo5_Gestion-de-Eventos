import { ManualQRPayment } from '@/components/payment/ManualQRPayment';
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector';
import { Button, FormContainer, Input } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { PaymentGateway, PaymentService } from '@/services/payment.service';
import { TicketServiceSupabase } from '@/services/ticket.service.supabase';
import { purchaseParamsSchema, type PurchaseParams } from '@/types/navigation.types';
import { Event, PaymentMethod, UserInfo } from '@/types/ticket.types';
import { normalizeSearchParams, parsePrice } from '@/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Ocultar header
export const options = {
  headerShown: false,
};

const clampQuantity = (value: number) => Math.min(Math.max(value, 1), 5);

const FALLBACK_PURCHASE_PARAMS: PurchaseParams = {
  eventId: 'fallback',
  eventTitle: 'Evento',
  eventDate: '',
  eventTime: '',
  eventLocation: '',
  ticketPrice: '0',
  ticketType: 'general',
  quantity: '1',
};

export default function PurchaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Redirigir si el usuario no está autenticado
  useEffect(() => {
    if (!user) {
      router.push('/login-modal');
    }
  }, [user, router]);

  const parsedParams = useMemo<PurchaseParams>(() => {
    const normalized = normalizeSearchParams(params);
    const result = purchaseParamsSchema.safeParse(normalized);

    if (!result.success) {
      console.error('Parámetros inválidos para la compra', result.error.flatten().fieldErrors);
      return FALLBACK_PURCHASE_PARAMS;
    }

    return result.data;
  }, [params]);

  const basePrice = useMemo(
    () => parsePrice(parsedParams.ticketPrice),
    [parsedParams.ticketPrice]
  );

  // Datos del evento recibidos desde event-detail
  const eventData = useMemo(
    () => ({
      id: parsedParams.eventId,
      title: parsedParams.eventTitle || 'Festival de Jazz 2024',
      subtitle: 'Centro Cultural',
      date: parsedParams.eventDate || '2024-03-15',
      time: parsedParams.eventTime || '19:30',
      location: parsedParams.eventLocation || 'Lima, Perú',
      price: basePrice || 5,
      availableTickets: 150,
      ticketType: parsedParams.ticketType ?? 'general',
    }),
    [parsedParams, basePrice]
  );

  const [quantity, setQuantity] = useState<number>(() =>
    clampQuantity(Number(parsedParams.quantity) || 1)
  );
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ticketType, setTicketType] = useState<'student' | 'general'>(
    parsedParams.ticketType === 'student' ? 'student' : 'general'
  );
  const [userInfo, setUserInfo] = useState({
    name: user?.name || '',
    email: user?.email || 'correo@prueba.com', // Simulado
    phone: '',
    document: '',
  });

  useEffect(() => {
    setQuantity(clampQuantity(Number(parsedParams.quantity) || 1));
  }, [parsedParams.quantity]);

  useEffect(() => {
    setTicketType(parsedParams.ticketType === 'student' ? 'student' : 'general');
  }, [parsedParams.ticketType]);

  const calculateTotal = () => {
    // Precio base según tipo de entrada
    const currentPrice = ticketType === 'student' ? 0 : eventData.price;
    const subtotal = currentPrice * quantity;
    // Yape y Plin no tienen comisión, tarjetas pueden tener una pequeña comisión
    const fee = 0; // Sin comisión por ahora
    return subtotal + fee;
  };

  const handleQuantityChange = (increment: boolean) => {
    setQuantity((prev) => clampQuantity(prev + (increment ? 1 : -1)));
  };

  const handleManualPaymentConfirmed = async (transactionRef: string) => {
    setShowQRPayment(false);
    setIsProcessing(true);

    try {
      if (!user?.id) {
        Alert.alert('Error', 'Debes iniciar sesión para comprar entradas');
        return;
      }

      // 1. Crear payment intent
      const paymentIntentResult = await PaymentService.createPaymentIntent(
        calculateTotal(),
        selectedPayment as PaymentMethod,
        {
          eventId: eventData.id,
          userId: user.id,
          quantity,
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
        }
      );

      if (!paymentIntentResult.success) {
        Alert.alert('Error', paymentIntentResult.error.getUserMessage());
        return;
      }

      // 2. Procesar pago manual (pendiente de verificación)
      const paymentResult = await PaymentService.processManualPayment(
        paymentIntentResult.data,
        transactionRef
      );

      if (!paymentResult.success) {
        Alert.alert('Error', paymentResult.error.getUserMessage());
        return;
      }

      const payment = paymentResult.data;

      // 3. Crear el objeto Event para el servicio
      const event: Event = {
        id: eventData.id,
        title: eventData.title,
        subtitle: eventData.subtitle,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        price: eventData.price,
        availableTickets: eventData.availableTickets,
      };

      // 4. Crear el objeto UserInfo
      const purchaseUserInfo: UserInfo = {
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        document: userInfo.document,
      };

      // 5. Crear la compra con estado pendiente
      const ticketResult = await TicketServiceSupabase.createPurchase(
        event,
        quantity,
        purchaseUserInfo,
        selectedPayment as PaymentMethod,
        user.id,
        {
          paymentId: payment.paymentId,
          transactionId: transactionRef,
          gateway: 'manual',
          metadata: {
            method: selectedPayment,
            requiresVerification: true,
          },
        }
      );

      if (ticketResult.success) {
        Alert.alert(
          'Pago Registrado',
          `Tu pago de S/ ${calculateTotal().toFixed(2)} ha sido registrado.\n\nReferencia: ${transactionRef}\n\nTus entradas estarán disponibles una vez que confirmemos tu pago. Esto puede tardar unos minutos.`,
          [
            {
              text: 'Ver Mis Entradas',
              onPress: () => {
                router.replace('/(tabs)/my-tickets');
              },
            },
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Hubo un error al registrar tu compra. Por favor contacta a soporte con la referencia: ' + transactionRef
        );
      }
    } catch (error) {
      console.error('Error al procesar pago manual:', error);
      Alert.alert('Error', 'No se pudo registrar el pago. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchase = async () => {
    if (!userInfo.name || !userInfo.email) {
      Alert.alert('Error', 'Por favor completa la información requerida');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión para comprar entradas');
      return;
    }

    const totalAmount = calculateTotal();

    // ============================================================================
    // CASO ESPECIAL: Tickets gratuitos para estudiantes (monto = 0)
    // ============================================================================
    if (totalAmount === 0) {
      setIsProcessing(true);
      try {
        console.log('🎓 Procesando tickets gratuitos para estudiantes...');

        // Crear el objeto Event
        const event: Event = {
          id: eventData.id,
          title: eventData.title,
          subtitle: eventData.subtitle,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          price: eventData.price,
          availableTickets: eventData.availableTickets,
        };

        // Crear el objeto UserInfo
        const purchaseUserInfo: UserInfo = {
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          document: userInfo.document,
        };

        // Crear tickets directamente sin procesar pago (es gratis)
        const ticketResult = await TicketServiceSupabase.createPurchase(
          event,
          quantity,
          purchaseUserInfo,
          'free' as PaymentMethod, // Indicar que es gratis
          user.id,
          {
            paymentId: 'FREE_' + Date.now(),
            transactionId: 'FREE_STUDENT_' + Date.now(),
            gateway: 'free',
            metadata: {
              method: 'free',
              ticketType: 'student',
              isFree: true,
            },
          }
        );

        if (ticketResult.success) {
          Alert.alert(
            '¡Tickets Obtenidos! 🎓',
            `Has obtenido ${quantity} entrada(s) de estudiante GRATIS.\n\nPuedes verlas en la sección "Mis Entradas".`,
            [
              {
                text: 'Ver Mis Entradas',
                onPress: () => {
                  router.replace('/(tabs)/my-tickets');
                },
              },
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
        } else {
          Alert.alert('Error', 'No se pudieron generar tus entradas. Intenta nuevamente.');
        }
      } catch (error) {
        console.error('Error al crear tickets gratuitos:', error);
        Alert.alert('Error', 'No se pudieron generar tus entradas. Intenta nuevamente.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // ============================================================================
    // FLUJO NORMAL: Pagos con monto mayor a 0
    // ============================================================================
    if (!selectedPayment) {
      Alert.alert('Error', 'Por favor selecciona un método de pago');
      return;
    }

    // Si es Yape o Plin, mostrar modal de QR
    if (selectedPayment === 'yape' || selectedPayment === 'plin') {
      setShowQRPayment(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Configurar pasarela de pago (cambiar a WOMPI, STRIPE, etc. según necesites)
      PaymentService.setGateway(PaymentGateway.MOCK); // Para desarrollo
      // PaymentService.setGateway(PaymentGateway.WOMPI); // Para producción

      // 1. Crear payment intent
      const paymentIntentResult = await PaymentService.createPaymentIntent(
        totalAmount,
        selectedPayment as PaymentMethod,
        {
          eventId: eventData.id,
          userId: user.id,
          quantity,
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
        }
      );

      if (!paymentIntentResult.success) {
        Alert.alert('Error', paymentIntentResult.error.getUserMessage());
        return;
      }

      // 2. Procesar pago
      const paymentResult = await PaymentService.processPayment(paymentIntentResult.data);

      if (!paymentResult.success) {
        Alert.alert('Pago Rechazado', paymentResult.error.getUserMessage());
        return;
      }

      // 3. Verificar que el pago fue completado
      const payment = paymentResult.data;
      if (!payment.success || payment.status !== 'completed') {
        Alert.alert(
          'Pago Pendiente',
          payment.errorMessage || 'El pago está siendo procesado. Te notificaremos cuando se confirme.'
        );
        return;
      }

      // 4. Crear el objeto Event para el servicio
      const event: Event = {
        id: eventData.id,
        title: eventData.title,
        subtitle: eventData.subtitle,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        price: eventData.price,
        availableTickets: eventData.availableTickets,
      };

      // 5. Crear el objeto UserInfo
      const purchaseUserInfo: UserInfo = {
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        document: userInfo.document,
      };

      // 6. Crear la compra con los tickets (solo si el pago fue exitoso)
      const ticketResult = await TicketServiceSupabase.createPurchase(
        event,
        quantity,
        purchaseUserInfo,
        selectedPayment as PaymentMethod,
        user.id
      );

      if (ticketResult.success) {
        Alert.alert(
          '¡Compra Exitosa!',
          `Tu compra de ${quantity} entrada(s) por S/ ${totalAmount.toFixed(2)} ha sido procesada exitosamente.\n\nID de transacción: ${payment.transactionId || payment.paymentId}`,
          [
            {
              text: 'Ver Mis Entradas',
              onPress: () => {
                router.replace('/(tabs)/my-tickets');
              },
            },
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        // El pago se procesó pero hubo error creando el ticket
        // TODO: Esto debería guardarse para reconciliación
        Alert.alert(
          'Atención',
          'El pago se procesó correctamente pero hubo un error generando tus entradas. Contacta a soporte con el ID: ' + payment.paymentId
        );
      }
    } catch (error) {
      console.error('Error al procesar la compra:', error);
      Alert.alert('Error', 'No se pudo completar la compra. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // No renderizar nada hasta que se confirme que el usuario está autenticado
  if (!user) {
    return null; // O un componente de carga (spinner)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={false} />

      {/* Manual QR Payment Modal */}
      <Modal
        visible={showQRPayment}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQRPayment(false)}
      >
        <ManualQRPayment
          method={selectedPayment as 'yape' | 'plin'}
          amount={calculateTotal()}
          onPaymentConfirmed={handleManualPaymentConfirmed}
          onCancel={() => setShowQRPayment(false)}
        />
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comprar Entrada</Text>
        <View style={{ width: 24 }} />
      </View>

      <FormContainer
        safeAreaEdges={[]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Event Info */}
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>{eventData.title}</Text>
          <Text style={styles.eventSubtitle}>{eventData.subtitle}</Text>

          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.eventDetailText}>
                {eventData.date} - {eventData.time}
              </Text>
            </View>
            <View style={styles.eventDetail}>
              <Ionicons name="location-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.eventDetailText}>{eventData.location}</Text>
            </View>
            <View style={styles.eventDetail}>
              <Ionicons name="ticket-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.eventDetailText}>
                {eventData.availableTickets} entradas disponibles
              </Text>
            </View>
          </View>
        </View>

        {/* Ticket Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Entrada</Text>

          <TouchableOpacity
            style={[
              styles.ticketTypeOption,
              ticketType === 'student' && styles.ticketTypeOptionSelected
            ]}
            onPress={() => setTicketType('student')}
          >
            <View style={styles.ticketTypeContent}>
              <Ionicons
                name="school"
                size={24}
                color={ticketType === 'student' ? Colors.light.primary : Colors.light.icon}
              />
              <View style={styles.ticketTypeInfo}>
                <Text style={[
                  styles.ticketTypeName,
                  ticketType === 'student' && styles.ticketTypeNameSelected
                ]}>
                  Estudiante
                </Text>
                <Text style={styles.ticketTypePrice}>S/ 0.00 (Gratis)</Text>
              </View>
            </View>
            <View style={[
              styles.radioButton,
              ticketType === 'student' && styles.radioButtonSelected
            ]}>
              {ticketType === 'student' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.ticketTypeOption,
              ticketType === 'general' && styles.ticketTypeOptionSelected
            ]}
            onPress={() => setTicketType('general')}
          >
            <View style={styles.ticketTypeContent}>
              <Ionicons
                name="people"
                size={24}
                color={ticketType === 'general' ? Colors.light.primary : Colors.light.icon}
              />
              <View style={styles.ticketTypeInfo}>
                <Text style={[
                  styles.ticketTypeName,
                  ticketType === 'general' && styles.ticketTypeNameSelected
                ]}>
                  Público General
                </Text>
                <Text style={styles.ticketTypePrice}>S/ 5.00</Text>
              </View>
            </View>
            <View style={[
              styles.radioButton,
              ticketType === 'general' && styles.radioButtonSelected
            ]}>
              {ticketType === 'general' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Quantity Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cantidad de Entradas</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(false)}
            >
              <Ionicons name="remove" size={20} color={Colors.light.primary} />
            </TouchableOpacity>

            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
            </View>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(true)}
            >
              <Ionicons name="add" size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.quantityNote}>
            Precio por entrada: S/ {ticketType === 'student' ? '0.00' : '5.00'}
          </Text>
        </View>

        {/* User Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <Input
            label="Nombre completo *"
            placeholder="Ingresa tu nombre completo"
            value={userInfo.name}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, name: text }))}
            leftIcon="person-outline"
            returnKeyType="next"
            blurOnSubmit={false}
            autoCapitalize="words"
          />

          <Input
            label="Correo electrónico *"
            placeholder="Ingresa tu correo"
            value={userInfo.email}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, email: text }))}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            blurOnSubmit={false}
          />

          <Input
            label="Teléfono"
            placeholder="Ingresa tu teléfono"
            value={userInfo.phone}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, phone: text }))}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            returnKeyType="next"
            blurOnSubmit={false}
          />

          <Input
            label="Documento de identidad"
            placeholder="Número de documento"
            value={userInfo.document}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, document: text }))}
            leftIcon="id-card-outline"
            keyboardType="numeric"
            returnKeyType="done"
          />
        </View>

        {/* Payment Methods - Solo mostrar si el monto es mayor a 0 */}
        {calculateTotal() > 0 && (
          <PaymentMethodSelector
            selectedMethod={selectedPayment as PaymentMethod}
            onSelect={(method) => setSelectedPayment(method)}
          />
        )}

        {/* Mensaje para tickets gratuitos */}
        {calculateTotal() === 0 && (
          <View style={styles.section}>
            <View style={styles.freeTicketNotice}>
              <Ionicons name="information-circle" size={24} color={Colors.dark.primary} />
              <Text style={styles.freeTicketText}>
                ✨ Las entradas de estudiante son completamente GRATIS. No necesitas seleccionar un método de pago.
              </Text>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen del Pedido</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {quantity} entrada{quantity > 1 ? 's' : ''} ({ticketType === 'student' ? 'Estudiante' : 'General'})
              </Text>
              <Text style={styles.summaryValue}>
                S/ {((ticketType === 'student' ? 0 : 5) * quantity).toFixed(2)}
              </Text>
            </View>


            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>
                S/ {calculateTotal().toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </FormContainer>

      {/* Purchase Button */}
      <View style={[styles.purchaseContainer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <Button
          title={isProcessing
            ? (calculateTotal() === 0 ? 'Generando entradas...' : 'Procesando pago...')
            : (calculateTotal() === 0 ? '🎓 Obtener Entradas Gratis' : `Pagar S/ ${calculateTotal().toFixed(2)}`)
          }
          onPress={handlePurchase}
          style={styles.purchaseButton}
          disabled={isProcessing || (calculateTotal() > 0 && !selectedPayment)}
        />
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator
              size="small"
              color={Colors.dark.primary}
              style={{ marginRight: Spacing.xs }}
            />
            <Text style={styles.processingText}>
              {calculateTotal() === 0
                ? 'Generando tus entradas gratuitas...'
                : 'Confirmando tu pago de forma segura...'
              }
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  eventCard: {
    backgroundColor: Colors.dark.surface,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  eventTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  eventSubtitle: {
    fontSize: FontSizes.md,
    color: '#94A3B8',
    marginBottom: Spacing.md,
  },
  eventDetails: {
    gap: Spacing.sm,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  eventDetailText: {
    fontSize: FontSizes.sm,
    color: '#94A3B8',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.md,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  quantityDisplay: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quantityText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  quantityNote: {
    fontSize: FontSizes.sm,
    color: '#94A3B8',
    textAlign: 'center',
  },
  ticketTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ticketTypeOptionSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
  },
  ticketTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ticketTypeInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  ticketTypeName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ticketTypeNameSelected: {
    color: Colors.dark.primary,
  },
  ticketTypePrice: {
    fontSize: FontSizes.sm,
    color: '#94A3B8',
    marginTop: Spacing.xs / 2,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentMethodSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  paymentMethodName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentMethodNameSelected: {
    color: Colors.dark.primary,
  },
  paymentMethodFee: {
    fontSize: FontSizes.xs,
    color: '#94A3B8',
    marginTop: Spacing.xs / 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.dark.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.primary,
  },
  summaryCard: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSizes.md,
    color: '#94A3B8',
  },
  summaryValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  summaryTotalLabel: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryTotalValue: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.dark.primary,
  },
  purchaseContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    // paddingBottom will be dynamic with insets
  },
  purchaseButton: {
    backgroundColor: Colors.dark.primary,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  processingText: {
    fontSize: FontSizes.sm,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  freeTicketNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    gap: Spacing.md,
  },
  freeTicketText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.dark.textLight,
    lineHeight: 22,
  },
});
