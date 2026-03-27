import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useServerStore } from '../stores/serverStore';
import { COLORS, SPACING } from '../theme/tokens';

interface ServerPickerProps {
  onAddServer: () => void;
}

export default function ServerPicker({ onAddServer }: ServerPickerProps) {
  const { profiles, activeProfileId, serverName } = useServerStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  if (!activeProfile) {
    return (
      <TouchableOpacity style={styles.container} onPress={onAddServer}>
        <Text style={styles.noServer}>Tap to add a server</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {serverName || activeProfile.name}
        </Text>
        <Text style={styles.url} numberOfLines={1}>
          {activeProfile.url}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  info: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  url: { color: COLORS.textTertiary, fontSize: 11 },
  noServer: { color: COLORS.textSecondary, fontSize: 14 },
});
