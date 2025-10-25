import { Button } from '@/components/ui';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    ImageBackground,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Opciones de la pantalla
export const options = {
  headerShown: false,
};

const { height } = Dimensions.get('window');

export default function EventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'about' | 'participants'>('about');

  // Extract event data from params
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId || '1';
  const eventTitle = Array.isArray(params.eventTitle) ? params.eventTitle[0] : params.eventTitle || 'Event';
  const eventDate = Array.isArray(params.eventDate) ? params.eventDate[0] : params.eventDate || '';
  const eventTime = Array.isArray(params.eventTime) ? params.eventTime[0] : params.eventTime || '';
  const eventLocation = Array.isArray(params.eventLocation) ? params.eventLocation[0] : params.eventLocation || '';
  const ticketPrice = Array.isArray(params.ticketPrice) ? params.ticketPrice[0] : params.ticketPrice || '0';
  const eventDescription = Array.isArray(params.eventDescription) ? params.eventDescription[0] : params.eventDescription;
  const eventCategory = Array.isArray(params.eventCategory) ? params.eventCategory[0] : params.eventCategory;
  const eventImageUrl = Array.isArray(params.eventImageUrl) ? params.eventImageUrl[0] : params.eventImageUrl;

  // Format date for display (assuming format like "2024-12-25")
  const formatDate = (dateStr: string) => {
    if (!dateStr) return { month: 'TBD', day: '00' };
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate().toString().padStart(2, '0');
    return { month, day };
  };

  const { month, day } = formatDate(eventDate);

  const handleGoBack = () => {
    router.back();
  };

  const handlePurchase = () => {
    router.push({
      pathname: '/purchase',
      params: {
        eventId,
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        ticketPrice,
      }
    });
  };

  const handleBookmark = () => {
    // Implementar lógica de favoritos
  };

  const handleShare = () => {
    // Implementar lógica de compartir
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image with Overlay */}
        <ImageBackground
          source={{
            uri: eventImageUrl || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'
          }}
          style={styles.heroImage}
          imageStyle={styles.heroImageStyle}
        >
          {/* Dark Gradient Overlay */}
          <View style={styles.heroOverlay} />

          {/* Top Bar */}
          <View style={styles.topBar}>
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
            {eventCategory && (
              <View style={styles.showBadge}>
                <Text style={styles.showBadgeText}>{eventCategory.toUpperCase()}</Text>
              </View>
            )}

            {/* Title */}
            <Text style={styles.heroTitle}>{eventTitle}</Text>

            {/* Start Time */}
            <Text style={styles.heroStartTime}>
              {eventTime ? `${eventDate} • ${eventTime}` : eventDate}
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
                ABOUT
              </Text>
              {activeTab === 'about' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'participants' && styles.tabActive]}
              onPress={() => setActiveTab('participants')}
            >
              <Text style={[styles.tabText, activeTab === 'participants' && styles.tabTextActive]}>
                PARTICIPANTS
              </Text>
              {activeTab === 'participants' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'about' && (
              <>
                <Text style={styles.description}>
                  {eventDescription || 'Información del evento no disponible.'}
                </Text>

                {/* Location Section */}
                <View style={styles.locationSection}>
                  <Text style={styles.sectionTitle}>LOCATION</Text>
                  {eventLocation ? (
                    <View style={styles.locationInfo}>
                      <Ionicons name="location" size={20} color={Colors.dark.primary} />
                      <Text style={styles.locationText}>{eventLocation}</Text>
                    </View>
                  ) : (
                    <View style={styles.locationPlaceholder}>
                      <Ionicons name="location-outline" size={24} color={Colors.dark.textMuted} />
                      <Text style={styles.locationPlaceholderText}>Ubicación por confirmar</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {activeTab === 'participants' && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No participants yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Purchase Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>PRICE</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${parseFloat(ticketPrice).toLocaleString()}</Text>
            <Text style={styles.priceUnit}>/person</Text>
          </View>
        </View>

        <Button
          title="BUY A TICKET"
          variant="primary"
          onPress={handlePurchase}
          style={styles.buyButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background, // Unified with Home
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
    paddingTop: Spacing.xl + 16,
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
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.xs,
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
    backgroundColor: Colors.dark.primary,
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
    backgroundColor: Colors.dark.background,
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
    color: Colors.dark.textMuted,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: Colors.dark.text,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.dark.primary,
  },
  tabContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  locationSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.dark.text,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
  },
  locationText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  locationPlaceholder: {
    height: 120,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  locationPlaceholderText: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textMuted,
  },
  emptyState: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FontSizes.md,
    color: Colors.dark.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
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
    color: Colors.dark.textMuted,
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
    color: Colors.dark.text,
  },
  priceUnit: {
    fontSize: FontSizes.sm,
    color: Colors.dark.textSecondary,
    marginLeft: 4,
  },
  buyButton: {
    flex: 1.2,
    backgroundColor: Colors.dark.buttonPrimary,
    paddingVertical: Spacing.md + 2,
  },
});
