import { Button } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    ImageBackground,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShareService } from '@/services/share.service';
import { eventDetailParamsSchema, type EventDetailParams, type PurchaseParams } from '@/types/navigation.types';
import { Event } from '@/types/ticket.types';
import { normalizeSearchParams, parsePrice } from '@/utils/navigation';

// Opciones de la pantalla
export const options = {
  headerShown: false,
};

const { height } = Dimensions.get('window');

const FALLBACK_EVENT_PARAMS: EventDetailParams = {
  eventId: 'fallback',
  eventTitle: 'Evento',
  eventDate: '',
  eventTime: '',
  eventLocation: '',
  ticketPrice: '0',
  eventDescription: '',
  eventCategory: '',
  eventImageUrl: '',
};

export default function EventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'about' | 'participants'>('about');
  const { isDark } = useTheme();
  const palette = useThemeColors();
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);

  const eventParams = useMemo<EventDetailParams>(() => {
    const normalized = normalizeSearchParams(params);
    const result = eventDetailParamsSchema.safeParse(normalized);

    if (!result.success) {
      console.error('Parámetros inválidos para el detalle del evento', result.error.flatten().fieldErrors);
      return FALLBACK_EVENT_PARAMS;
    }

    return result.data;
  }, [params]);

  const ticketPriceValue = useMemo(
    () => parsePrice(eventParams.ticketPrice),
    [eventParams.ticketPrice]
  );

  const purchaseParams = useMemo<PurchaseParams>(
    () => ({
      eventId: eventParams.eventId,
      eventTitle: eventParams.eventTitle,
      eventDate: eventParams.eventDate,
      eventTime: eventParams.eventTime,
      eventLocation: eventParams.eventLocation,
      ticketPrice: eventParams.ticketPrice,
      ticketType: 'general',
      quantity: '1',
    }),
    [eventParams]
  );

  // Format date for display (assuming format like "2024-12-25")
  const formatDate = (dateStr: string) => {
    if (!dateStr) return { month: 'TBD', day: '00' };
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate().toString().padStart(2, '0');
    return { month, day };
  };

  const { month, day } = formatDate(eventParams.eventDate);

  const handleGoBack = () => {
    router.back();
  };

  const handlePurchase = () => {
    router.push({
      pathname: '/purchase',
      params: purchaseParams,
    });
  };

  const handleBookmark = () => {
    // TODO: Implementar lógica de favoritos con AsyncStorage
    console.log('Agregar a favoritos:', eventParams.eventId);
  };

  const handleShare = async () => {
    const event: Event = {
      id: eventParams.eventId,
      title: eventParams.eventTitle,
      date: eventParams.eventDate,
      time: eventParams.eventTime,
      location: eventParams.eventLocation,
      venue: eventParams.eventLocation || undefined,
      price: ticketPriceValue,
      description: eventParams.eventDescription || undefined,
      category: eventParams.eventCategory || undefined,
      imageUrl: eventParams.eventImageUrl || undefined,
      availableTickets: 0,
      studentPrice: 0,
      generalPrice: ticketPriceValue,
    };

    await ShareService.shareEvent(event);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image with Overlay */}
        <ImageBackground
          source={{
            uri:
              eventParams.eventImageUrl ||
              'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
          }}
          style={styles.heroImage}
          imageStyle={styles.heroImageStyle}
        >
          {/* Dark Gradient Overlay */}
          <View style={styles.heroOverlay} />

          {/* Top Bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={styles.iconButton} onPress={handleGoBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.iconButton} onPress={handleBookmark}>
                <Ionicons name="heart-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Overlay */}
          <View style={styles.heroContent}>
            {/* Category Badge */}
            {eventParams.eventCategory && (
              <View style={styles.showBadge}>
                <Text style={styles.showBadgeText}>
                  {eventParams.eventCategory.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Title */}
            <Text style={styles.heroTitle}>{eventParams.eventTitle}</Text>

            {/* Start Time */}
            <Text style={styles.heroStartTime}>
              {eventParams.eventTime
                ? `${eventParams.eventDate} • ${eventParams.eventTime}`
                : eventParams.eventDate}
            </Text>
          </View>

          {/* Date Badge - Top Right */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeMonth}>{month}</Text>
            <Text style={styles.dateBadgeDay}>{day}</Text>
          </View>
        </ImageBackground>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'about' && styles.tabActive]}
              onPress={() => setActiveTab('about')}
            >
              <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
                ACERCA DE
              </Text>
              {activeTab === 'about' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'participants' && styles.tabActive]}
              onPress={() => setActiveTab('participants')}
            >
              <Text style={[styles.tabText, activeTab === 'participants' && styles.tabTextActive]}>
                PARTICIPANTES
              </Text>
              {activeTab === 'participants' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'about' && (
              <>
                <Text style={styles.description}>
                  {eventParams.eventDescription || 'Información del evento no disponible.'}
                </Text>

                {/* Location Section */}
                <View style={styles.locationSection}>
                  <Text style={styles.sectionTitle}>UBICACIÓN</Text>
                  {eventParams.eventLocation ? (
                    <View style={styles.locationInfo}>
                      <Ionicons name="location" size={20} color={palette.primary} />
                      <Text style={styles.locationText}>{eventParams.eventLocation}</Text>
                    </View>
                  ) : (
                    <View style={styles.locationPlaceholder}>
                      <Ionicons name="location-outline" size={24} color={palette.textMuted} />
                      <Text style={styles.locationPlaceholderText}>Ubicación por confirmar</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {activeTab === 'participants' && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Aún no hay participantes</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Purchase Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>PRECIO</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>S/ {ticketPriceValue.toFixed(2)}</Text>
            <Text style={styles.priceUnit}>/persona</Text>
          </View>
        </View>

        <Button
          title="COMPRAR ENTRADA"
          variant="primary"
          onPress={handlePurchase}
          style={styles.buyButton}
        />
      </View>
    </View>
  );
}

const createStyles = (palette: typeof Colors.dark, isDark: boolean) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background, // Unified with Home
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // paddingBottom will be dynamic with insets
  },
  heroImage: {
    height: height * 0.5,
    width: '100%',
  },
  heroImageStyle: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    // paddingTop will be dynamic with insets
  },
  topBarRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  showBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  showBadgeText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.xs,
    lineHeight: 44,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroStartTime: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  dateBadge: {
    position: 'absolute',
    top: Spacing.xl + 60,
    right: Spacing.xl,
    backgroundColor: palette.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minWidth: 60,
  },
  dateBadgeMonth: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  dateBadgeDay: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
  },
  contentSection: {
    backgroundColor: palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  tab: {
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: palette.textMuted,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: palette.text,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: palette.primary,
  },
  tabContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  description: {
    fontSize: FontSizes.md,
    color: palette.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  locationSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: palette.text,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: palette.surface,
    borderRadius: BorderRadius.lg,
  },
  locationText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  locationPlaceholder: {
    height: 120,
    backgroundColor: palette.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  locationPlaceholderText: {
    fontSize: FontSizes.sm,
    color: palette.textMuted,
  },
  emptyState: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FontSizes.md,
    color: palette.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.surface,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    // paddingBottom will be dynamic with insets
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: palette.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.text,
  },
  priceUnit: {
    fontSize: FontSizes.sm,
    color: palette.textSecondary,
    marginLeft: 4,
  },
  buyButton: {
    flex: 1.2,
    backgroundColor: palette.buttonPrimary,
    paddingVertical: Spacing.md + 2,
  },
});
