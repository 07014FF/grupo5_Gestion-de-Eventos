import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Input } from '@/components/ui';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';

// Ocultar header
export const options = {
  headerShown: false,
};

interface PaymentMethod {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  fee?: number;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', name: 'Tarjeta de Crédito/Débito', icon: 'card-outline' },
  { id: 'pse', name: 'PSE', icon: 'business-outline', fee: 3000 },
  { id: 'nequi', name: 'Nequi', icon: 'phone-portrait-outline' },
  { id: 'daviplata', name: 'Daviplata', icon: 'wallet-outline' },
];

export default function PurchaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Datos del evento recibidos desde event-detail
  const eventData = {
    id: params.eventId || '1',
    title: params.eventTitle || 'Festival de Jazz 2024',
    subtitle: 'Centro Cultural',
    date: params.eventDate || '2024-03-15',
    time: params.eventTime || '19:30',
    location: params.eventLocation || 'Bogotá',
    price: params.ticketPrice ? parseInt(params.ticketPrice.replace('$', '').replace('.', '')) : 45000,
    availableTickets: 150,
    ticketType: params.ticketType || 'General',
  };

  const [quantity, setQuantity] = useState(parseInt(params.quantity as string) || 1);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
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

  const handlePurchase = () => {
    if (!selectedPayment) {
      Alert.alert('Error', 'Por favor selecciona un método de pago');
      return;
    }

    if (!userInfo.name || !userInfo.email) {
      Alert.alert('Error', 'Por favor completa la información requerida');
      return;
    }

    // Aquí iría la lógica de procesamiento del pago
    Alert.alert(
      'Compra Exitosa',
      `Tu compra de ${quantity} entrada(s) por $${calculateTotal().toLocaleString()} ha sido procesada exitosamente.`,
      [
        {
          text: 'Ver QR',
          onPress: () => router.push('/qr-validation'),
        },
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.light.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
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
          title={`Pagar ${calculateTotal().toLocaleString()}`}
          onPress={handlePurchase}
          style={styles.purchaseButton}
        />
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
  scrollView: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: Colors.light.surface,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  eventTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  eventSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
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
    color: Colors.light.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
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
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  quantityDisplay: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quantityText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
  },
  quantityNote: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  paymentMethodSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.backgroundSecondary,
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
    color: Colors.light.text,
  },
  paymentMethodNameSelected: {
    color: Colors.light.primary,
  },
  paymentMethodFee: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs / 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.light.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  summaryCard: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  summaryTotalLabel: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryTotalValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  purchaseContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  purchaseButton: {
    backgroundColor: Colors.light.primary,
  },
});