import { View, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDashboardStore, type StackSummary } from '../../src/stores/dashboardStore';
import { apiFetch } from '../../src/lib/api';
import StackCard from '../../src/components/StackCard';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, RADIUS, SPACING } from '../../src/theme/tokens';

export default function StacksScreen() {
  const router = useRouter();
  const { stacks, setStacks } = useDashboardStore();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const fadeAnims = useRef<Animated.Value[]>([]).current;

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

  /* Error state */
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
      {/* Skeleton loading state */}
      {!isLoaded && !error && stacks.length === 0 && (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
                <Skeleton width={120} height={16} borderRadius={4} />
                <Skeleton width={70} height={20} borderRadius={10} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Skeleton width={90} height={12} borderRadius={4} />
                <Skeleton width={50} height={12} borderRadius={4} />
                <Skeleton width={60} height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Stack list with staggered entry animations */}
      {(isLoaded || stacks.length > 0) && (
        <FlatList
          data={stacks}
          renderItem={({ item, index }) => {
            // Ensure we have an animated value for this index
            while (fadeAnims.length <= index) {
              fadeAnims.push(new Animated.Value(0));
            }
            const fadeAnim = fadeAnims[index];
            // Trigger staggered fade-in on first load
            if ((fadeAnim as any).__getValue() === 0) {
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 60,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }).start();
            }
            return (
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
                <StackCard stack={item} onPress={() => router.push(`/stacks/${item.name}`)} />
              </Animated.View>
            );
          }}
          keyExtractor={(item) => item.name}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} colors={[COLORS.blue]} progressBackgroundColor={COLORS.card} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No compose stacks found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  empty: { color: COLORS.textTertiary, fontSize: 14, textAlign: 'center', marginTop: 40 },
  skeletonCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.red + '30',
    padding: 32,
    margin: SPACING.lg,
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  errorMessage: {
    color: COLORS.red,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue + '1A',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: SPACING.sm,
  },
  retryText: {
    color: COLORS.blue,
    fontWeight: '600',
    fontSize: 14,
  },
});
