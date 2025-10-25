import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'outline' | 'filled';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  variant = 'outline',
  style,
  secureTextEntry,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry;
  const shouldShowPassword = isPassword && !isPasswordVisible;

  const getInputContainerStyle = () => {
    const baseStyle = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
    };

    if (variant === 'filled') {
      return {
        ...baseStyle,
        backgroundColor: '#2A2A2A',
        borderWidth: 0,
      };
    }

    return {
      ...baseStyle,
      borderWidth: 1,
      borderColor: error
        ? Colors.dark.error
        : isFocused
        ? Colors.dark.primary
        : 'rgba(255, 255, 255, 0.15)',
      backgroundColor: '#2A2A2A',
    };
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color="#94A3B8"
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[styles.input, style]}
          secureTextEntry={shouldShowPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#64748B"
          {...textInputProps}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    color: '#FFFFFF',
    paddingVertical: Spacing.sm,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  errorText: {
    fontSize: FontSizes.xs,
    color: Colors.dark.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: FontSizes.xs,
    color: '#94A3B8',
    marginTop: Spacing.xs,
  },
});

export default Input;