import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Input, Badge } from '@/components/ui';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Datos de ejemplo para eventos
const ALL_EVENTS = [
  {
    id: '1',
    title: 'Festival de Jazz Internacional 2024',
    subtitle: 'Centro Cultural Metropolitano',
    description: 'Una experiencia musical única con los mejores artistas de jazz del mundo.',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    price: 'S/ 5.00',
    status: 'available' as const,
    category: 'Música',
    date: '2024-03-15',
    location: 'Lima',
  },
  {
    id: '2',
    title: 'Obra: Romeo y Julieta',
    subtitle: 'Teatro Municipal',
    description: 'La clásica obra de Shakespeare interpretada por el Ballet Nacional.',
    imageUrl: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400',
    price: 'S/ 5.00',
    status: 'available' as const,
    category: 'Teatro',
    date: '2024-03-20',
    location: 'Lima',
  },
  {
    id: '3',
    title: 'Concierto Sinfónico',
    subtitle: 'Auditorio Nacional',
    description: 'La Orquesta Sinfónica presenta obras maestras de compositores clásicos.',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400',
    price: 'S/ 5.00',
    status: 'soldOut' as const,
    category: 'Música',
    date: '2024-03-18',
    location: 'Lima',
  },
  {
    id: '4',
    title: 'Exposición de Arte Moderno',
    subtitle: 'Museo Nacional',
    description: 'Una colección única de obras contemporáneas de artistas latinoamericanos.',
    imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
    price: 'S/ 5.00',
    status: 'available' as const,
    category: 'Arte',
    date: '2024-03-25',
    location: 'Lima',
  },
  {
    id: '5',
    title: 'Festival de Danza Folclórica',
    subtitle: 'Plaza de Bolívar',
    description: 'Celebración de las tradiciones dancísticas del Perú.',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400',
    price: 'Gratis',
    status: 'available' as const,
    category: 'Danza',
    date: '2024-03-22',
    location: 'Lima',
  },
];

const CATEGORIES = ['Todos', 'Música', 'Teatro', 'Arte', 'Danza', 'Literatura'];

export default function EventsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredEvents = ALL_EVENTS.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Todos' || event.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleEventPress = (eventId: string) => {
    router.push('/event-detail');
  };


  const renderEventCard = ({ item }: { item: typeof ALL_EVENTS[0] }) => {
    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          style={styles.gridEventCard}
          onPress={() => handleEventPress(item.id)}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.gridEventImage} />
          <View style={styles.gridEventContent}>
            <Text style={styles.gridEventTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.gridEventSubtitle} numberOfLines={1}>{item.subtitle}</Text>
            <View style={styles.gridEventMeta}>
              <Badge text={item.category} variant="info" size="small" />
              <Text style={styles.gridEventPrice}>{item.price}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <Card
        title={item.title}
        subtitle={item.subtitle}
        description={item.description}
        imageUrl={item.imageUrl}
        price={item.price}
        status={item.status}
        onPress={() => handleEventPress(item.id)}
        style={styles.eventCard}
      >
        <View style={styles.eventMeta}>
          <Badge text={item.category} variant="info" size="small" />
          <View style={styles.metaInfo}>
            <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
          <View style={styles.metaInfo}>
            <Ionicons name="location-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.light.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bienvenido</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Buscar eventos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          variant="filled"
          containerStyle={styles.searchInput}
        />
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
        >
          <Ionicons
            name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
            size={24}
            color={Colors.light.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.categoryChipTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>


      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        style={styles.eventsList}
        contentContainerStyle={styles.eventsListContent}
        showsVerticalScrollIndicator={false}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        ItemSeparatorComponent={viewMode === 'list' ? () => <View style={styles.separator} /> : null}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.light.text,
  },
  viewToggle: {
    padding: Spacing.sm,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    ...Shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.light.backgroundSecondary,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryChipText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.light.textLight,
  },
  resultsHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  resultsText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  eventCard: {
    marginBottom: 0,
  },
  separator: {
    height: Spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  gridEventCard: {
    width: (width - Spacing.lg * 3) / 2,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  gridEventImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  gridEventContent: {
    padding: Spacing.md,
  },
  gridEventTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  gridEventSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  gridEventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridEventPrice: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  metaText: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
  },
});
