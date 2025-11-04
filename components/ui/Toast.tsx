import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
  position?: 'top' | 'bottom';
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
  position = 'top',
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  }, [onHide, opacity, position, translateY]);

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration, hideToast, opacity, translateY]);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: Colors.dark.success,
          backgroundColor: 'rgba(52, 199, 89, 0.15)',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: Colors.dark.error,
          backgroundColor: 'rgba(255, 59, 48, 0.15)',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: Colors.dark.warning,
          backgroundColor: 'rgba(255, 149, 0, 0.15)',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: Colors.dark.primary,
          backgroundColor: 'rgba(0, 208, 132, 0.15)',
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top'
          ? { top: insets.top + Spacing.md, paddingTop: Platform.OS === 'ios' ? Spacing.xs : 0 }
          : { bottom: insets.bottom + Spacing.md + 70 }, // 70 for tab bar
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.toast,
          {
            backgroundColor: config.backgroundColor,
            borderLeftColor: config.color,
          },
        ]}
        onPress={hideToast}
        activeOpacity={0.9}
        accessibilityLabel={`Notificación: ${message}`}
        accessibilityRole="alert"
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color + '30' }]}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderLeftWidth: 4,
    backgroundColor: Colors.dark.surface,
    ...Shadows.lg,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  message: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.dark.text,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
});

// Hook para usar Toast fácilmente
export const useToast = () => {
  const [toastState, setToastState] = React.useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToastState({ visible: true, message, type });
  };

  const hideToast = () => {
    setToastState((prev) => ({ ...prev, visible: false }));
  };

  return {
    toastState,
    showToast,
    hideToast,
    ToastComponent: (
      <Toast
        visible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        onHide={hideToast}
      />
    ),
  };
};
