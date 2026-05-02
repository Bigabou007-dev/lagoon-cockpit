import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
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

type Severity = 'critical' | 'warning' | 'info';

interface Alert {
  id: string;
  category: string;
  target: string;
  severity: Severity;
  since?: number | string;
  age_ms?: number;
  acked_at?: string | null;
  snoozed_until?: string | null;
  acked_note?: string | null;
}

interface AlertsResponse {
  state?: string;
  reason?: string;
  alerts?: Alert[];
  count?: number;
  by_category?: Record<string, Alert[]>;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: COLORS.red,
  warning: COLORS.yellow,
  info: COLORS.blue,
};

const CATEGORY_LABEL: Record<string, string> = {
  container: 'Containers',
  endpoint: 'Endpoints',
  ssl: 'SSL',
  disk: 'Disk',
  ram: 'RAM',
  database: 'Databases',
  log: 'Logs',
  cron: 'Cron',
  backup: 'Backup',
};

export default function SentinelLiveScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const r = await apiFetch<AlertsResponse>(`${LTS_API}/sentinel/alerts`);
      if (r.state === 'unavailable') {
        setUnavailable(r.reason || 'Sentinel state file unavailable');
        setAlerts([]);
      } else {
        setUnavailable(null);
        setAlerts(r.alerts || []);
      }
    } catch (e: any) {
      setError(sanitizeErrorMessage(e, 'Failed to load Sentinel alerts'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  // group by category client-side
  const grouped: Array<{ category: string; alerts: Alert[] }> = [];
  const categoryMap = new Map<string, Alert[]>();
  for (const a of alerts) {
    if (!categoryMap.has(a.category)) categoryMap.set(a.category, []);
    categoryMap.get(a.category)!.push(a);
  }
  for (const [category, alerts] of categoryMap) grouped.push({ category, alerts });

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Sentinel Live' }} />
        <View style={{ padding: SPACING.lg }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={70} borderRadius={RADIUS.md} style={{ marginBottom: SPACING.sm }} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Sentinel Live' }} />
      {unavailable ? (
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.yellow} />
          <Text style={styles.bannerText}>{unavailable}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={[styles.banner, { backgroundColor: COLORS.red + '15' }]}>
          <Ionicons name="warning-outline" size={18} color={COLORS.red} />
          <Text style={[styles.bannerText, { color: COLORS.red }]}>{error}</Text>
        </View>
      ) : null}

      {alerts.length === 0 && !unavailable && !loading ? (
        <View style={styles.empty}>
          <Ionicons name="shield-checkmark-outline" size={42} color={COLORS.green} />
          <Text style={styles.emptyText}>All clear</Text>
          <Text style={styles.emptyHint}>No active Sentinel alerts</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(g) => g.category}
          renderItem={({ item: group }) => (
            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={styles.sectionLabel}>
                {(CATEGORY_LABEL[group.category] || group.category).toUpperCase()} · {group.alerts.length}
              </Text>
              {group.alerts.map((a) => (
                <AlertRow key={a.id} alert={a} />
              ))}
            </View>
          )}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textPrimary} />}
        />
      )}
    </View>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const color = SEVERITY_COLORS[alert.severity] || COLORS.textSecondary;
  const ageMin = alert.age_ms ? Math.round(alert.age_ms / 60_000) : null;
  return (
    <GlassCard style={{ ...styles.alertCard, borderLeftWidth: 4, borderLeftColor: color }}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertTarget} numberOfLines={1}>
          {alert.target || alert.id}
        </Text>
        <View style={[styles.severityPill, { backgroundColor: color + '20' }]}>
          <Text style={[styles.severityText, { color }]}>{alert.severity}</Text>
        </View>
      </View>
      <View style={styles.alertMeta}>
        {ageMin !== null && (
          <Text style={styles.alertMetaText}>
            <Ionicons name="time-outline" size={12} color={COLORS.textTertiary} /> {ageMin}m
          </Text>
        )}
        {alert.acked_at && (
          <Text style={[styles.alertMetaText, { color: COLORS.green }]}>
            <Ionicons name="checkmark-circle" size={12} color={COLORS.green} /> acked
          </Text>
        )}
        {alert.snoozed_until && (
          <Text style={[styles.alertMetaText, { color: COLORS.blue }]}>
            <Ionicons name="moon-outline" size={12} color={COLORS.blue} /> snoozed
          </Text>
        )}
      </View>
    </GlassCard>
  );
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
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
  },
  bannerText: { ...FONT.bodyMedium, color: COLORS.yellow, flex: 1 },
  sectionLabel: { ...FONT.label, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  alertCard: { padding: SPACING.md, marginBottom: SPACING.sm },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  alertTarget: { ...FONT.bodyMedium, color: COLORS.textPrimary, flex: 1, marginRight: SPACING.sm },
  severityPill: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
  severityText: { ...FONT.label, fontSize: 9 },
  alertMeta: { flexDirection: 'row', gap: SPACING.md },
  alertMetaText: { ...FONT.body, fontSize: 12, color: COLORS.textTertiary },
  empty: { alignItems: 'center', padding: SPACING.xxxl, marginTop: SPACING.xxxl },
  emptyText: { ...FONT.heading, color: COLORS.textPrimary, marginTop: SPACING.md },
  emptyHint: { ...FONT.body, fontSize: 13, color: COLORS.textTertiary, marginTop: SPACING.xs },
});
