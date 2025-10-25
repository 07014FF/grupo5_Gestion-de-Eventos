import { Button } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EventService } from '@/services/event.service';
import { Event } from '@/types/ticket.types';
import { ErrorHandler } from '@/utils/errors';

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Colombia');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const result = await EventService.getActiveEvents();

      if (result.success) {
        setEvents(result.data);
      } else {
        ErrorHandler.log(result.error, 'HomeScreen.loadEvents');
        Alert.alert('Error', result.error.getUserMessage());
      }
    } catch (error) {
      ErrorHandler.log(error, 'HomeScreen.loadEvents');
      const { message } = ErrorHandler.handle(error);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  // Get featured event (first event)
  const featuredEvent = events.length > 0 ? events[0] : null;

  // Get popular events (rest of events)
  const popularEvents = events.slice(1, 6);

  const handleEventPress = (event: Event) => {
    router.push({
      pathname: '/event-detail',
      params: {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        ticketPrice: event.price.toString(),
        eventDescription: event.description || '',
        eventCategory: event.category || '',
        eventImageUrl: event.imageUrl || '',
      },
    });
  };

  const handlePurchasePress = (event: Event) => {
    router.push({
      pathname: '/purchase',
      params: {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        ticketPrice: event.price.toString(),
      },
    });
  };

  const renderPopularEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.popularCard}
      activeOpacity={0.9}
      onPress={() => handleEventPress(item)}
    >
      <ImageBackground
        source={{
          uri: item.imageUrl || 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600'
        }}
        style={styles.popularCardImage}
        imageStyle={styles.popularCardImageStyle}
      >
        <View style={styles.popularOverlay} />
        <View style={styles.popularContent}>
          {item.category && (
            <View style={styles.popularBadge}>
              <Ionicons name="musical-notes" size={14} color="#FFFFFF" />
              <Text style={styles.popularBadgeText}>{item.category}</Text>
            </View>
          )}
          <Text style={styles.popularTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.popularPrice}>${item.price.toLocaleString()}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1A1A1A" barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Your Location</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={Colors.dark.primary} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="options-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Cargando eventos...</Text>
          </View>
        ) : events.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={Colors.dark.textSecondary} />
            <Text style={styles.emptyTitle}>No hay eventos disponibles</Text>
            <Text style={styles.emptySubtitle}>
              No se encontraron eventos próximos. Vuelve pronto.
            </Text>
            <Button
              title="Actualizar"
              variant="primary"
              onPress={handleRefresh}
              style={styles.refreshButton}
            />
          </View>
        ) : (
          <>
            {/* Upcoming Event Section */}
            {featuredEvent && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Próximo Evento</Text>
                  <TouchableOpacity onPress={handleRefresh}>
                    <Ionicons name="refresh" size={20} color={Colors.dark.primary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => handleEventPress(featuredEvent)}
                >
                  <ImageBackground
                    source={{
                      uri: featuredEvent.imageUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800'
                    }}
                    style={styles.featuredCard}
                    imageStyle={styles.featuredCardImage}
                  >
                    <View style={styles.featuredOverlay} />
                    <View style={styles.featuredContent}>
                      <View style={styles.featuredTopRow}>
                        <View style={styles.dateBadge}>
                          <Text style={styles.dateBadgeText}>{featuredEvent.date}</Text>
                        </View>
                        {featuredEvent.category && (
                          <View style={styles.freeBadge}>
                            <Text style={styles.freeBadgeText}>{featuredEvent.category}</Text>
                          </View>
                        )}
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
                              ${featuredEvent.price.toLocaleString()}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.joinButton}
                          onPress={() => handlePurchasePress(featuredEvent)}
                        >
                          <Text style={styles.joinButtonText}>Comprar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ImageBackground>
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
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularList}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
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
    color: '#94A3B8',
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
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: '#2A2A2A',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  featuredCard: {
    height: 420,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
  },
  featuredCardImage: {
    borderRadius: BorderRadius.xxl,
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    backdropFilter: 'blur(10px)',
  },
  dateBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  freeBadge: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  freeBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredMetaText: {
    fontSize: FontSizes.sm,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  priceContainer: {
    marginTop: Spacing.xs,
  },
  priceText: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.dark.primary,
  },
  joinButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    minWidth: 100,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#1A1A1A',
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
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  popularCard: {
    width: 200,
    height: 240,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  popularCardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  popularCardImageStyle: {
    borderRadius: BorderRadius.xl,
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
    backgroundColor: Colors.dark.primary,
  },
  popularBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  popularTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  popularPrice: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  refreshButton: {
    paddingHorizontal: Spacing.xl,
  },
});
