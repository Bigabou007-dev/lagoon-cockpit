import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { COLORS } from '../../theme/tokens';

type Status = 'optimal' | 'healthy' | 'elevated' | 'warning' | 'critical' | 'offline';

const STATUS_COLORS: Record<Status, string> = {
  optimal: COLORS.optimal,
  healthy: COLORS.green,
  elevated: COLORS.yellow,
  warning: COLORS.orange,
  critical: COLORS.red,
  offline: COLORS.textTertiary,
};

interface StatusDotProps {
  status: Status;
  size?: number;
  pulse?: boolean;
}

export function StatusDot({ status, size = 10, pulse = true }: StatusDotProps) {
  const color = STATUS_COLORS[status];
  const glowOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (pulse && status !== 'offline') {
      glowOpacity.value = withDelay(
        Math.random() * 500,
        withRepeat(withTiming(0.15, { duration: 1500 }), -1, true),
      );
    }
  }, [pulse, status]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.container, { width: size * 2.5, height: size * 2.5 }]}>
      {pulse && status !== 'offline' && (
        <Animated.View
          style={[
            styles.glow,
            glowStyle,
            {
              width: size * 2.5,
              height: size * 2.5,
              borderRadius: size * 1.25,
              backgroundColor: color,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  dot: {},
});
