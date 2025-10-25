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
import { Ionicons } from '@expo/vector-icons';
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
  actions?: CardAction[];
}

interface CardAction {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress?: () => void;
  intent?: 'primary' | 'neutral';
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
  actions,
}) => {
  const getStatusVisuals = () => {
    switch (status) {
      case 'available':
        return {
          chipColor: Colors.light.success,
          chipBackground: 'rgba(16, 185, 129, 0.12)',
          icon: 'checkmark-circle' as const,
          label: 'Disponible',
        };
      case 'soldOut':
        return {
          chipColor: Colors.light.error,
          chipBackground: 'rgba(239, 68, 68, 0.12)',
          icon: 'close-circle' as const,
          label: 'Agotado',
        };
      case 'pending':
        return {
          chipColor: Colors.light.warning,
          chipBackground: 'rgba(245, 158, 11, 0.12)',
          icon: 'time-outline',
          label: 'Pendiente',
        };
      default:
        return {
          chipColor: Colors.light.success,
          chipBackground: 'rgba(16, 185, 129, 0.12)',
          icon: 'checkmark-circle' as const,
          label: 'Disponible',
        };
    }
  };

  const statusVisuals = getStatusVisuals();

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
        {imageUrl ? (
          <View style={styles.thumbnailWrapper}>
            <Image source={{ uri: imageUrl }} style={styles.thumbnail} resizeMode="cover" />
            {category && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{category}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.thumbnailWrapper, styles.thumbnailPlaceholder]}>
            <Ionicons name="image-outline" size={28} color={Colors.light.textMuted} />
          </View>
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
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusVisuals.chipBackground,
                },
              ]}
            >
              <Ionicons
                name={statusVisuals.icon as any}
                size={18}
                color={statusVisuals.chipColor}
                style={styles.statusIcon}
              />
              <Text style={[styles.statusText, { color: statusVisuals.chipColor }]}>
                {statusVisuals.label}
              </Text>
            </View>
          </View>

          {description && (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          )}

          {(rating || (!imageUrl && category)) && (
            <View style={styles.metaRow}>
              {rating && (
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text style={[styles.metaText, styles.metaTextStrong]}>{rating.toFixed(1)}</Text>
                </View>
              )}
              {!imageUrl && category && (
                <View style={styles.metaItem}>
                  <Ionicons name="albums-outline" size={14} color={Colors.light.primary} />
                  <Text style={styles.metaText}>{category}</Text>
                </View>
              )}
            </View>
          )}

          {children}

          {price && (
            <Text style={styles.price}>{price}</Text>
          )}

          {!!actions?.length && (
            <View style={styles.actionsRow}>
              {actions.map((action, index) => {
                const isPrimary = action.intent === 'primary';
                return (
                  <TouchableOpacity
                    key={`${action.icon}-${index}`}
                    onPress={action.onPress}
                    style={[
                      styles.actionButton,
                      isPrimary && styles.actionButtonPrimary,
                    ]}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={action.icon}
                      size={18}
                      color={isPrimary ? Colors.light.textLight : Colors.light.icon}
                    />
                    {action.label && (
                      <Text
                        style={[
                          styles.actionLabel,
                          isPrimary && styles.actionLabelPrimary,
                        ]}
                      >
                        {action.label}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
    flexDirection: 'row',
    gap: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  thumbnailWrapper: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.light.backgroundSecondary,
    ...Shadows.sm,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.round,
  },
  statusIcon: {
    marginRight: Spacing.xs / 2,
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  metaText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  metaTextStrong: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  price: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.light.primary,
    marginTop: Spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.light.surfaceElevated,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  actionLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.icon,
    fontWeight: '600',
  },
  actionLabelPrimary: {
    color: Colors.light.textLight,
  },
  categoryPill: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.round,
  },
  categoryPillText: {
    fontSize: FontSizes.xs,
    color: Colors.light.textLight,
    fontWeight: '600',
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
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
