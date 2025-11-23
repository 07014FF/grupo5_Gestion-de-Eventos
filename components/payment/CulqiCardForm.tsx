/**
 * Culqi Card Form Component
 * Formulario seguro para capturar datos de tarjeta y tokenizar con Culqi
 *
 * Siguiendo mejores prácticas de seguridad PCI-DSS:
 * - No guarda datos de tarjeta en el estado de la app
 * - Tokeniza inmediatamente antes de enviar al servidor
 * - Valida datos del lado del cliente
 */

import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CULQI_TEST_CARDS, CulqiService, CulqiToken } from '@/services/culqi.service';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CulqiCardFormProps {
  amount: number;
  email: string;
  onTokenCreated: (token: CulqiToken) => void;
  onCancel: () => void;
}

export const CulqiCardForm: React.FC<CulqiCardFormProps> = ({
  amount,
  email,
  onTokenCreated,
  onCancel,
}) => {
  const colors = useThemeColors();

  // Estado del formulario
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTestCards, setShowTestCards] = useState(true);

  // Validaciones
  const [errors, setErrors] = useState<{
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
  }>({});

  const formattedAmount = (amount / 100).toFixed(2);

  // --------------------------------------------------------------------------
  // VALIDACIONES
  // --------------------------------------------------------------------------

  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.length < 13) {
      setErrors(prev => ({ ...prev, cardNumber: 'Número de tarjeta incompleto' }));
      return false;
    }
    if (!CulqiService.validateCardNumber(cleaned)) {
      setErrors(prev => ({ ...prev, cardNumber: 'Número de tarjeta inválido' }));
      return false;
    }
    setErrors(prev => ({ ...prev, cardNumber: undefined }));
    return true;
  };

  const validateExpiry = (): boolean => {
    if (!expiryMonth || !expiryYear) {
      setErrors(prev => ({ ...prev, expiry: 'Fecha de expiración requerida' }));
      return false;
    }

    const month = parseInt(expiryMonth, 10);
    const year = parseInt(expiryYear, 10);

    if (month < 1 || month > 12) {
      setErrors(prev => ({ ...prev, expiry: 'Mes inválido' }));
      return false;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      setErrors(prev => ({ ...prev, expiry: 'Tarjeta expirada' }));
      return false;
    }

    setErrors(prev => ({ ...prev, expiry: undefined }));
    return true;
  };

  const validateCvv = (): boolean => {
    if (cvv.length < 3) {
      setErrors(prev => ({ ...prev, cvv: 'CVV incompleto' }));
      return false;
    }
    setErrors(prev => ({ ...prev, cvv: undefined }));
    return true;
  };

  // --------------------------------------------------------------------------
  // FORMATEO
  // --------------------------------------------------------------------------

  const handleCardNumberChange = (text: string) => {
    // Solo números
    const cleaned = text.replace(/\D/g, '');
    // Formatear con espacios cada 4 dígitos
    const formatted = CulqiService.formatCardNumber(cleaned);
    setCardNumber(formatted);

    // Validar si está completo
    if (cleaned.length >= 13) {
      validateCardNumber(formatted);
    }
  };

  const handleExpiryMonthChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 2);
    setExpiryMonth(cleaned);
  };

  const handleExpiryYearChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    setExpiryYear(cleaned);
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    setCvv(cleaned);
  };

  // --------------------------------------------------------------------------
  // AUTO-COMPLETAR TARJETA DE PRUEBA
  // --------------------------------------------------------------------------

  const fillTestCard = (cardData: typeof CULQI_TEST_CARDS.visa.success) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCardNumber(CulqiService.formatCardNumber(cardData.number));
    setCvv(cardData.cvv);
    setExpiryMonth(cardData.month);
    setExpiryYear(cardData.year);
    setShowTestCards(false);
  };

  // --------------------------------------------------------------------------
  // TOKENIZACIÓN
  // --------------------------------------------------------------------------

  const handleTokenize = async () => {
    // Validar campos básicos
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'El número de tarjeta debe tener al menos 13 dígitos.');
      return;
    }

    if (!expiryMonth || !expiryYear) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Por favor ingresa la fecha de expiración.');
      return;
    }

    if (!cvv || cvv.length < 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Por favor ingresa el CVV.');
      return;
    }

    // En desarrollo, permitir cualquier número
    // En producción, validar con algoritmo de Luhn
    if (!__DEV__) {
      const isCardValid = validateCardNumber(cardNumber);
      const isExpiryValid = validateExpiry();
      const isCvvValid = validateCvv();

      if (!isCardValid || !isExpiryValid || !isCvvValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Datos incompletos', 'Por favor completa todos los campos correctamente.');
        return;
      }
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('🔐 Iniciando tokenización con Culqi...');

      const result = await CulqiService.createToken({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cvv,
        expirationMonth: expiryMonth,
        expirationYear: expiryYear,
        email,
      });

      if (!result.success) {
        throw new Error(result.error.getUserMessage());
      }

      const token = result.data;
      console.log('✅ Token creado exitosamente:', token.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Limpiar formulario por seguridad
      setCardNumber('');
      setCvv('');
      setExpiryMonth('');
      setExpiryYear('');

      // Enviar token al padre
      onTokenCreated(token);

    } catch (error: any) {
      console.error('❌ Error al tokenizar:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        'Error al procesar tarjeta',
        error.message || 'No se pudo procesar la tarjeta. Verifica los datos e intenta nuevamente.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  const cardBrand = CulqiService.detectCardBrand(cardNumber);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.dark.surface }]}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Pago con Tarjeta
        </Text>
        <Text style={[styles.headerAmount, { color: Colors.dark.primary }]}>
          S/ {formattedAmount}
        </Text>
      </View>

      {/* Tarjetas de prueba */}
      {showTestCards && (
        <View style={[styles.testCardsSection, { backgroundColor: colors.surfaceElevated }]}>
          <View style={styles.testCardsHeader}>
            <Ionicons name="flask" size={20} color={Colors.dark.warning} />
            <Text style={[styles.testCardsTitle, { color: colors.text }]}>
              Modo Sandbox - Tarjetas de Prueba
            </Text>
          </View>

          <Text style={[styles.testCardsDescription, { color: colors.textSecondary }]}>
            ✨ Puedes usar estas tarjetas o CUALQUIER número de 16 dígitos:
          </Text>

          <TouchableOpacity
            style={[styles.testCard, { backgroundColor: colors.surface }]}
            onPress={() => fillTestCard(CULQI_TEST_CARDS.visa.success)}
          >
            <View style={styles.testCardContent}>
              <Text style={styles.testCardBrand}>💳 Visa</Text>
              <Text style={[styles.testCardNumber, { color: colors.text }]}>
                {CulqiService.formatCardNumber(CULQI_TEST_CARDS.visa.success.number)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testCard, { backgroundColor: colors.surface }]}
            onPress={() => fillTestCard(CULQI_TEST_CARDS.mastercard.success)}
          >
            <View style={styles.testCardContent}>
              <Text style={styles.testCardBrand}>💳 Mastercard</Text>
              <Text style={[styles.testCardNumber, { color: colors.text }]}>
                {CulqiService.formatCardNumber(CULQI_TEST_CARDS.mastercard.success.number)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowTestCards(false)}
            style={styles.hideTestCardsButton}
          >
            <Text style={[styles.hideTestCardsText, { color: Colors.dark.primary }]}>
              Ocultar tarjetas de prueba
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Formulario de tarjeta */}
      <View style={styles.formContainer}>
        {/* Número de tarjeta */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Número de Tarjeta</Text>
          <View style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: errors.cardNumber ? Colors.dark.error : colors.border }
          ]}>
            <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
            <TextInput
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              maxLength={19}
              style={[styles.input, { color: colors.text }]}
              editable={!isProcessing}
            />
            {cardBrand !== 'Unknown' && (
              <Text style={styles.cardBrandBadge}>{cardBrand}</Text>
            )}
          </View>
          {errors.cardNumber && (
            <Text style={styles.errorText}>{errors.cardNumber}</Text>
          )}
        </View>

        {/* Fecha de expiración y CVV */}
        <View style={styles.row}>
          {/* Expiración */}
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, { color: colors.text }]}>Expiración</Text>
            <View style={styles.expiryRow}>
              <View style={[
                styles.inputContainer,
                styles.expiryInput,
                { backgroundColor: colors.surface, borderColor: errors.expiry ? Colors.dark.error : colors.border }
              ]}>
                <TextInput
                  value={expiryMonth}
                  onChangeText={handleExpiryMonthChange}
                  placeholder="MM"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={2}
                  style={[styles.input, { color: colors.text, textAlign: 'center' }]}
                  editable={!isProcessing}
                />
              </View>
              <Text style={[styles.expirySlash, { color: colors.textSecondary }]}>/</Text>
              <View style={[
                styles.inputContainer,
                styles.expiryInput,
                { backgroundColor: colors.surface, borderColor: errors.expiry ? Colors.dark.error : colors.border }
              ]}>
                <TextInput
                  value={expiryYear}
                  onChangeText={handleExpiryYearChange}
                  placeholder="AAAA"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={4}
                  style={[styles.input, { color: colors.text, textAlign: 'center' }]}
                  editable={!isProcessing}
                />
              </View>
            </View>
            {errors.expiry && (
              <Text style={styles.errorText}>{errors.expiry}</Text>
            )}
          </View>

          {/* CVV */}
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, { color: colors.text }]}>CVV</Text>
            <View style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: errors.cvv ? Colors.dark.error : colors.border }
            ]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <TextInput
                value={cvv}
                onChangeText={handleCvvChange}
                placeholder="123"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                style={[styles.input, { color: colors.text }]}
                editable={!isProcessing}
              />
            </View>
            {errors.cvv && (
              <Text style={styles.errorText}>{errors.cvv}</Text>
            )}
          </View>
        </View>

        {/* Info de seguridad */}
        <View style={[styles.securityInfo, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.dark.success} />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Tu información está protegida con encriptación de nivel bancario.
            Culqi no almacena tus datos de tarjeta.
          </Text>
        </View>
      </View>

      {/* Botón de pago */}
      <TouchableOpacity
        style={[
          styles.payButton,
          { backgroundColor: Colors.dark.primary },
          isProcessing && styles.payButtonDisabled,
          Shadows.lg,
        ]}
        onPress={handleTokenize}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
            <Text style={styles.payButtonText}>
              Pagar S/ {formattedAmount}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Footer con logo de Culqi */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Procesado de forma segura por
        </Text>
        <Text style={[styles.culqiLogo, { color: Colors.dark.primary }]}>Culqi</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginTop: Spacing.lg,
  },
  headerAmount: {
    fontSize: 36,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  testCardsSection: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  testCardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  testCardsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  testCardsDescription: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  testCardContent: {
    flex: 1,
  },
  testCardBrand: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  testCardNumber: {
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
  },
  hideTestCardsButton: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  hideTestCardsText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  formContainer: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    paddingVertical: Spacing.xs,
  },
  cardBrandBadge: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.dark.primary,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  expiryInput: {
    flex: 1,
  },
  expirySlash: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  errorText: {
    fontSize: FontSizes.xs,
    color: Colors.dark.error,
    marginTop: 4,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  securityText: {
    flex: 1,
    fontSize: FontSizes.xs,
    lineHeight: 16,
  },
  payButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: 4,
  },
  footerText: {
    fontSize: FontSizes.xs,
  },
  culqiLogo: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
});
