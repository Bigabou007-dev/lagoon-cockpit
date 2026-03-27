import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { Stack } from 'expo-router';
import { apiFetch } from '../../src/lib/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface NetworkContainer {
  id: string;
  name: string;
  ipv4: string;
}

interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: string;
  containers: NetworkContainer[];
}

export default function NetworksScreen() {
  const [networks, setNetworks] = useState<DockerNetwork[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchNetworks = useCallback(async () => {
    try {
      const data = await apiFetch<{ networks: DockerNetwork[] }>('/api/networks');
      setNetworks(data.networks);
    } catch (err) {
      console.error('Failed to fetch networks:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to fetch networks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNetworks(); }, [fetchNetworks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNetworks();
    setRefreshing(false);
  }, [fetchNetworks]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = new Set(expandedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedIds(next);
  };

  const renderItem = ({ item }: { item: DockerNetwork }) => {
    const hasContainers = item.containers.length > 0;
    const isExpanded = expandedIds.has(item.id);
    const borderColor = hasContainers ? '#4A90FF' : '#3A3A3C';
    const indicatorColor = hasContainers ? '#4A90FF' : '#636366';

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: borderColor, borderLeftWidth: 3 }]}
        onPress={() => hasContainers && toggleExpand(item.id)}
        activeOpacity={hasContainers ? 0.7 : 1}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
            <Text style={styles.networkName}>{item.name}</Text>
          </View>
          {hasContainers && (
            <Text style={styles.chevron}>{isExpanded ? '\u25B2' : '\u25BC'}</Text>
          )}
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>{item.driver}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>{item.scope}</Text>
          </View>
          <View style={[styles.metaBadge, hasContainers ? styles.metaBadgeActive : styles.metaBadgeInactive]}>
            <Text style={[styles.metaBadgeText, hasContainers && styles.metaBadgeTextActive]}>
              {item.containers.length} container{item.containers.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {isExpanded && hasContainers && (
          <View style={styles.containerList}>
            <View style={styles.containerListHeader}>
              <Text style={styles.containerListHeaderText}>Container</Text>
              <Text style={styles.containerListHeaderText}>IPv4</Text>
            </View>
            {item.containers.map((c) => (
              <View key={c.id} style={styles.containerRow}>
                <Text style={styles.containerName} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.containerIp}>{c.ipv4 || 'N/A'}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Networks', headerBackTitle: 'Back' }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4A90FF" />
          <Text style={styles.loadingText}>Loading networks...</Text>
        </View>
      </>
    );
  }

  const activeNetworks = networks.filter((n) => n.containers.length > 0).length;

  return (
    <>
      <Stack.Screen options={{ title: 'Networks', headerBackTitle: 'Back' }} />
      <View style={styles.container}>
        {/* Summary bar */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{networks.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#4A90FF' }]}>{activeNetworks}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#636366' }]}>{networks.length - activeNetworks}</Text>
            <Text style={styles.summaryLabel}>Empty</Text>
          </View>
        </View>

        <FlatList
          data={networks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90FF" colors={['#4A90FF']} progressBackgroundColor="#2C2C2E" />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No networks found</Text>}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  centered: { flex: 1, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8E8E93', fontSize: 14, marginTop: 12 },
  summary: {
    flexDirection: 'row', backgroundColor: '#2C2C2E', marginHorizontal: 16, marginTop: 16,
    marginBottom: 8, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#3A3A3C',
    justifyContent: 'space-around', alignItems: 'center',
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  summaryLabel: { color: '#8E8E93', fontSize: 12, marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#3A3A3C' },
  list: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 8 },
  card: {
    backgroundColor: '#2C2C2E', borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#3A3A3C',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  indicator: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  networkName: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', flex: 1 },
  chevron: { color: '#8E8E93', fontSize: 12 },
  cardMeta: { flexDirection: 'row', gap: 8 },
  metaBadge: { backgroundColor: '#3A3A3C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  metaBadgeActive: { backgroundColor: '#1E3A5F' },
  metaBadgeInactive: {},
  metaBadgeText: { color: '#8E8E93', fontSize: 11, fontWeight: '500' },
  metaBadgeTextActive: { color: '#4A90FF' },
  containerList: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#3A3A3C', paddingTop: 10 },
  containerListHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  containerListHeaderText: { color: '#636366', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  containerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#3A3A3C',
  },
  containerName: { color: '#FFFFFF', fontSize: 13, flex: 1, marginRight: 12 },
  containerIp: { color: '#4A90FF', fontSize: 13, fontFamily: 'monospace' },
  empty: { color: '#636366', fontSize: 14, textAlign: 'center', marginTop: 40 },
});
