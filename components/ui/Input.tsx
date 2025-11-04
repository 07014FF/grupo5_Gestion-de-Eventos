import React, { useState, forwardRef, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  useColorScheme,
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

const Input = forwardRef<TextInput, InputProps>(({
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
  onFocus,
  onBlur,
  ...textInputProps
}, ref) => {
  const colorScheme = useColorScheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry;
  const shouldShowPassword = isPassword && !isPasswordVisible;

  const isDark = colorScheme === 'dark';
  const palette = useMemo(() => isDark ? Colors.dark : Colors.light, [isDark]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColor = useMemo(() => error
    ? palette.error
    : isFocused
    ? palette.primary
    : isDark
    ? 'rgba(255, 255, 255, 0.15)'
    : 'rgba(15, 23, 42, 0.12)', [error, isFocused, isDark, palette]);

  const backgroundColor = useMemo(() => isFocused
    ? (isDark ? palette.surface : palette.surfaceElevated)
    : (isDark ? palette.backgroundSecondary : palette.surface), [isFocused, isDark, palette]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: palette.text }]}>{label}</Text>}

      <View style={[styles.inputContainer, { borderColor, backgroundColor }]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={palette.textSecondary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          ref={ref}
          style={[styles.input, { color: palette.text }, style]}
          secureTextEntry={shouldShowPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={palette.textSecondary}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          underlineColorAndroid="transparent"
          {...textInputProps}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={palette.textSecondary}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon} size={20} color={palette.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={[styles.errorText, { color: palette.error }]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, { color: palette.textSecondary }]}>{helperText}</Text>}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
    margin: 0,
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
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
});

export default Input;
