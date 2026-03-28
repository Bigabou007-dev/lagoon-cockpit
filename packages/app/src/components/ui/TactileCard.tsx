import { ViewStyle, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassCard } from './GlassCard';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TactileCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  intensity?: number;
  disabled?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
}

export function TactileCard({
  children,
  onPress,
  onLongPress,
  style,
  intensity = 30,
  disabled = false,
  haptic = 'light',
}: TactileCardProps) {
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(pressed.value ? 0.97 : 1, { duration: 120 }) },
    ],
    opacity: withTiming(pressed.value ? 0.85 : 1, { duration: 120 }),
  }));

  const handlePressIn = () => {
    pressed.value = true;
    if (haptic !== 'none') {
      const style =
        haptic === 'heavy'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : haptic === 'medium'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(style);
    }
  };

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={() => { pressed.value = false; }}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
    >
      <GlassCard intensity={intensity}>{children}</GlassCard>
    </AnimatedPressable>
  );
}
