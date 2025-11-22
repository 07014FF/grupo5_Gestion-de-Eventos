import { Button } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventService } from '@/services/event.service';
import type { EventDetailParams, PurchaseParams } from '@/types/navigation.types';
import { Event } from '@/types/ticket.types';
import { ErrorHandler } from '@/utils/errors';

const DEFAULT_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&auto=format&fit=crop';
const IMAGE_PLACEHOLDER = { blurhash: 'L5H2EC=PM+yV0g-mq.wG9c010J}' };
const POPULAR_CARD_WIDTH = 200;
const POPULAR_CARD_FULL_WIDTH = POPULAR_CARD_WIDTH + Spacing.md;

const buildEventDetailParams = (event: Event): EventDetailParams => ({
  eventId: event.id,
  eventTitle: event.title,
  eventDate: event.date,
  eventTime: event.time,
  eventLocation: event.location,
  ticketPrice: event.price.toString(),
  eventDescription: event.description ?? '',
  eventCategory: event.category ?? '',
  eventImageUrl: event.imageUrl ?? '',
});

const buildPurchaseParams = (event: Event): PurchaseParams => ({
  eventId: event.id,
  eventTitle: event.title,
  eventDate: event.date,
  eventTime: event.time,
  eventLocation: event.location,
  ticketPrice: event.price.toString(),
  ticketType: 'general',
  quantity: '1',
});

// Helper function to get event status
const getEventStatus = (eventDate: string): { status: 'past' | 'upcoming' | 'available'; label: string; color: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDateObj = new Date(eventDate);
  eventDateObj.setHours(0, 0, 0, 0);

  const diffTime = eventDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'past', label: 'Finalizado', color: '#71717A' }; // Gris neutro
  } else if (diffDays <= 7) {
    return { status: 'upcoming', label: 'Próximo', color: '#F59E0B' }; // Naranja/Amarillo
  } else {
    return { status: 'available', label: 'Disponible', color: '#10B981' }; // Verde
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const location = 'Perú';
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [eventDateFilter, setEventDateFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const { isDark } = useTheme();
  const palette = isDark ? Colors.dark : Colors.light;
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setErrorBanner(null);
      const result = await EventService.getActiveEvents();

      if (result.success) {
        setEvents(result.data);
      } else {
        ErrorHandler.log(result.error, 'HomeScreen.loadEvents');
        setErrorBanner(result.error.getUserMessage());
      }
    } catch (error) {
      ErrorHandler.log(error, 'HomeScreen.loadEvents');
      const { message } = ErrorHandler.handle(error);
      setErrorBanner(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setRefreshing(false);
    }
  }, [loadEvents]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    events.forEach((event) => {
      if (event.category) {
        uniqueCategories.add(event.category);
      }
    });

    return [
      'Todos',
      ...Array.from(uniqueCategories).sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' })
      ),
    ];
  }, [events]);

  useEffect(() => {
    if (selectedCategory !== 'Todos' && !categories.includes(selectedCategory)) {
      setSelectedCategory('Todos');
    }
  }, [categories, selectedCategory]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = debouncedQuery.toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !normalizedQuery ||
        event.title.toLowerCase().includes(normalizedQuery) ||
        event.description?.toLowerCase().includes(normalizedQuery) ||
        event.location.toLowerCase().includes(normalizedQuery);

      const matchesCategory =
        selectedCategory === 'Todos' || event.category === selectedCategory;

      // Filtro por fecha
      const eventStatus = getEventStatus(event.date).status;
      const matchesDateFilter =
        eventDateFilter === 'all' ||
        (eventDateFilter === 'upcoming' && eventStatus !== 'past') ||
        (eventDateFilter === 'past' && eventStatus === 'past');

      return matchesSearch && matchesCategory && matchesDateFilter;
    });
  }, [debouncedQuery, events, selectedCategory, eventDateFilter]);

  const featuredEvent = useMemo(
    () => (filteredEvents.length > 0 ? filteredEvents[0] : null),
    [filteredEvents]
  );

  const popularEvents = useMemo(
    () => filteredEvents.slice(1, 10),
    [filteredEvents]
  );

  const handleEventPress = useCallback(
    (event: Event) => {
      const params = buildEventDetailParams(event);
      router.push({
        pathname: '/event-detail',
        params,
      });
    },
    [router]
  );

  const handlePurchasePress = useCallback(
    (event: Event) => {
      const params = buildPurchaseParams(event);
      router.push({
        pathname: '/purchase',
        params,
      });
    },
    [router]
  );

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setEventDateFilter('upcoming');
  }, []);

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleDismissBanner = useCallback(() => {
    setErrorBanner(null);
  }, []);

  const renderPopularEvent = useCallback(
    ({ item }: { item: Event }) => (
      <PopularEventCard event={item} onPress={handleEventPress} styles={styles} />
    ),
    [handleEventPress, styles]
  );

  const popularKeyExtractor = useCallback((item: Event) => item.id, []);

  const getPopularItemLayout = useCallback(
    (_: ArrayLike<Event> | null | undefined, index: number) => ({
      length: POPULAR_CARD_FULL_WIDTH,
      offset: POPULAR_CARD_FULL_WIDTH * index,
      index,
    }),
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={false}
      />

      {errorBanner && (
        <View
          style={styles.bannerContainer}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.bannerText}>{errorBanner}</Text>
          <View style={styles.bannerActions}>
            <TouchableOpacity
              style={styles.bannerButton}
              onPress={handleRefresh}
              accessibilityRole="button"
              accessibilityHint="Vuelve a intentar cargar los eventos"
            >
              <Ionicons
                name="refresh"
                size={16}
                color={isDark ? '#1A1A1A' : palette.text}
              />
              <Text style={styles.bannerButtonText}>Reintentar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bannerDismiss}
              onPress={handleDismissBanner}
              accessibilityRole="button"
              accessibilityHint="Descarta el mensaje de error"
            >
              <Ionicons
                name="close"
                size={16}
                color={isDark ? '#FFFFFF' : palette.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={palette.primary}
            colors={[palette.primary]}
            title="Actualizando eventos..."
            titleColor={palette.textSecondary}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Tu ubicación</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={palette.primary} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Notificaciones"
              accessibilityHint="Abre tus notificaciones recientes"
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={isDark ? '#FFFFFF' : palette.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Opciones"
              accessibilityHint="Abre las opciones y filtros de la pantalla"
            >
              <Ionicons
                name="options-outline"
                size={24}
                color={isDark ? '#FFFFFF' : palette.icon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={palette.icon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar eventos, artistas, lugares..."
              placeholderTextColor={palette.textSecondary}
              style={styles.searchInput}
              returnKeyType="search"
              autoCapitalize="none"
              accessibilityLabel="Buscar eventos"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda"
                accessibilityHint="Borra el texto introducido en la búsqueda"
              >
                <Ionicons name="close-circle" size={20} color={palette.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => handleCategorySelect(category)}
                accessibilityLabel={`Filtrar por ${category}`}
                accessibilityRole="button"
                accessibilityHint={`Muestra eventos de la categoría ${category}`}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Date Filter Tabs */}
        <View style={styles.dateFilterContainer}>
          <TouchableOpacity
            style={[
              styles.dateFilterTab,
              eventDateFilter === 'upcoming' && styles.dateFilterTabActive,
            ]}
            onPress={() => setEventDateFilter('upcoming')}
            accessibilityRole="button"
            accessibilityLabel="Próximos eventos"
          >
            <Text
              style={[
                styles.dateFilterText,
                eventDateFilter === 'upcoming' && styles.dateFilterTextActive,
              ]}
            >
              Próximos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateFilterTab,
              eventDateFilter === 'past' && styles.dateFilterTabActive,
            ]}
            onPress={() => setEventDateFilter('past')}
            accessibilityRole="button"
            accessibilityLabel="Eventos finalizados"
          >
            <Text
              style={[
                styles.dateFilterText,
                eventDateFilter === 'past' && styles.dateFilterTextActive,
              ]}
            >
              Finalizados
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateFilterTab,
              eventDateFilter === 'all' && styles.dateFilterTabActive,
            ]}
            onPress={() => setEventDateFilter('all')}
            accessibilityRole="button"
            accessibilityLabel="Todos los eventos"
          >
            <Text
              style={[
                styles.dateFilterText,
                eventDateFilter === 'all' && styles.dateFilterTextActive,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Counter */}
        {!loading && (searchQuery || selectedCategory !== 'Todos' || eventDateFilter !== 'upcoming') && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {filteredEvents.length === 0
                ? 'No se encontraron resultados'
                : `${filteredEvents.length} evento${filteredEvents.length !== 1 ? 's' : ''} encontrado${filteredEvents.length !== 1 ? 's' : ''}`}
            </Text>
            {(searchQuery || selectedCategory !== 'Todos' || eventDateFilter !== 'upcoming') && (
              <TouchableOpacity
                onPress={handleClearFilters}
                style={styles.clearFiltersButton}
                accessibilityRole="button"
                accessibilityLabel="Limpiar filtros"
                accessibilityHint="Restablece todos los filtros a los valores por defecto"
              >
                <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
            <Text style={styles.loadingText}>Cargando eventos...</Text>
            <Text style={styles.loadingSubtext}>
              Estamos buscando los mejores eventos para ti
            </Text>
          </View>
        ) : events.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="calendar-outline" size={64} color={palette.primary} />
            </View>
            <Text style={styles.emptyTitle}>No hay eventos disponibles</Text>
            <Text style={styles.emptySubtitle}>
              No se encontraron eventos próximos en tu ubicación. Vuelve pronto para ver nuevas opciones.
            </Text>
            <Button
              title="Actualizar"
              variant="primary"
              onPress={handleRefresh}
              style={styles.refreshButton}
              leftIcon="refresh"
            />
          </View>
        ) : (
          <>
            {/* Upcoming Event Section */}
            {featuredEvent && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Próximo Evento</Text>
                  <TouchableOpacity
                    onPress={handleRefresh}
                    accessibilityRole="button"
                    accessibilityLabel="Actualizar eventos destacados"
                    accessibilityHint="Recarga la lista de eventos destacados"
                  >
                    <Ionicons name="refresh" size={20} color={palette.primary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => handleEventPress(featuredEvent)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalles de ${featuredEvent.title}`}
                  accessibilityHint="Abre la información completa del evento seleccionado"
                >
                  <View style={styles.featuredCard}>
                    <Image
                      source={{
                        uri: featuredEvent.imageUrl || DEFAULT_EVENT_IMAGE,
                        cacheKey: `featured-${featuredEvent.id}`,
                      }}
                      style={styles.featuredImage}
                      contentFit="cover"
                      transition={300}
                      placeholder={IMAGE_PLACEHOLDER}
                      cachePolicy="memory-disk"
                      accessibilityIgnoresInvertColors
                    />
                    <View style={styles.featuredOverlay} />
                    <View style={styles.featuredContent}>
                      <View style={styles.featuredTopRow}>
                        <View style={styles.dateBadge}>
                          <Text style={styles.dateBadgeText}>{featuredEvent.date}</Text>
                        </View>
                        <View style={styles.statusBadgesRow}>
                          {(() => {
                            const eventStatus = getEventStatus(featuredEvent.date);
                            return (
                              <View style={[styles.statusBadge, { backgroundColor: eventStatus.color }]}>
                                <Text style={styles.statusBadgeText}>{eventStatus.label}</Text>
                              </View>
                            );
                          })()}
                          {featuredEvent.category && (
                            <View style={styles.freeBadge}>
                              <Text style={styles.freeBadgeText}>{featuredEvent.category}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.featuredInfo}>
                        <View style={styles.featuredTextContainer}>
                          <Text style={styles.featuredTitle} numberOfLines={2}>
                            {featuredEvent.title}
                          </Text>
                          <View style={styles.featuredMeta}>
                            <Ionicons name="location-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.featuredMetaText}>
                              {featuredEvent.venue || featuredEvent.location}
                            </Text>
                          </View>
                          <View style={styles.priceContainer}>
                            <Text style={styles.priceText}>
                              S/ {featuredEvent.price.toFixed(2)}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.joinButton}
                          onPress={() => handlePurchasePress(featuredEvent)}
                          accessibilityRole="button"
                          accessibilityLabel={`Comprar entradas para ${featuredEvent.title}`}
                          accessibilityHint="Abre el flujo de compra de entradas"
                        >
                          <Text style={styles.joinButtonText}>Comprar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Popular Events Section */}
        {!loading && popularEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.popularHeader}>
                <View style={styles.popularIconContainer}>
                  <Ionicons name="flame" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.sectionTitle}>Más Eventos</Text>
              </View>
              <Text style={styles.viewAllText}>{events.length} eventos</Text>
            </View>

            <FlatList
              data={popularEvents}
              renderItem={renderPopularEvent}
              keyExtractor={popularKeyExtractor}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularList}
              initialNumToRender={3}
              maxToRenderPerBatch={5}
              windowSize={5}
              removeClippedSubviews
              getItemLayout={getPopularItemLayout}
              accessibilityRole="list"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type PopularEventCardProps = {
  event: Event;
  onPress: (event: Event) => void;
  styles: HomeStyles;
};

const PopularEventCard = React.memo(({ event, onPress, styles }: PopularEventCardProps) => {
  const parsedPrice = Number(event.price ?? 0);
  const safePrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;
  const eventStatus = getEventStatus(event.date);

  return (
    <TouchableOpacity
      style={styles.popularCard}
      activeOpacity={0.9}
      onPress={() => onPress(event)}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalles de ${event.title}`}
      accessibilityHint="Abre la información completa del evento seleccionado"
    >
      <View style={styles.popularCardInner}>
        <Image
          source={{
            uri: event.imageUrl || DEFAULT_EVENT_IMAGE,
            cacheKey: `popular-${event.id}`,
          }}
          style={styles.popularImage}
          contentFit="cover"
          transition={200}
          placeholder={IMAGE_PLACEHOLDER}
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.popularOverlay} />
        <View style={styles.popularContent}>
          <View style={styles.popularBadgesRow}>
            <View style={[styles.statusBadgeSmall, { backgroundColor: eventStatus.color }]}>
              <Text style={styles.statusBadgeSmallText}>{eventStatus.label}</Text>
            </View>
            {event.category && (
              <View style={styles.popularBadge}>
                <Ionicons name="musical-notes" size={12} color="#FFFFFF" />
                <Text style={styles.popularBadgeText}>{event.category}</Text>
              </View>
            )}
          </View>
          <Text style={styles.popularTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.popularPrice}>S/ {safePrice.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

PopularEventCard.displayName = 'PopularEventCard';

type ThemePalette = typeof Colors.dark;

const createStyles = (palette: ThemePalette, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    bannerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
      backgroundColor: palette.error,
    },
    bannerText: {
      flex: 1,
      fontSize: FontSizes.sm,
      fontWeight: '600',
      color: '#FFFFFF',
      marginRight: Spacing.md,
    },
    bannerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    bannerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md,
      backgroundColor: isDark ? '#FFFFFF' : palette.surface,
    },
    bannerButtonText: {
      fontSize: FontSizes.sm,
      fontWeight: '700',
      color: isDark ? '#1A1A1A' : palette.text,
    },
    bannerDismiss: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.08)',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: Platform.OS === 'ios' ? 100 : 90,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
    },
    locationContainer: {
      flex: 1,
    },
    locationLabel: {
      fontSize: FontSizes.xs,
      color: palette.textSecondary,
      marginBottom: 4,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      fontSize: FontSizes.md,
      fontWeight: '600',
      color: palette.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2A2A2A' : palette.surface,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: FontSizes.md,
      color: palette.text,
      paddingVertical: 4,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: FontSizes.xl,
      fontWeight: '700',
      color: palette.text,
    },
    viewAllText: {
      fontSize: FontSizes.sm,
      fontWeight: '600',
      color: palette.primary,
    },
    featuredCard: {
      height: 420,
      marginHorizontal: Spacing.lg,
      borderRadius: BorderRadius.xxl,
      overflow: 'hidden',
      backgroundColor: isDark ? '#2A2A2A' : palette.surface,
    },
    featuredImage: {
      ...StyleSheet.absoluteFillObject,
    },
    featuredOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    featuredContent: {
      flex: 1,
      padding: Spacing.lg,
      justifyContent: 'space-between',
    },
    featuredTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    dateBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    dateBadgeText: {
      fontSize: FontSizes.xs,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    freeBadge: {
      backgroundColor: palette.primary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.lg,
    },
    freeBadgeText: {
      fontSize: FontSizes.xs,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    statusBadgesRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      alignItems: 'center',
    },
    statusBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    statusBadgeText: {
      fontSize: FontSizes.xs,
      fontWeight: '700',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statusBadgeSmall: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    statusBadgeSmallText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    popularBadgesRow: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: Spacing.xs,
    },
    featuredInfo: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    featuredTextContainer: {
      flex: 1,
      gap: Spacing.xs,
    },
    featuredTitle: {
      fontSize: FontSizes.xxxl,
      fontWeight: '800',
      color: palette.text,
      marginBottom: Spacing.xs,
    },
    featuredMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    featuredMetaText: {
      fontSize: FontSizes.sm,
      color: palette.textSecondary,
    },
    priceContainer: {
      marginTop: Spacing.xs,
    },
    priceText: {
      fontSize: FontSizes.xxl,
      fontWeight: '800',
      color: palette.primary,
    },
    joinButton: {
      backgroundColor: isDark ? '#FFFFFF' : palette.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.xl,
      minWidth: 100,
      alignItems: 'center',
    },
    joinButtonText: {
      fontSize: FontSizes.md,
      fontWeight: '700',
      color: isDark ? '#1A1A1A' : palette.buttonText,
    },
    popularHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    popularIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: palette.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    popularList: {
      paddingHorizontal: Spacing.lg,
      paddingRight: Spacing.lg,
    },
    popularCard: {
      width: 200,
      height: 240,
      marginRight: Spacing.md,
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      backgroundColor: palette.surface,
    },
    popularCardInner: {
      flex: 1,
    },
    popularImage: {
      ...StyleSheet.absoluteFillObject,
    },
    popularOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    popularContent: {
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    popularBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
      backgroundColor: palette.primary,
    },
    popularBadgeText: {
      fontSize: FontSizes.xs,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    popularTitle: {
      fontSize: FontSizes.lg,
      fontWeight: '700',
      color: palette.text,
      marginBottom: Spacing.xs,
    },
    popularPrice: {
      fontSize: FontSizes.md,
      fontWeight: '600',
      color: palette.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.xxxl * 2,
      paddingHorizontal: Spacing.xl,
    },
    loadingIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? 'rgba(0, 208, 132, 0.1)' : 'rgba(0, 208, 132, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    loadingText: {
      fontSize: FontSizes.lg,
      fontWeight: '700',
      color: palette.text,
      marginBottom: Spacing.xs,
    },
    loadingSubtext: {
      fontSize: FontSizes.sm,
      color: palette.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.xxxl * 2,
      paddingHorizontal: Spacing.xl,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isDark ? 'rgba(0, 208, 132, 0.1)' : 'rgba(0, 208, 132, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    emptyTitle: {
      fontSize: FontSizes.xxl,
      fontWeight: '800',
      color: palette.text,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: FontSizes.md,
      color: palette.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: Spacing.xl,
      maxWidth: 300,
    },
    refreshButton: {
      paddingHorizontal: Spacing.xl,
      shadowColor: palette.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    categoriesContainer: {
      marginBottom: Spacing.md,
    },
    categoriesList: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.sm,
    },
    categoryChip: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.round,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.05)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
      marginRight: Spacing.sm,
    },
    categoryChipActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    dateFilterContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    dateFilterTab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: BorderRadius.md,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.03)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
    },
    dateFilterTabActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    dateFilterText: {
      fontSize: FontSizes.sm,
      fontWeight: '600',
      color: palette.textSecondary,
    },
    dateFilterTextActive: {
      color: '#FFFFFF',
    },
    categoryChipText: {
      fontSize: FontSizes.sm,
      fontWeight: '600',
      color: palette.textSecondary,
    },
    categoryChipTextActive: {
      color: isDark ? '#FFFFFF' : palette.buttonText,
    },
    resultsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    resultsText: {
      fontSize: FontSizes.sm,
      fontWeight: '600',
      color: palette.textSecondary,
    },
    clearFiltersButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.05)',
    },
    clearFiltersText: {
      fontSize: FontSizes.xs,
      fontWeight: '600',
      color: palette.primary,
    },
  });

type HomeStyles = ReturnType<typeof createStyles>;
