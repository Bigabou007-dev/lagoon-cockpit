import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../src/lib/api';
import { COLORS, RADIUS, SPACING } from '../../src/theme/tokens';

interface Endpoint {
  name: string;
  url: string;
  status: number | null;
  expected: number;
  healthy: boolean;
  responseTime: number;
  error?: string;
}

interface SSLCert {
  domain: string;
  valid: boolean;
  daysRemaining: number;
  expiresAt: string;
  issuer: string;
  error?: string;
}

function getDaysColor(days: number): string {
  if (days <= 7) return COLORS.red;
  if (days <= 14) return COLORS.yellow;
  return COLORS.green;
}

export default function StatusScreen() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [certs, setCerts] = useState<SSLCert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [epData, sslData] = await Promise.all([
        apiFetch<{ endpoints: Endpoint[] }>('/api/endpoints'),
        apiFetch<{ certificates: SSLCert[] }>('/api/ssl'),
      ]);
      setEndpoints(epData.endpoints);
      setCerts(sslData.certificates);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} colors={[COLORS.blue]} progressBackgroundColor={COLORS.card} />}
    >
      {/* Endpoints */}
      <Text style={styles.sectionTitle}>HTTP Endpoints</Text>
      {endpoints.length === 0 ? (
        <Text style={styles.empty}>No endpoints configured</Text>
      ) : (
        endpoints.map((ep, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{ep.name}</Text>
              <View style={[styles.statusDot, { backgroundColor: ep.healthy ? COLORS.green : COLORS.red }]} />
            </View>
            <Text style={styles.cardUrl}>{ep.url}</Text>
            <View style={styles.cardStats}>
              <Text style={[styles.cardStat, { color: ep.healthy ? COLORS.green : COLORS.red }]}>
                {ep.status || 'ERR'}
              </Text>
              <Text style={styles.cardStat}>{ep.responseTime}ms</Text>
            </View>
            {ep.error && <Text style={styles.cardError}>{ep.error}</Text>}
          </View>
        ))
      )}

      {/* SSL Certificates */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.xxl }]}>SSL Certificates</Text>
      {certs.length === 0 ? (
        <Text style={styles.empty}>No SSL domains configured</Text>
      ) : (
        certs.map((cert, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{cert.domain}</Text>
              <Text style={[styles.days, { color: getDaysColor(cert.daysRemaining) }]}>
                {cert.valid ? `${cert.daysRemaining}d` : 'EXPIRED'}
              </Text>
            </View>
            {cert.issuer && <Text style={styles.cardUrl}>Issuer: {cert.issuer}</Text>}
            {cert.expiresAt && (
              <Text style={styles.cardUrl}>
                Expires: {new Date(cert.expiresAt).toLocaleDateString()}
              </Text>
            )}
            {cert.error && <Text style={styles.cardError}>{cert.error}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  empty: { color: COLORS.textTertiary, fontSize: 14, fontStyle: 'italic', marginBottom: SPACING.lg },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  cardUrl: { color: COLORS.textTertiary, fontSize: 12, marginBottom: SPACING.xs },
  cardStats: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.xs },
  cardStat: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  cardError: { color: COLORS.red, fontSize: 12, marginTop: SPACING.xs },
  days: { fontSize: 14, fontWeight: '700' },
});
