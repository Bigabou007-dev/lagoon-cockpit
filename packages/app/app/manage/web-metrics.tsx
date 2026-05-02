import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../src/lib/api';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, RADIUS, SPACING, FONT } from '../../src/theme/tokens';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { sanitizeErrorMessage } from '../../src/lib/errors';

const LTS_API = '/api/ext/lts';

interface UptimeEntry {
  endpoint: string;
  samples: number;
  up: number;
  down: number;
  uptime_pct: number;
}

interface UptimeResponse {
  state?: string;
  reason?: string;
  endpoints?: UptimeEntry[];
}

interface CloudflareZone {
  id: string;
  name: string;
  status?: string;
  plan?: string;
}

interface CloudflareResponse {
  state?: string;
  reason?: string;
  zones?: CloudflareZone[];
}

export default function WebMetricsScreen() {
  const [uptime, setUptime] = useState<UptimeEntry[]>([]);
  const [zones, setZones] = useState<CloudflareZone[]>([]);
  const [uptimeError, setUptimeError] = useState<string | null>(null);
  const [cfError, setCfError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, c] = await Promise.allSettled([
        apiFetch<UptimeResponse>(`${LTS_API}/web/uptime?range=7d`),
        apiFetch<CloudflareResponse>(`${LTS_API}/web/cloudflare`),
      ]);

      if (u.status === 'fulfilled') {
        if (u.value.state === 'unavailable') {
          setUptimeError(u.value.reason || 'unavailable');
          setUptime([]);
        } else {
          setUptimeError(null);
          setUptime(u.value.endpoints || []);
        }
      } else {
        setUptimeError(sanitizeErrorMessage(u.reason, 'Failed to load uptime data'));
      }

      if (c.status === 'fulfilled') {
        if (c.value.state === 'unavailable') {
          setCfError(c.value.reason || 'unavailable');
          setZones([]);
        } else {
          setCfError(null);
          setZones(c.value.zones || []);
        }
      } else {
        setCfError(sanitizeErrorMessage(c.reason, 'Failed to load Cloudflare data'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Web Metrics' }} />
        <View style={{ padding: SPACING.lg }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={90} borderRadius={RADIUS.lg} style={{ marginBottom: SPACING.md }} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textPrimary} />}
    >
      <Stack.Screen options={{ title: 'Web Metrics' }} />

      <Text style={styles.sectionLabel}>UPTIME (7d) — FROM SENTINEL PROBES</Text>
      {uptimeError ? (
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.yellow} />
          <Text style={styles.bannerText}>{uptimeError}</Text>
        </View>
      ) : uptime.length === 0 ? (
        <Text style={styles.muted}>No latency samples yet — Sentinel writes one per probe cycle (every 10 min).</Text>
      ) : (
        uptime.map((u) => (
          <GlassCard key={u.endpoint} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.endpoint} numberOfLines={1}>{prettyHost(u.endpoint)}</Text>
              <View style={[styles.dot, { backgroundColor: uptimeColor(u.uptime_pct) }]} />
            </View>
            <View style={styles.metricsRow}>
              <Metric label="Uptime" value={`${u.uptime_pct.toFixed(2)}%`} color={uptimeColor(u.uptime_pct)} />
              <Metric label="Samples" value={String(u.samples)} color={COLORS.textSecondary} />
              <Metric label="Down" value={String(u.down)} color={u.down > 0 ? COLORS.red : COLORS.textTertiary} />
            </View>
          </GlassCard>
        ))
      )}

      <View style={{ height: SPACING.xl }} />

      <Text style={styles.sectionLabel}>CLOUDFLARE ZONES</Text>
      {cfError ? (
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.yellow} />
          <Text style={styles.bannerText}>{cfError}</Text>
        </View>
      ) : zones.length === 0 ? (
        <Text style={styles.muted}>No zones returned (CLOUDFLARE_API_TOKEN missing or no zones in account).</Text>
      ) : (
        zones.map((z) => (
          <GlassCard key={z.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.endpoint}>{z.name}</Text>
              {z.status === 'active' ? (
                <View style={[styles.pill, { backgroundColor: COLORS.green + '20' }]}>
                  <Text style={[styles.pillText, { color: COLORS.green }]}>active</Text>
                </View>
              ) : (
                <Text style={styles.muted}>{z.status || ''}</Text>
              )}
            </View>
            {z.plan && <Text style={styles.muted}>{z.plan}</Text>}
          </GlassCard>
        ))
      )}

      <Text style={[styles.muted, { marginTop: SPACING.lg, textAlign: 'center' }]}>
        Vercel Analytics deferred to v1.5 — set LTS_VERCEL_ENABLED=true to enable.
      </Text>
    </ScrollView>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function prettyHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function uptimeColor(pct: number): string {
  if (pct >= 99.9) return COLORS.green;
  if (pct >= 99) return COLORS.yellow;
  return COLORS.red;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.yellow + '15',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  bannerText: { ...FONT.bodyMedium, color: COLORS.yellow, flex: 1 },
  sectionLabel: { ...FONT.label, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  card: { padding: SPACING.lg, marginBottom: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  endpoint: { ...FONT.heading, color: COLORS.textPrimary, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  metricsRow: { flexDirection: 'row', gap: SPACING.lg },
  metric: { flex: 1 },
  metricValue: { ...FONT.metric, fontSize: 22 },
  metricLabel: { ...FONT.label, fontSize: 9, color: COLORS.textTertiary, marginTop: 2 },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  pillText: { ...FONT.label, fontSize: 10 },
  muted: { ...FONT.body, fontSize: 13, color: COLORS.textTertiary },
});
