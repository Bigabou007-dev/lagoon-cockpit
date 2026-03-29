import { ViewStyle, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, RADIUS, SPACING, SHADOW } from '../../theme/tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  noPadding?: boolean;
  elevated?: boolean;
  tint?: 'dark' | 'light' | 'default';
}

export function GlassCard({
  children,
  style,
  intensity = 30,
  noPadding = false,
  elevated = false,
  tint = 'dark',
}: GlassCardProps) {
  return (
    <View style={[styles.outer, elevated && SHADOW.card, style]}>
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[styles.blur, noPadding ? null : styles.padded]}
      >
        {/* Top-edge highlight for depth illusion */}
        <View style={styles.highlight} />
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  blur: {
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  padded: {
    padding: SPACING.lg,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.glassHighlight,
  },
});
