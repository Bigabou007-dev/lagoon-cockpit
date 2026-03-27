import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { apiFetch } from '../../src/lib/api';
import { useServerStore } from '../../src/stores/serverStore';
import { COLORS, RADIUS, SPACING } from '../../src/theme/tokens';

/* ---------- types ---------- */
interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  duration_seconds: number;
  enabled: boolean;
}

interface AlertEvent {
  id: string;
  rule_name: string;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  created_at: string;
}

const METRICS = ['cpu_percent', 'memory_percent', 'disk_percent', 'load_1', 'container_stopped'];
const OPERATORS = ['>', '<', '>=', '<=', '=='];

export default function AlertRulesScreen() {
  const { userRole } = useServerStore();
  const isAdmin = userRole === 'admin';

  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  /* form state */
  const [name, setName] = useState('');
  const [metric, setMetric] = useState(METRICS[0]);
  const [operator, setOperator] = useState(OPERATORS[0]);
  const [threshold, setThreshold] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [rulesRes, eventsRes] = await Promise.all([
        apiFetch<{ rules: AlertRule[] }>('/api/alerts/rules'),
        apiFetch<{ events: AlertEvent[] }>('/api/alerts/events'),
      ]);
      setRules(rulesRes.rules ?? []);
      setEvents(eventsRes.events ?? []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  /* toggle rule enabled/disabled */
  const toggleRule = async (rule: AlertRule) => {
    try {
      await apiFetch(`/api/alerts/rules/${rule.id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  /* delete rule */
  const deleteRule = (rule: AlertRule) => {
    Alert.alert('Delete Rule', `Remove "${rule.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/alerts/rules/${rule.id}`, { method: 'DELETE' });
            setRules((prev) => prev.filter((r) => r.id !== rule.id));
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  /* add rule */
  const addRule = async () => {
    if (!name.trim() || !threshold.trim() || !duration.trim()) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/alerts/rules', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          metric,
          operator,
          threshold: parseFloat(threshold),
          durationSeconds: parseInt(duration, 10),
        }),
      });
      setName('');
      setThreshold('');
      setDuration('');
      setShowForm(false);
      await fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  /* picker helper */
  const [metricIdx, setMetricIdx] = useState(0);
  const [operatorIdx, setOperatorIdx] = useState(0);

  const cyclePicker = (
    items: string[],
    idx: number,
    setIdx: (n: number) => void,
    setter: (v: string) => void
  ) => {
    const next = (idx + 1) % items.length;
    setIdx(next);
    setter(items[next]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Alert Rules', headerBackTitle: 'Manage' }} />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} colors={[COLORS.blue]} progressBackgroundColor={COLORS.card} />}
      >
        {/* -------- Rules Section -------- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rules</Text>
          {isAdmin && (
            <TouchableOpacity onPress={() => setShowForm(!showForm)}>
              <Text style={styles.addText}>{showForm ? 'Cancel' : '+ Add Rule'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Add Rule Form */}
        {showForm && isAdmin && (
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              placeholder="Rule name"
              placeholderTextColor={COLORS.textTertiary}
              value={name}
              onChangeText={setName}
            />

            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => cyclePicker(METRICS, metricIdx, setMetricIdx, setMetric)}
            >
              <Text style={styles.pickerLabel}>Metric</Text>
              <Text style={styles.pickerValue}>{metric}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => cyclePicker(OPERATORS, operatorIdx, setOperatorIdx, setOperator)}
            >
              <Text style={styles.pickerLabel}>Operator</Text>
              <Text style={styles.pickerValue}>{operator}</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Threshold"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="numeric"
              value={threshold}
              onChangeText={setThreshold}
            />

            <TextInput
              style={styles.input}
              placeholder="Duration (seconds)"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.5 }]}
              onPress={addRule}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Rule'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rules list */}
        {rules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{'\u{1F4CB}'}</Text>
            <Text style={styles.emptyText}>No alert rules configured</Text>
            <Text style={styles.emptySubtext}>Tap "+ Add Rule" to create one</Text>
          </View>
        ) : (
          rules.map((rule) => (
            <View key={rule.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{rule.name}</Text>
                  <Text style={styles.cardMeta}>
                    {rule.metric} {rule.operator} {rule.threshold}
                  </Text>
                  <Text style={styles.cardDuration}>
                    Duration: {rule.duration_seconds}s
                  </Text>
                </View>
                <Switch
                  value={rule.enabled}
                  onValueChange={() => toggleRule(rule)}
                  trackColor={{ false: COLORS.border, true: '#1D4ED8' }}
                  thumbColor={rule.enabled ? COLORS.blue : COLORS.textTertiary}
                />
              </View>
              {isAdmin && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteRule(rule)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {/* -------- Event History -------- */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Recent Events</Text>
        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptySubtext}>No triggered alerts yet</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Text style={styles.eventRule}>{event.rule_name}</Text>
              <Text style={styles.eventMessage}>{event.message}</Text>
              <Text style={styles.eventMeta}>
                {event.metric}: {event.value} (threshold: {event.threshold})
              </Text>
              <Text style={styles.eventTime}>
                {new Date(event.created_at).toLocaleString()}
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  addText: { color: COLORS.blue, fontSize: 14, fontWeight: '600' },

  /* form */
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerLabel: { color: COLORS.textSecondary, fontSize: 13 },
  pickerValue: { color: COLORS.blue, fontSize: 14, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  saveText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },

  /* rule cards */
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  cardMeta: { color: COLORS.blue, fontSize: 13, marginTop: SPACING.xs },
  cardDuration: { color: COLORS.textTertiary, fontSize: 12, marginTop: 2 },
  deleteBtn: { marginTop: 10, alignSelf: 'flex-start' },
  deleteText: { color: COLORS.red, fontSize: 13, fontWeight: '500' },

  /* event cards */
  eventCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventRule: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  eventMessage: { color: COLORS.yellow, fontSize: 13, marginBottom: SPACING.xs },
  eventMeta: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 2 },
  eventTime: { color: COLORS.textTertiary, fontSize: 11 },

  /* empty */
  emptyContainer: { alignItems: 'center', marginVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: SPACING.xs },
  emptySubtext: { color: COLORS.textTertiary, fontSize: 13 },
});
