import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AdminSpacing, Shadows, BorderRadius, AdminColors } from '@/constants/theme';
import { ColorValue } from 'react-native';

interface StatCardPremiumProps {
  icon: string;
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  gradientColors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  onPress?: () => void;
}

export const StatCardPremium: React.FC<StatCardPremiumProps> = ({
  icon,
  title,
  value,
  change,
  changeLabel = 'vs anterior',
  gradientColors,
  onPress,
}) => {

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={!onPress}
      style={[styles.container, Shadows.md]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Icono */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </View>

          {/* Título */}
          <Text style={styles.title}>{title}</Text>

          {/* Valor principal */}
          <Text style={styles.value}>
            {typeof value === 'number' ? value.toLocaleString('es-PE') : value}
          </Text>

          {/* Indicador de cambio */}
          {change !== undefined && (
            <View style={styles.changeContainer}>
              <Text style={[styles.changeText, change >= 0 ? styles.positive : styles.negative]}>
                {change >= 0 ? '▲' : '▼'} {Math.abs(change)}{' '}
                <Text style={styles.changeLabel}>{changeLabel}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Overlay decorativo */}
        <View style={styles.decorativeOverlay} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: 0, // Removemos margin para control externo
  },
  gradient: {
    padding: AdminSpacing.cardInternal,
    paddingVertical: AdminSpacing.cardInternal,
    minHeight: 150,
    position: 'relative',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 14,
    color: AdminColors.headingPrimary,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
    color: AdminColors.headingPrimary,
    marginBottom: 10,
    lineHeight: 40,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#FCA5A5',
  },
  decorativeOverlay: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
