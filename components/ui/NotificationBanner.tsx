import React, { useEffect, useRef, useCallback } from 'react';
import { Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

type BannerType = 'success' | 'error' | 'warning' | 'info';

interface NotificationBannerProps {
  type: BannerType;
  message: string;
  visible: boolean;
  onDismiss?: () => void;
  duration?: number;
}

/**
 * NotificationBanner Component
 * Shows temporary notifications at the top of the screen
 * Auto-dismisses after duration or can be manually dismissed
 *
 * @example
 * const [showBanner, setShowBanner] = useState(false);
 *
 * <NotificationBanner
 *   type="success"
 *   message="¡Compra exitosa!"
 *   visible={showBanner}
 *   onDismiss={() => setShowBanner(false)}
 *   duration={3000}
 * />
 */
export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type,
  message,
  visible,
  onDismiss,
  duration = 3000,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();

  const handleDismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  }, [onDismiss, translateY]);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Reset position when not visible
      translateY.setValue(-100);
    }
  }, [visible, duration, handleDismiss, translateY]);

  const config = {
    success: {
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      color: Colors.dark.success,
    },
    error: {
      icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
      color: Colors.dark.error,
    },
    warning: {
      icon: 'warning' as keyof typeof Ionicons.glyphMap,
      color: Colors.dark.warning,
    },
    info: {
      icon: 'information-circle' as keyof typeof Ionicons.glyphMap,
      color: '#3B82F6',
    },
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config[type].color,
          transform: [{ translateY }],
          paddingTop: insets.top + Spacing.sm,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        <Ionicons name={config[type].icon} size={24} color="#fff" />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: FontSizes.md,
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    padding: Spacing.xs,
  },
});

export default NotificationBanner;
