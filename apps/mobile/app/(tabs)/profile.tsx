import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { colors, radii, spacing, typography } from '../../theme'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

interface SettingRow {
  icon: IoniconsName
  label: string
  value?: string
  toggle?: boolean
}

const SETTINGS: SettingRow[] = [
  { icon: 'person-outline', label: 'Account', value: 'user@example.com' },
  { icon: 'card-outline', label: 'Subscription', value: 'Premium 4K' },
  { icon: 'notifications-outline', label: 'Notifications', toggle: true },
  { icon: 'download-outline', label: 'Downloads', value: '0 saved' },
  { icon: 'globe-outline', label: 'Language', value: 'English' },
  { icon: 'videocam-outline', label: 'Playback Quality', value: 'Auto' },
  { icon: 'lock-closed-outline', label: 'Privacy & Security' },
  { icon: 'help-circle-outline', label: 'Help' },
  { icon: 'log-out-outline', label: 'Sign Out' },
]

function SettingItem({ icon, label, value, toggle }: SettingRow) {
  const [enabled, setEnabled] = useState(true)
  return (
    <TouchableOpacity style={styles.row} activeOpacity={toggle ? 1 : 0.6}>
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={colors.textSecondary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {toggle ? (
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: colors.surfaceElevated, true: colors.red }}
          thumbColor={colors.white}
        />
      ) : value ? (
        <View style={styles.rowRight}>
          <Text style={styles.rowValue}>{value}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
      )}
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar section */}
      <View style={[styles.avatarSection, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>J</Text>
        </View>
        <Text style={styles.name}>Jane Doe</Text>
        <Text style={styles.email}>user@example.com</Text>
        <TouchableOpacity style={styles.editBtn}>
          <Ionicons name="pencil" size={14} color={colors.text} />
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Plan badge */}
      <View style={styles.plan}>
        <Ionicons name="diamond-outline" size={18} color={colors.red} />
        <Text style={styles.planText}>Premium 4K Plan</Text>
        <Text style={styles.planSub}>Renews Jul 16, 2026</Text>
      </View>

      {/* Settings list */}
      <View style={styles.section}>
        {SETTINGS.map((s) => (
          <SettingItem key={s.label} {...s} />
        ))}
      </View>

      <Text style={styles.version}>Netflix Clone · v1.0.0</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  avatarSection: { alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radii['2xl'],
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarInitial: { ...typography.display, color: colors.white },
  name: { ...typography.heading, color: colors.text },
  email: { ...typography.body, color: colors.textMuted },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  editText: { ...typography.caption, color: colors.text },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.2)',
  },
  planText: { ...typography.subheading, color: colors.text, flex: 1 },
  planSub: { ...typography.caption, color: colors.textMuted },
  section: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { ...typography.body, color: colors.text },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowValue: { ...typography.caption, color: colors.textMuted },
  version: { ...typography.label, color: colors.textFaint, textAlign: 'center', marginTop: spacing['2xl'] },
})
