import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface CardProps {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  originalPrice?: string;
  status?: 'available' | 'soldOut' | 'pending';
  rating?: number;
  category?: string;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
  variant?: 'default' | 'netflix' | 'hero';
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  description,
  imageUrl,
  price,
  originalPrice,
  status = 'available',
  rating,
  category,
  onPress,
  style,
  children,
  variant = 'default',
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return Colors.light.available;
      case 'soldOut':
        return Colors.light.soldOut;
      case 'pending':
        return Colors.light.pending;
      default:
        return Colors.light.available;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'soldOut':
        return 'Agotado';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Disponible';
    }
  };

  const CardContent = () => {
    if (variant === 'netflix') {
      return (
        <View style={[styles.netflixCard, style]}>
          {imageUrl && (
            <ImageBackground source={{ uri: imageUrl }} style={styles.netflixImage} resizeMode="cover">
              <LinearGradient
                colors={['transparent', 'rgba(0,208,132,0.8)']}
                style={styles.netflixGradient}
              >
                <View style={styles.netflixContent}>
                  {rating && (
                    <View style={styles.netflixRating}>
                      <Text style={styles.ratingText}>★ {rating}</Text>
                    </View>
                  )}

                  <Text style={styles.netflixTitle} numberOfLines={2}>
                    {title}
                  </Text>

                  {subtitle && (
                    <Text style={styles.netflixSubtitle} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}

                  <View style={styles.netflixMeta}>
                    {category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{category}</Text>
                      </View>
                    )}

                    {price && (
                      <View style={styles.priceContainer}>
                        {originalPrice && originalPrice !== price && (
                          <Text style={styles.originalPrice}>{originalPrice}</Text>
                        )}
                        <Text style={styles.netflixPrice}>{price}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          )}
        </View>
      );
    }

    return (
      <View style={[styles.card, style]}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>

            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>

          {description && (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          )}

          {price && (
            <Text style={styles.price}>{price}</Text>
          )}

          {children}
        </View>
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.xs / 2,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.light.textLight,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  price: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.light.primary,
    marginTop: Spacing.xs,
  },
  // Netflix-style card
  netflixCard: {
    height: 280,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  netflixImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  netflixGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  netflixContent: {
    marginBottom: Spacing.sm,
  },
  netflixRating: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,208,132,0.9)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  netflixTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.light.textLight,
    marginBottom: Spacing.xs / 2,
    lineHeight: 24,
  },
  netflixSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textLight,
    opacity: 0.9,
    marginBottom: Spacing.sm,
  },
  netflixMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  categoryBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    color: Colors.light.textLight,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  netflixPrice: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.light.textLight,
  },
  originalPrice: {
    fontSize: FontSizes.sm,
    color: Colors.light.textLight,
    opacity: 0.7,
    textDecorationLine: 'line-through',
    marginBottom: Spacing.xs / 2,
  },
});

export default Card;