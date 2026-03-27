import { View, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDashboardStore, type StackSummary } from '../../src/stores/dashboardStore';
import { apiFetch } from '../../src/lib/api';
import StackCard from '../../src/components/StackCard';
import { COLORS } from '../../src/theme/tokens';

export default function StacksScreen() {
  const router = useRouter();
  const { stacks, setStacks } = useDashboardStore();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchStacks = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<{ stacks: StackSummary[] }>('/api/stacks');
      setStacks(data.stacks);
      setIsLoaded(true);
    } catch (err) {
      console.error('Failed to fetch stacks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stacks');
    }
  }, [setStacks]);

  useEffect(() => {
    fetchStacks();
  }, [fetchStacks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStacks();
    setRefreshing(false);
  }, [fetchStacks]);

  if (error && !isLoaded && stacks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Ionicons name="cloud-offline-outline" size={32} color={COLORS.red} />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchStacks}>
            <Ionicons name="refresh" size={16} color={COLORS.blue} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stacks}
        renderItem={({ item }) => (
          <StackCard stack={item} onPress={() => router.push(`/stacks/${item.name}`)} />
        )}
        keyExtractor={(item) => item.name}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} colors={[COLORS.blue]} progressBackgroundColor={COLORS.card} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No compose stacks found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: 16, paddingBottom: 20 },
  empty: { color: COLORS.textTertiary, fontSize: 14, textAlign: 'center', marginTop: 40 },
  errorCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.red + '30',
    padding: 32,
    margin: 16,
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  errorMessage: {
    color: COLORS.red,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue + '1A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  retryText: {
    color: COLORS.blue,
    fontWeight: '600',
    fontSize: 14,
  },
});
