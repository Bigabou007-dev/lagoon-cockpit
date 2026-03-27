import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { apiFetch } from '../../src/lib/api';
import { useServerStore } from '../../src/stores/serverStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../src/theme/tokens';

export default function MaintenanceScreen() {
  const { userRole } = useServerStore();
  const isAdmin = userRole === 'admin';

  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch<{ enabled: boolean }>('/api/maintenance');
      setEnabled(res.enabled ?? false);
    } catch {
      /* silent — shows default off */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  const toggleMaintenance = async (newValue: boolean) => {
    if (!isAdmin) {
      Alert.alert('Permission Denied', 'Only admins can toggle maintenance mode.');
      return;
    }

    const action = newValue ? 'enable' : 'disable';
    Alert.alert(
      `${newValue ? 'Enable' : 'Disable'} Maintenance Mode`,
      newValue
        ? 'All alerts and push notifications will be paused. Are you sure?'
        : 'Alerts and notifications will resume. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newValue ? 'destructive' : 'default',
          onPress: async () => {
            setToggling(true);
            try {
              await apiFetch('/api/maintenance', {
                method: 'POST',
                body: JSON.stringify({ enabled: newValue }),
              });
              setEnabled(newValue);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setToggling(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Maintenance', headerBackTitle: 'Manage' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} colors={[COLORS.blue]} progressBackgroundColor={COLORS.card} />
        }
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, enabled ? styles.bannerOn : styles.bannerOff]}>
          <Ionicons
            name={enabled ? 'build' : 'checkmark-circle'}
            size={48}
            color={enabled ? '#FCD34D' : '#6EE7B7'}
            style={{ marginBottom: SPACING.md }}
          />
          <Text style={[styles.statusLabel, enabled ? styles.labelOn : styles.labelOff]}>
            {loading ? 'Loading...' : enabled ? 'MAINTENANCE ACTIVE' : 'OPERATIONAL'}
          </Text>
        </View>

        {/* Toggle Card */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Maintenance Mode</Text>
              <Text style={styles.toggleDesc}>
                {enabled
                  ? 'Currently active — alerts paused'
                  : 'Currently off — monitoring normally'}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={toggleMaintenance}
              disabled={!isAdmin || toggling || loading}
              trackColor={{ false: COLORS.border, true: '#B45309' }}
              thumbColor={enabled ? COLORS.yellow : COLORS.textTertiary}
              style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
            />
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What happens during maintenance?</Text>
          <View style={styles.infoRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.infoText}>
              Alert rules stop evaluating — no new alert events are created
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.infoText}>
              Push notifications and Telegram alerts are paused
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.infoText}>
              Webhook deliveries are queued until maintenance ends
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.infoText}>
              Container monitoring and metrics collection continue normally
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>When to use maintenance mode</Text>
          <View style={styles.infoRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.infoText}>
              Planned server reboots or OS updates
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.infoText}>
              Docker engine upgrades or container migrations
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.infoText}>
              Network maintenance that causes temporary outages
            </Text>
          </View>
        </View>

        {!isAdmin && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              Only administrators can toggle maintenance mode.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg },

  /* status banner */
  statusBanner: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
    borderWidth: 1,
  },
  bannerOn: {
    backgroundColor: '#451A03',
    borderColor: '#92400E',
  },
  bannerOff: {
    backgroundColor: '#052E16',
    borderColor: '#166534',
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  labelOn: { color: '#FCD34D' },
  labelOff: { color: '#6EE7B7' },

  /* toggle card */
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  toggleDesc: { color: COLORS.textSecondary, fontSize: 13, marginTop: SPACING.xs },

  /* info cards */
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoRow: { flexDirection: 'row', marginBottom: 6, paddingRight: SPACING.md },
  bullet: { color: COLORS.blue, fontSize: 14, marginRight: SPACING.sm, marginTop: 1 },
  infoText: { color: COLORS.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },

  /* warning */
  warningCard: {
    backgroundColor: '#7F1D1D',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  warningText: { color: '#FCA5A5', fontSize: 13, fontWeight: '500' },
});
