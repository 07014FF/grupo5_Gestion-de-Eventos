import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Animar cuando el tab está activo
  useEffect(() => {
    if (props.accessibilityState?.selected) {
      Animated.spring(scaleValue, {
        toValue: 1.1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [props.accessibilityState?.selected, scaleValue]);

  return (
    <View style={styles.container}>
      {/* Indicador visual para tab activo */}
      {props.accessibilityState?.selected && (
        <View style={styles.activeIndicator} />
      )}

      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <PlatformPressable
          {...props}
          onPressIn={(ev) => {
            if (process.env.EXPO_OS === 'ios') {
              // Add a soft haptic feedback when pressing down on the tabs.
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            props.onPressIn?.(ev);
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 3,
    backgroundColor: '#00D084', // Verde claro
    borderRadius: 2,
  },
});
