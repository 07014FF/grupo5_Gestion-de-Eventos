import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  Animated,
} from 'react-native';
import { FontSizes, ButtonStyles, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  leftIcon?: any;
  leftIconColor?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
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
  accessibilityLabel,
  accessibilityHint,
}) => {
  const palette = useThemeColors();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
    const getButtonStyle = (): ViewStyle => {
    const baseStyle = size === 'small' ? ButtonStyles.small : ButtonStyles.primary;

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? palette.border : palette.buttonPrimary,
          ...Shadows.sm,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? palette.border : palette.buttonSecondary,
          ...Shadows.sm,
        };
      case 'outline':
        return {
          ...ButtonStyles.secondary,
          backgroundColor: 'transparent',
          borderColor: disabled ? palette.border : palette.primary,
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: disabled ? palette.border : palette.buttonDanger,
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
          color: disabled ? palette.textSecondary : palette.primary,
        };
      default:
        return {
          ...baseTextStyle,
          color: disabled ? palette.textSecondary : palette.buttonText,
        };
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{
          disabled: disabled || loading,
          busy: loading,
        }}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' ? palette.primary : palette.buttonText}
            size="small"
          />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {leftIcon && (
              <IconSymbol
                name={leftIcon as any} // Cast to any
                size={18}
                color={leftIconColor ?? getTextStyle().color ?? palette.text}
              />
            )}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Button;
