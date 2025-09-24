import { Badge, Button } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Opciones de la pantalla
export const options = {
  headerShown: false,
};

const { height } = Dimensions.get('window');

// Datos de ejemplo para el evento seleccionado
const EVENT_DETAIL = {
  id: '1',
  title: 'Festival de Jazz Internacional 2024',
  subtitle: 'Centro Cultural Metropolitano',
  description: 'Una experiencia musical única con los mejores artistas de jazz del mundo. Tres días de música, cultura y entretenimiento en el corazón de la ciudad.',
  fullDescription: `El Festival de Jazz Internacional 2024 regresa con una propuesta renovada que celebra la riqueza del jazz contemporáneo. Este evento, que se ha convertido en el más importante de América Latina, presenta una selección excepcional de artistas que han marcado la historia musical.

🎵 LINEUP DESTACADO:
• Marcus Miller - Legendario bajista de jazz-fusion
• Esperanza Spalding - Ganadora del Grammy por Mejor Álbum de Jazz
• Hiromi Uehara - Virtuosa pianista japonesa
• Artistas nacionales reconocidos internacionalmente

🍽️ EXPERIENCIA GASTRONÓMICA:
• Food trucks especializados en cocina internacional
• Zona VIP con servicio de alta cocina
• Bares temáticos con cocteles inspirados en el jazz

🎪 ACTIVIDADES COMPLEMENTARIAS:
• Talleres magistrales con los artistas invitados
• Zona de arte y cultura urbana
• Meet & greet exclusivos
• Tienda oficial con merchandise único

El Centro Cultural Metropolitano, con su arquitectura histórica perfectamente restaurada y acústica de clase mundial, proporciona el escenario ideal para esta celebración musical. Con múltiples escenarios simultáneos y zonas de entretenimiento, este festival promete una experiencia inmersiva e inolvidable.`,
  imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600',
  price: 'S/ 5.00',
  originalPrice: null,
  status: 'available' as const,
  category: 'Música',
  date: '15-17 Mar 2024',
  time: '18:00 - 02:00',
  duration: '3 días',
  location: 'Centro Cultural Metropolitano',
  address: 'Carrera 7 #32-16, Zona Rosa, Bogotá',
  organizer: 'Fundación Jazz Latinoamérica',
  capacity: '5,000 personas',
  availableTickets: 150,
  rating: 4.8,
  attendees: '15K+',
  ticketTypes: [
    {
      id: '1',
      name: 'General',
      price: 'S/ 5.00',
      originalPrice: null,
      available: 80,
      description: 'Acceso a todos los escenarios principales y actividades generales'
    },
    {
      id: '2',
      name: 'Estudiante',
      price: 'Gratis',
      originalPrice: null,
      available: 25,
      description: 'Tarifa especial para estudiantes (requiere verificación académica)'
    },
  ],
  gallery: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400',
    'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  ],
};

export default function EventDetailScreen() {
  const router = useRouter();
  const [selectedTicketType, setSelectedTicketType] = useState(EVENT_DETAIL.ticketTypes[0]);
  const [quantity, setQuantity] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const handleGoBack = () => {
    router.back();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Mira este evento! ${EVENT_DETAIL.title} - ${EVENT_DETAIL.date} en ${EVENT_DETAIL.location}. ${EVENT_DETAIL.description}`,
        url: EVENT_DETAIL.imageUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePurchase = () => {
    router.push({
      pathname: '/purchase',
      params: {
        eventId: EVENT_DETAIL.id,
        eventTitle: EVENT_DETAIL.title,
        ticketType: selectedTicketType.name,
        ticketPrice: selectedTicketType.price,
        quantity: quantity.toString(),
        eventDate: EVENT_DETAIL.date,
        eventTime: EVENT_DETAIL.time,
        eventLocation: EVENT_DETAIL.location
      }
    });
  };

  const increaseQuantity = () => {
    if (quantity < selectedTicketType.available) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const getTotalPrice = () => {
    if (selectedTicketType.price === 'Gratis') {
      return 'Gratis';
    }
    const price = selectedTicketType.price.replace('S/ ', '').replace(',', '.');
    const total = parseFloat(price) * quantity;
    return `S/ ${total.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: EVENT_DETAIL.imageUrl }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <View style={styles.heroHeader}>
              <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Ionicons name="arrow-back" size={24} color={Colors.light.textLight} />
              </TouchableOpacity>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                  <Ionicons name="share-outline" size={24} color={Colors.light.textLight} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {EVENT_DETAIL.status === 'soldOut' && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>AGOTADO</Text>
            </View>
          )}
        </View>

        {/* Event Info */}
        <View style={styles.contentContainer}>
          <View style={styles.eventHeader}>
            <Badge text={EVENT_DETAIL.category} variant="info" size="medium" />
            <Text style={styles.eventTitle}>{EVENT_DETAIL.title}</Text>
            <Text style={styles.eventSubtitle}>{EVENT_DETAIL.subtitle}</Text>
          </View>

          {/* Event Stats */}
          <View style={styles.eventStats}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.statText}>{EVENT_DETAIL.rating}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={Colors.light.primary} />
              <Text style={styles.statText}>{EVENT_DETAIL.attendees}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="ticket" size={16} color={Colors.light.secondary} />
              <Text style={styles.statText}>{EVENT_DETAIL.availableTickets} disponibles</Text>
            </View>
          </View>

          {/* Event Details */}
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.detailText}>{EVENT_DETAIL.date} • {EVENT_DETAIL.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.detailText}>Duración: {EVENT_DETAIL.duration}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.detailText}>{EVENT_DETAIL.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="map-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.detailText}>{EVENT_DETAIL.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.detailText}>{EVENT_DETAIL.organizer}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>
              {showFullDescription ? EVENT_DETAIL.fullDescription : EVENT_DETAIL.description}
            </Text>
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={() => setShowFullDescription(!showFullDescription)}
            >
              <Text style={styles.readMoreText}>
                {showFullDescription ? 'Ver menos' : 'Leer más'}
              </Text>
            </TouchableOpacity>
          </View>


          {/* Gallery */}
          <View style={styles.galleryContainer}>
            <Text style={styles.sectionTitle}>Galería</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {EVENT_DETAIL.gallery.map((image, index) => (
                <Image key={index} source={{ uri: image }} style={styles.galleryImage} />
              ))}
            </ScrollView>
          </View>

        </View>
      </ScrollView>

      {/* Purchase Section */}
      {EVENT_DETAIL.status === 'available' && (
        <View style={styles.purchaseContainer}>
          <View style={styles.purchaseContent}>
            {/* Ticket Type Selection */}
            <View style={styles.ticketTypeContainer}>
              <Text style={styles.ticketTypeTitle}>Selecciona tu entrada:</Text>
              {EVENT_DETAIL.ticketTypes.map((ticketType) => (
                <TouchableOpacity
                  key={ticketType.id}
                  style={[
                    styles.ticketTypeCard,
                    selectedTicketType.id === ticketType.id && styles.ticketTypeCardActive
                  ]}
                  onPress={() => {
                    setSelectedTicketType(ticketType);
                    setQuantity(1); // Reset quantity when changing ticket type
                  }}
                >
                  <View style={styles.ticketTypeHeader}>
                    <View style={styles.ticketTypeInfo}>
                      <Text style={[
                        styles.ticketTypeName,
                        selectedTicketType.id === ticketType.id && styles.ticketTypeNameActive
                      ]}>
                        {ticketType.name}
                      </Text>
                      <Text style={[
                        styles.ticketTypeDescription,
                        selectedTicketType.id === ticketType.id && styles.ticketTypeDescriptionActive
                      ]}>
                        {ticketType.description}
                      </Text>
                    </View>
                    <View style={styles.ticketTypePricing}>
                      {ticketType.originalPrice && ticketType.originalPrice !== ticketType.price && (
                        <Text style={[
                          styles.ticketTypeOriginalPrice,
                          selectedTicketType.id === ticketType.id && styles.ticketTypeOriginalPriceActive
                        ]}>
                          {ticketType.originalPrice}
                        </Text>
                      )}
                      <Text style={[
                        styles.ticketTypePrice,
                        selectedTicketType.id === ticketType.id && styles.ticketTypePriceActive
                      ]}>
                        {ticketType.price}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ticketTypeAvailability}>
                    <Text style={[
                      styles.ticketTypeAvailable,
                      selectedTicketType.id === ticketType.id && styles.ticketTypeAvailableActive
                    ]}>
                      {ticketType.available} disponibles
                    </Text>
                    {selectedTicketType.id === ticketType.id && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quantity and Price */}
            <View style={styles.quantityContainer}>
              <View style={styles.quantityControls}>
                <Text style={styles.quantityLabel}>Cantidad:</Text>
                <View style={styles.quantityButtons}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={decreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    <Ionicons name="remove" size={20} color={quantity <= 1 ? Colors.light.textSecondary : Colors.light.primary} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={increaseQuantity}
                    disabled={quantity >= selectedTicketType.available}
                  >
                    <Ionicons name="add" size={20} color={quantity >= selectedTicketType.available ? Colors.light.textSecondary : Colors.light.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalPrice}>{getTotalPrice()}</Text>
              </View>
            </View>

            {/* Purchase Button */}
            <Button
              title="Comprar Entradas"
              variant="primary"
              onPress={handlePurchase}
              style={styles.purchaseButton}
              leftIcon="ticket-outline"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    position: 'relative',
    height: height * 0.4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(107, 207, 124, 0.3)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 20,
  },
  backButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(107, 207, 124, 0.7)',
    borderRadius: BorderRadius.round,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(107, 207, 124, 0.7)',
    borderRadius: BorderRadius.round,
  },
  soldOutBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -25 }],
    backgroundColor: Colors.light.error,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  soldOutText: {
    color: Colors.light.textLight,
    fontWeight: '700',
    fontSize: FontSizes.lg,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: -20,
    paddingTop: Spacing.lg,
  },
  eventHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  eventTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: Colors.light.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    lineHeight: 36,
  },
  eventSubtitle: {
    fontSize: FontSizes.lg,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  eventStats: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  statText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
  },
  eventDetails: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    flex: 1,
  },
  descriptionContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  readMoreButton: {
    marginTop: Spacing.sm,
  },
  readMoreText: {
    fontSize: FontSizes.md,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  galleryContainer: {
    marginBottom: Spacing.lg,
  },
  galleryImage: {
    width: 120,
    height: 80,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.lg,
    marginRight: Spacing.xs,
  },
  purchaseContainer: {
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    elevation: 0, // Quitar la elevación en Android
    shadowColor: 'transparent', // Quitar la sombra en iOS
  },
  purchaseContent: {
    padding: Spacing.lg,
  },
  ticketTypeContainer: {
    marginBottom: Spacing.lg,
  },
  ticketTypeTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  ticketTypeCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  ticketTypeCardActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  ticketTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.md,
  },
  ticketTypeInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  ticketTypeName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.xs / 2,
  },
  ticketTypeNameActive: {
    color: Colors.light.primary,
  },
  ticketTypeDescription: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  ticketTypeDescriptionActive: {
    color: Colors.light.text,
  },
  ticketTypePricing: {
    alignItems: 'flex-end',
  },
  ticketTypeOriginalPrice: {
    fontSize: FontSizes.sm,
    color: Colors.light.textMuted,
    textDecorationLine: 'line-through',
    marginBottom: Spacing.xs / 2,
  },
  ticketTypeOriginalPriceActive: {
    color: Colors.light.textSecondary,
  },
  ticketTypePrice: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.light.text,
  },
  ticketTypePriceActive: {
    color: Colors.light.primary,
  },
  ticketTypeAvailability: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  ticketTypeAvailable: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  ticketTypeAvailableActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quantityLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
  },
  quantityButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
  },
  quantityButton: {
    padding: Spacing.sm,
  },
  quantityText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    paddingHorizontal: Spacing.md,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  totalPrice: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  purchaseButton: {
    paddingVertical: Spacing.md,
  },
});