import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View
} from 'react-native';
import { Colors, FontSizes, ButtonStyles, Shadows } from '@/constants/theme';

import { IconSymbol } from './icon-symbol';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: any; // Changed from string to any
  leftIconColor?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  leftIconColor,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle = size === 'small' ? ButtonStyles.small : ButtonStyles.primary;

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.light.border : Colors.light.buttonPrimary,
          ...Shadows.sm,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.light.border : Colors.light.buttonSecondary,
          ...Shadows.sm,
        };
      case 'outline':
        return {
          ...ButtonStyles.secondary,
          backgroundColor: 'transparent',
          borderColor: disabled ? Colors.light.border : Colors.light.primary,
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.light.border : Colors.light.buttonDanger,
          ...Shadows.sm,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle = {
      fontSize: size === 'small' ? FontSizes.sm : FontSizes.md,
      fontWeight: '600' as const,
    };

    switch (variant) {
      case 'outline':
        return {
          ...baseTextStyle,
          color: disabled ? Colors.light.textSecondary : Colors.light.primary,
        };
      default:
        return {
          ...baseTextStyle,
          color: disabled ? Colors.light.textSecondary : Colors.light.buttonText,
        };
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? Colors.light.primary : Colors.light.buttonText}
          size="small"
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {leftIcon && (
            <IconSymbol
              name={leftIcon as any} // Cast to any
              size={18}
              color={leftIconColor ?? getTextStyle().color ?? Colors.light.text} // Added fallback color
            />
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;