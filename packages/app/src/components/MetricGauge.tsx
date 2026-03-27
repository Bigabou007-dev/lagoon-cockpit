import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../theme/tokens';

interface MetricGaugeProps {
  label: string;
  value: number; // 0-100
  detail?: string;
}

function getColor(value: number): string {
  if (value >= 90) return COLORS.red;
  if (value >= 75) return COLORS.yellow;
  return COLORS.green;
}

export default function MetricGauge({ label, value, detail }: MetricGaugeProps) {
  const color = getColor(value);
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{clampedValue.toFixed(1)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clampedValue}%`, backgroundColor: color }]} />
      </View>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  value: { fontSize: 13, fontWeight: '700' },
  track: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  detail: { color: COLORS.textTertiary, fontSize: 11, marginTop: SPACING.xs },
});
