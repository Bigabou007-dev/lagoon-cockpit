import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../src/lib/api';
import { COLORS, RADIUS, SPACING } from '../../src/theme/tokens';

/* ---------- types ---------- */
interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  target: string;
  detail: string;
  created_at: string;
}

interface DaySection {
  title: string;
  data: AuditEntry[];
}

/* action → color + icon mapping */
function getActionStyle(action: string): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  const a = action.toLowerCase();
  if (a.includes('start')) return { icon: 'play', color: COLORS.green };
  if (a.includes('stop')) return { icon: 'stop', color: COLORS.red };
  if (a.includes('restart')) return { icon: 'refresh', color: COLORS.blue };
  if (a.includes('exec')) return { icon: 'terminal', color: COLORS.yellow };
  if (a.includes('prune')) return { icon: 'trash', color: COLORS.orange };
  if (a.includes('delete') || a.includes('remove')) return { icon: 'trash', color: COLORS.red };
  if (a.includes('create') || a.includes('add')) return { icon: 'add-circle', color: COLORS.green };
  if (a.includes('update') || a.includes('edit')) return { icon: 'create', color: COLORS.purple };
  if (a.includes('login') || a.includes('auth')) return { icon: 'lock-closed', color: COLORS.blue };
  return { icon: 'ellipse', color: COLORS.textSecondary };
}

/* group entries by day */
function groupByDay(entries: AuditEntry[]): DaySection[] {
  const map = new Map<string, AuditEntry[]>();
  for (const entry of entries) {
    const day = new Date(entry.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(entry);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function ActivityScreen() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await apiFetch<{ logs: AuditEntry[] }>('/api/audit?limit=100');
      setEntries(res.logs ?? []);
    } catch {
      /* silently fail — empty state shown */
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const sections = groupByDay(entries);

  const renderItem = ({ item }: { item: AuditEntry }) => {
    const { icon, color } = getActionStyle(item.action);
    const time = new Date(item.created_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.entryRow}>
        {/* Timeline line + dot */}
        <View style={styles.timeline}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View style={styles.line} />
        </View>

        {/* Content */}
        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <Ionicons name={icon} size={14} color={color} />
            <Text style={styles.actionText}>{item.action}</Text>
            <Text style={styles.timeText}>{time}</Text>
          </View>
          {!!item.target && (
            <Text style={styles.targetText}>{item.target}</Text>
          )}
          {!!item.detail && (
            <Text style={styles.detailText} numberOfLines={2}>
              {item.detail}
            </Text>
          )}
          <Text style={styles.userText}>by {item.user_id}</Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: DaySection }) => (
    <View style={styles.dayHeader}>
      <Text style={styles.dayText}>{section.title}</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Activity', headerBackTitle: 'Manage' }} />
      <View style={styles.container}>
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} colors={[COLORS.blue]} progressBackgroundColor={COLORS.card} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="list" size={40} color={COLORS.textTertiary} style={{ marginBottom: SPACING.md }} />
              <Text style={styles.emptyText}>No activity yet</Text>
              <Text style={styles.emptySubtext}>
                Actions performed on this server will appear here
              </Text>
            </View>
          }
          stickySectionHeadersEnabled={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: SPACING.lg, paddingBottom: 40 },

  /* day header */
  dayHeader: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* timeline entry */
  entryRow: { flexDirection: 'row', marginBottom: SPACING.xs },
  timeline: { width: 24, alignItems: 'center' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: COLORS.border,
    marginTop: 2,
  },

  /* entry content */
  entryContent: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginLeft: SPACING.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 },
  timeText: { color: COLORS.textTertiary, fontSize: 11 },
  targetText: { color: COLORS.blue, fontSize: 13, marginTop: SPACING.xs },
  detailText: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  userText: { color: COLORS.textTertiary, fontSize: 11, marginTop: 6 },

  /* empty */
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: SPACING.xs },
  emptySubtext: { color: COLORS.textTertiary, fontSize: 13, textAlign: 'center' },
});
