import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/tokens';

const STATUS_COLORS: Record<string, string> = {
  running: COLORS.green,
  healthy: COLORS.green,
  exited: COLORS.red,
  stopped: COLORS.red,
  unhealthy: COLORS.red,
  restarting: COLORS.yellow,
  partial: COLORS.yellow,
  paused: COLORS.textTertiary,
  created: COLORS.textTertiary,
  dead: COLORS.red,
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || COLORS.textTertiary;
  const dotSize = size === 'sm' ? 8 : 10;
  const fontSize = size === 'sm' ? 12 : 13;

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { width: dotSize, height: dotSize, backgroundColor: color }]} />
      <Text style={[styles.text, { color, fontSize }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { borderRadius: 5 },
  text: { fontWeight: '600', textTransform: 'capitalize' },
});
