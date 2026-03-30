import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/tokens';

interface ActionSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ActionSheet({
  visible,
  title,
  message,
  confirmLabel,
  confirmColor = COLORS.red,
  onConfirm,
  onCancel,
  loading,
}: ActionSheetProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmText}>{loading ? 'Working...' : confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    width: '100%',
    maxWidth: 360,
  },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: SPACING.sm },
  message: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.xxl, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: SPACING.md },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  confirmText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
});
