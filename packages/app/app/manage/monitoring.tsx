import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../src/theme/tokens';

/* ---------- Constants ---------- */

const GRAFANA_BASE = 'https://grafana.lagoontechsystems.com';
const DASHBOARD_UID = 'lagoon-infra';
const DASHBOARD_SLUG = 'lagoon-infrastructure';

const PANELS = [
  { label: 'Overview', panelId: null },
  { label: 'CPU', panelId: 2 },
  { label: 'Memory', panelId: 4 },
  { label: 'Containers', panelId: 6 },
] as const;

type Panel = (typeof PANELS)[number];

/* ---------- Helpers ---------- */

function buildGrafanaUrl(panel: Panel): string {
  if (panel.panelId == null) {
    return `${GRAFANA_BASE}/d/${DASHBOARD_UID}/${DASHBOARD_SLUG}?theme=dark`;
  }
  return `${GRAFANA_BASE}/d-solo/${DASHBOARD_UID}/${DASHBOARD_SLUG}?panelId=${panel.panelId}&theme=dark`;
}

// Auto-login script: hits Grafana login API to set session cookie, then navigates to dashboard
const AUTO_LOGIN_JS = `
  (function() {
    if (document.querySelector('form[name="loginForm"], input[name="user"]')) {
      fetch('${GRAFANA_BASE}/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: 'admin', password: 'lagoon-grafana-2026' }),
        credentials: 'include'
      }).then(function() {
        window.location.reload();
      });
    }
  })();
  true;
`;

/* ---------- Screen ---------- */

export default function MonitoringScreen() {
  const [activePanel, setActivePanel] = useState<Panel>(PANELS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const currentUrl = buildGrafanaUrl(activePanel);

  const handlePanelChange = useCallback((panel: Panel) => {
    setActivePanel(panel);
    setLoading(true);
    setError(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(false);
    webviewRef.current?.reload();
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(false);
    // Force re-mount by toggling panel back
    setActivePanel((prev) => ({ ...prev }));
  }, []);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Monitoring',
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.textPrimary,
        }}
      />

      {/* Panel Selector */}
      <View style={styles.selectorRow}>
        {PANELS.map((panel) => {
          const isActive = activePanel.label === panel.label;
          return (
            <TouchableOpacity
              key={panel.label}
              style={[styles.selectorBtn, isActive && styles.selectorBtnActive]}
              onPress={() => handlePanelChange(panel)}
            >
              <Text
                style={[
                  styles.selectorBtnText,
                  isActive && styles.selectorBtnTextActive,
                ]}
              >
                {panel.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* WebView / Loading / Error */}
      <View style={styles.webviewContainer}>
        {error ? (
          <View style={styles.center}>
            <Ionicons name="warning" size={48} color={COLORS.yellow} style={{ marginBottom: SPACING.lg }} />
            <Text style={styles.errorTitle}>Grafana Unreachable</Text>
            <Text style={styles.errorText}>
              Could not connect to the monitoring dashboard. Check that Grafana
              is running and accessible.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loading && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={COLORS.blue} />
                <Text style={styles.loaderText}>Loading dashboard...</Text>
              </View>
            )}
            {Platform.OS === 'web' ? (
              <iframe
                src={currentUrl}
                style={{
                  flex: 1,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: COLORS.bg,
                }}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            ) : (
              <WebView
                ref={webviewRef}
                source={{ uri: currentUrl }}
                style={styles.webview}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
                onHttpError={(syntheticEvent) => {
                  const { statusCode } = syntheticEvent.nativeEvent;
                  if (statusCode >= 400) {
                    setLoading(false);
                    setError(true);
                  }
                }}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState={false}
                originWhitelist={['https://*']}
                allowsInlineMediaPlayback
                mixedContentMode="compatibility"
                // Auto-login to Grafana + viewport fix
                injectedJavaScript={AUTO_LOGIN_JS + `
                  (function() {
                    var meta = document.createElement('meta');
                    meta.name = 'viewport';
                    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
                    document.head.appendChild(meta);
                  })();
                  true;
                `}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /* Panel Selector */
  selectorRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.border,
    alignItems: 'center',
  },
  selectorBtnActive: {
    backgroundColor: COLORS.blue,
  },
  selectorBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  selectorBtnTextActive: {
    color: COLORS.bg,
  },
  refreshBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* WebView */
  webviewContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /* Loading */
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    zIndex: 10,
  },
  loaderText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: SPACING.md,
  },

  /* Error */
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  retryBtn: {
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  retryText: {
    color: COLORS.blue,
    fontWeight: '600',
    fontSize: 14,
  },
});
