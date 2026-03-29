import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StatusBadge from './StatusBadge';
import { COLORS, RADIUS, SPACING } from '../theme/tokens';
import type { StackSummary } from '../stores/dashboardStore';

interface StackCardProps {
  stack: StackSummary;
  onPress: () => void;
}

export default function StackCard({ stack, onPress }: StackCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Stack ${stack.name}, ${stack.running} of ${stack.containerCount} running`}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{stack.name}</Text>
        <StatusBadge status={stack.status} size="sm" />
      </View>
      <View style={styles.stats}>
        <Text style={styles.stat}>
          {stack.containerCount} container{stack.containerCount !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.divider}>|</Text>
        <Text style={[styles.stat, { color: COLORS.green }]}>{stack.running} up</Text>
        {stack.stopped > 0 && (
          <>
            <Text style={styles.divider}>|</Text>
            <Text style={[styles.stat, { color: COLORS.red }]}>{stack.stopped} down</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  name: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  stat: { color: COLORS.textSecondary, fontSize: 13 },
  divider: { color: COLORS.border, fontSize: 13 },
});
