import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'neutral',
  size = 'medium',
  style,
  textStyle,
}) => {
  const getBadgeStyle = (): ViewStyle => {
    const baseStyle = {
      paddingHorizontal: size === 'small' ? Spacing.xs : Spacing.sm,
      paddingVertical: size === 'small' ? Spacing.xs / 2 : Spacing.xs,
      borderRadius: size === 'small' ? BorderRadius.sm : BorderRadius.md,
      alignSelf: 'flex-start' as const,
    };

    switch (variant) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: Colors.light.success,
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: Colors.light.warning,
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: Colors.light.error,
        };
      case 'info':
        return {
          ...baseStyle,
          backgroundColor: Colors.light.accent,
        };
      case 'neutral':
      default:
        return {
          ...baseStyle,
          backgroundColor: Colors.light.border,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle = {
      fontSize: size === 'small' ? FontSizes.xs : FontSizes.sm,
      fontWeight: '600' as const,
    };

    switch (variant) {
      case 'success':
      case 'warning':
      case 'error':
      case 'info':
        return {
          ...baseTextStyle,
          color: Colors.light.textLight,
        };
      case 'neutral':
      default:
        return {
          ...baseTextStyle,
          color: Colors.light.textSecondary,
        };
    }
  };

  return (
    <View style={[getBadgeStyle(), style]}>
      <Text style={[getTextStyle(), textStyle]}>{text}</Text>
    </View>
  );
};

export default Badge;