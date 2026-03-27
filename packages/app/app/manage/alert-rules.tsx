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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90FF" colors={['#4A90FF']} progressBackgroundColor="#2C2C2E" />}
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
              placeholderTextColor="#636366"
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
              placeholderTextColor="#636366"
              keyboardType="numeric"
              value={threshold}
              onChangeText={setThreshold}
            />

            <TextInput
              style={styles.input}
              placeholder="Duration (seconds)"
              placeholderTextColor="#636366"
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
                  trackColor={{ false: '#3A3A3C', true: '#1D4ED8' }}
                  thumbColor={rule.enabled ? '#4A90FF' : '#636366'}
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
  container: { flex: 1, backgroundColor: '#1C1C1E', padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  addText: { color: '#4A90FF', fontSize: 14, fontWeight: '600' },

  /* form */
  formCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  pickerLabel: { color: '#8E8E93', fontSize: 13 },
  pickerValue: { color: '#4A90FF', fontSize: 14, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  /* rule cards */
  card: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardName: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  cardMeta: { color: '#4A90FF', fontSize: 13, marginTop: 4 },
  cardDuration: { color: '#636366', fontSize: 12, marginTop: 2 },
  deleteBtn: { marginTop: 10, alignSelf: 'flex-start' },
  deleteText: { color: '#EF4444', fontSize: 13, fontWeight: '500' },

  /* event cards */
  eventCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  eventRule: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  eventMessage: { color: '#FBBF24', fontSize: 13, marginBottom: 4 },
  eventMeta: { color: '#8E8E93', fontSize: 12, marginBottom: 2 },
  eventTime: { color: '#636366', fontSize: 11 },

  /* empty */
  emptyContainer: { alignItems: 'center', marginVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptySubtext: { color: '#636366', fontSize: 13 },
});
