import { Button, Input } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { TicketServiceSupabase } from '@/services/ticket.service.supabase';
import { PaymentService, PaymentGateway } from '@/services/payment.service';
import { Event, PaymentMethod, UserInfo } from '@/types/ticket.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Ocultar header
export const options = {
  headerShown: false,
};

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  fee?: number;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'card', name: 'Tarjeta de Crédito/Débito', icon: 'card-outline' },
  { id: 'pse', name: 'PSE', icon: 'business-outline', fee: 3000 },
  { id: 'nequi', name: 'Nequi', icon: 'phone-portrait-outline' },
  { id: 'daviplata', name: 'Daviplata', icon: 'wallet-outline' },
];

export default function PurchaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  // Redirigir si el usuario no está autenticado
  useEffect(() => {
    if (!user) {
      router.push('/login-modal');
    }
  }, [user, router]);

  // Helper function to ensure string type
  const toStringParam = (param: string | string[] | undefined, defaultValue: string): string => {
    if (!param) return defaultValue;
    return Array.isArray(param) ? param[0] : param;
  };

  // Datos del evento recibidos desde event-detail
  const eventData = {
    id: toStringParam(params.eventId, '1'),
    title: toStringParam(params.eventTitle, 'Festival de Jazz 2024'),
    subtitle: 'Centro Cultural',
    date: toStringParam(params.eventDate, '2024-03-15'),
    time: toStringParam(params.eventTime, '19:30'),
    location: toStringParam(params.eventLocation, 'Bogotá'),
    price: params.ticketPrice ? parseInt((Array.isArray(params.ticketPrice) ? params.ticketPrice[0] : params.ticketPrice).replace('$', '').replace('.', '')) : 45000,
    availableTickets: 150,
    ticketType: toStringParam(params.ticketType, 'General'),
  };

  const [quantity, setQuantity] = useState(parseInt(params.quantity as string) || 1);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: user?.name || '',
    email: user?.email || 'correo@prueba.com', // Simulado
    phone: '',
    document: '',
  });

  const calculateTotal = () => {
    const subtotal = eventData.price * quantity;
    const selectedMethod = PAYMENT_METHODS.find(m => m.id === selectedPayment);
    const fee = selectedMethod?.fee || 0;
    return subtotal + fee;
  };

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setQuantity(prev => Math.min(prev + 1, 5)); // Máximo 5 boletos
    } else {
      setQuantity(prev => Math.max(prev - 1, 1)); // Mínimo 1 boleto
    }
  };

  const handlePurchase = async () => {
    if (!selectedPayment) {
      Alert.alert('Error', 'Por favor selecciona un método de pago');
      return;
    }

    if (!userInfo.name || !userInfo.email) {
      Alert.alert('Error', 'Por favor completa la información requerida');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión para comprar entradas');
      return;
    }

    setIsProcessing(true);

    try {
      // Configurar pasarela de pago (cambiar a WOMPI, STRIPE, etc. según necesites)
      PaymentService.setGateway(PaymentGateway.MOCK); // Para desarrollo
      // PaymentService.setGateway(PaymentGateway.WOMPI); // Para producción

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
          '🎉 ¡Compra Exitosa!',
          `Tu compra de ${quantity} entrada(s) por $${calculateTotal().toLocaleString()} ha sido procesada exitosamente.\n\nID de transacción: ${payment.transactionId || payment.paymentId}`,
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
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.dark.background} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comprar Entrada</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            Precio por entrada: ${eventData.price.toLocaleString()}
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
          />

          <Input
            label="Correo electrónico *"
            placeholder="Ingresa tu correo"
            value={userInfo.email}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, email: text }))}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Teléfono"
            placeholder="Ingresa tu teléfono"
            value={userInfo.phone}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, phone: text }))}
            leftIcon="call-outline"
            keyboardType="phone-pad"
          />

          <Input
            label="Documento de identidad"
            placeholder="Número de documento"
            value={userInfo.document}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, document: text }))}
            leftIcon="id-card-outline"
            keyboardType="numeric"
          />
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de Pago</Text>

          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedPayment === method.id && styles.paymentMethodSelected
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <View style={styles.paymentMethodContent}>
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={selectedPayment === method.id ? Colors.light.primary : Colors.light.icon}
                />
                <View style={styles.paymentMethodInfo}>
                  <Text style={[
                    styles.paymentMethodName,
                    selectedPayment === method.id && styles.paymentMethodNameSelected
                  ]}>
                    {method.name}
                  </Text>
                  {method.fee && (
                    <Text style={styles.paymentMethodFee}>
                      Tarifa: ${method.fee.toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>

              <View style={[
                styles.radioButton,
                selectedPayment === method.id && styles.radioButtonSelected
              ]}>
                {selectedPayment === method.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen del Pedido</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {quantity} entrada{quantity > 1 ? 's' : ''} {eventData.ticketType}
              </Text>
              <Text style={styles.summaryValue}>
                ${(eventData.price * quantity).toLocaleString()}
              </Text>
            </View>

            {selectedPayment && PAYMENT_METHODS.find(m => m.id === selectedPayment)?.fee && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tarifa de procesamiento</Text>
                <Text style={styles.summaryValue}>
                  ${PAYMENT_METHODS.find(m => m.id === selectedPayment)?.fee?.toLocaleString()}
                </Text>
              </View>
            )}

            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>
                ${calculateTotal().toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Purchase Button */}
      <View style={styles.purchaseContainer}>
        <Button
          title={isProcessing ? 'Procesando...' : `Pagar $${calculateTotal().toLocaleString()}`}
          onPress={handlePurchase}
          style={styles.purchaseButton}
          disabled={isProcessing}
        />
        {isProcessing && (
          <ActivityIndicator
            size="small"
            color={Colors.light.primary}
            style={{ marginTop: Spacing.sm }}
          />
        )}
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
  scrollView: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: Colors.dark.surface,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  },
  purchaseButton: {
    backgroundColor: Colors.dark.primary,
  },
});
