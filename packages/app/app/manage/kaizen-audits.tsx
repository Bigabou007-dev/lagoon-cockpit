import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../src/lib/api';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, RADIUS, SPACING, FONT, SHADOW } from '../../src/theme/tokens';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { sanitizeErrorMessage } from '../../src/lib/errors';

const LTS_API = '/api/ext/lts';

interface AuditSummary {
  date: string;
  file?: string;
  generated_at?: string | null;
  parse_error?: boolean;
  projects?: string[];
  severity_counts?: { critical: number; warning: number; info: number };
  finding_counts?: { outdated_packages: number; security: number; ssl_certs: number; crontab_drift: number };
  summary?: Record<string, unknown>;
}

interface AuditsResponse {
  state?: string;
  count?: number;
  audits?: AuditSummary[];
  reason?: string;
}

export default function KaizenAuditsScreen() {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const r = await apiFetch<AuditsResponse>(`${LTS_API}/kaizen/audits`);
      if (r.state === 'unavailable') {
        setUnavailable(r.reason || 'Kaizen reports directory unavailable');
        setAudits([]);
      } else {
        setUnavailable(null);
        setAudits(r.audits || []);
      }
    } catch (e: any) {
      setError(sanitizeErrorMessage(e, 'Failed to load Kaizen audits'));
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

  const renderItem = ({ item }: { item: AuditSummary }) => {
    const sc = item.severity_counts || { critical: 0, warning: 0, info: 0 };
    const projects = item.projects || [];
    const totalFindings =
      (item.finding_counts?.outdated_packages || 0) +
      (item.finding_counts?.security || 0) +
      (item.finding_counts?.ssl_certs || 0) +
      (item.finding_counts?.crontab_drift || 0);

    return (
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.date}>{item.date}</Text>
          {item.parse_error ? (
            <View style={[styles.pill, { backgroundColor: COLORS.red + '20' }]}>
              <Text style={[styles.pillText, { color: COLORS.red }]}>parse error</Text>
            </View>
          ) : (
            <View style={[styles.pill, { backgroundColor: COLORS.blue + '20' }]}>
              <Text style={[styles.pillText, { color: COLORS.blue }]}>{totalFindings} findings</Text>
            </View>
          )}
        </View>

        <View style={styles.severityRow}>
          <SeverityChip n={sc.critical} label="critical" color={COLORS.red} />
          <SeverityChip n={sc.warning} label="warning" color={COLORS.yellow} />
          <SeverityChip n={sc.info} label="info" color={COLORS.blue} />
        </View>

        {projects.length > 0 && (
          <Text style={styles.projects} numberOfLines={2}>
            {projects.join(' · ')}
          </Text>
        )}
      </GlassCard>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Kaizen Audits' }} />
        <View style={{ padding: SPACING.lg }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={110} borderRadius={RADIUS.lg} style={{ marginBottom: SPACING.md }} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Kaizen Audits' }} />
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
      <FlatList
        data={audits}
        keyExtractor={(it) => it.date + (it.file || '')}
        renderItem={renderItem}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textPrimary} />}
        ListEmptyComponent={
          !loading && !unavailable ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={42} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>No audits yet</Text>
              <Text style={styles.emptyHint}>
                Audits are written daily by Kaizen to ~/automation/kaizen/reports/
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function SeverityChip({ n, label, color }: { n: number; label: string; color: string }) {
  if (n === 0) return null;
  return (
    <View style={[styles.severityChip, { backgroundColor: color + '20' }]}>
      <Text style={[styles.severityNum, { color }]}>{n}</Text>
      <Text style={[styles.severityLabel, { color }]}>{label}</Text>
    </View>
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
  card: { padding: SPACING.lg, marginBottom: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  date: { ...FONT.heading, color: COLORS.textPrimary },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  pillText: { ...FONT.label, fontSize: 10 },
  severityRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  severityChip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  severityNum: { ...FONT.bodyMedium, fontSize: 13 },
  severityLabel: { ...FONT.label, fontSize: 9 },
  projects: { ...FONT.body, fontSize: 13, color: COLORS.textSecondary },
  empty: { alignItems: 'center', padding: SPACING.xxxl },
  emptyText: { ...FONT.heading, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptyHint: { ...FONT.body, fontSize: 13, color: COLORS.textTertiary, marginTop: SPACING.sm, textAlign: 'center' },
});
