import { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Bell, Shield, Phone, Plus, Heart } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileCard, SettingsNavRow, SettingsSection, SettingsSwitchRow } from "../../src/components/settings";
import { colors } from "../../src/theme/colors";
import { useAuth } from "../../src/context/AuthContext";
import { ensureEmergencyContactsSeeded } from "../../src/lib/emergencyContacts";
import { db } from "../../src/lib/firebase";
import { useEmergencyContactsSubscription } from "../../src/hooks/useEmergencyContactsSubscription";
import { useSettingsPreferences } from "../../src/hooks/useSettingsPreferences";

const NOTIFICATION_ITEMS = [
  {
    key: "medicationReminders" as const,
    label: "Medication Reminders",
    desc: "Get notified when it's time to take medication",
  },
  {
    key: "appointmentReminders" as const,
    label: "Appointment Reminders",
    desc: "Receive alerts before scheduled appointments",
  },
  {
    key: "refillAlerts" as const,
    label: "Refill Alerts",
    desc: "Be notified when medication supply is low",
  },
  {
    key: "emergencyAlerts" as const,
    label: "Emergency Alerts",
    desc: "Critical notifications for emergencies",
  },
];

const ACCESSIBILITY_ITEMS = [
  { key: "largeText" as const, label: "Large Text", desc: "Increase font size for better readability" },
  {
    key: "highContrast" as const,
    label: "High Contrast",
    desc: "Enhance visual contrast for visibility on this screen",
  },
];

const SECURITY_ITEMS = [
  { label: "Change Password", desc: "Update your account password" },
  { label: "Two-Factor Authentication", desc: "Add an extra layer of security" },
  { label: "Biometric Login", desc: "Use fingerprint or face recognition" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { preferences, setPreference, isHydrated } = useSettingsPreferences();
  const { contacts } = useEmergencyContactsSubscription(user?.uid);

  const largeText = preferences.largeText;
  const highContrast = preferences.highContrast;

  const fs = useMemo(() => (base: number) => (largeText ? Math.round(base * 1.12) : base), [largeText]);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "NA";
  const displayContacts = user?.uid ? contacts : [];

  const containerStyle = useMemo(
    () => [
      styles.container,
      highContrast && { backgroundColor: "#f0f0f0" },
    ],
    [highContrast]
  );

  const headerTitleStyle = useMemo(
    () => [styles.title, { fontSize: fs(24) }, highContrast && { color: "#000" }],
    [fs, highContrast]
  );

  const headerSubtitleStyle = useMemo(
    () => [styles.subtitle, { fontSize: fs(14) }],
    [fs]
  );

  return (
    <ScrollView style={containerStyle} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={headerTitleStyle}>Settings</Text>
        <Text style={headerSubtitleStyle}>Manage your preferences and account</Text>
      </View>

      <SettingsSection highContrast={highContrast}>
        <ProfileCard
          email={user?.email ?? "No user found"}
          initials={initials}
          onSignOut={logout}
          largeText={largeText}
          highContrast={highContrast}
        />
      </SettingsSection>

      <SettingsSection
        highContrast={highContrast}
        variant="default"
        icon={
          <View style={[styles.sectionIcon, { backgroundColor: colors.destructive + "20" }]}>
            <Phone color={colors.destructive} size={20} />
          </View>
        }
        title="Emergency Contacts"
        subtitle="People to notify in emergencies"
        headerRight={
          <Pressable
            style={styles.addButton}
            onPress={() => user?.uid && ensureEmergencyContactsSeeded(user.uid)}
            disabled={!user?.uid}
          >
            <Plus color="#fff" size={16} />
            <Text style={styles.addButtonText}>Sync</Text>
          </Pressable>
        }
      >
        {user?.uid && displayContacts.length === 0 ? (
          <View style={[styles.emptyState, highContrast && styles.emptyStateHighContrast]}>
            <Text style={[styles.emptyTitle, { fontSize: fs(15) }]}>No contacts yet</Text>
            <Text style={[styles.emptyDesc, { fontSize: fs(14) }]}>
              {db
                ? "Add contacts in your account or tap Sync to seed defaults if available."
                : "Firestore is disabled in this build. Tap Sync to load sample contacts for development."}
            </Text>
          </View>
        ) : null}
        <View style={styles.contactsList}>
          {displayContacts.map((contact) => (
            <View
              key={contact.id}
              style={[
                styles.contactItem,
                highContrast && { borderWidth: 2, borderColor: colors.foreground },
              ]}
            >
              <View style={styles.contactLeft}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>
                    {contact.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.contactName, { fontSize: fs(16) }]}>{contact.name}</Text>
                  <Text style={[styles.contactRelation, { fontSize: fs(14) }]}>{contact.relationship}</Text>
                </View>
              </View>
              <Text style={[styles.contactPhone, { fontSize: fs(14) }]}>{contact.phone}</Text>
            </View>
          ))}
        </View>
      </SettingsSection>

      {isHydrated ? (
        <>
          <SettingsSection
            highContrast={highContrast}
            variant="headerRow"
            icon={
              <View style={[styles.sectionIcon, { backgroundColor: colors.primary + "20" }]}>
                <Bell color={colors.primary} size={20} />
              </View>
            }
            title="Notifications"
            subtitle="Manage your alert preferences"
          >
            {NOTIFICATION_ITEMS.map((item) => (
              <SettingsSwitchRow
                key={item.key}
                label={item.label}
                description={item.desc}
                value={preferences[item.key]}
                onValueChange={(v) => setPreference(item.key, v)}
                largeText={largeText}
                highContrast={highContrast}
              />
            ))}
          </SettingsSection>

          <SettingsSection
            highContrast={highContrast}
            variant="headerRow"
            icon={
              <View style={[styles.sectionIcon, { backgroundColor: colors.info + "20" }]}>
                <Heart color={colors.info} size={20} />
              </View>
            }
            title="Accessibility"
            subtitle="Customize your experience"
          >
            {ACCESSIBILITY_ITEMS.map((item) => (
              <SettingsSwitchRow
                key={item.key}
                label={item.label}
                description={item.desc}
                value={preferences[item.key]}
                onValueChange={(v) => setPreference(item.key, v)}
                largeText={largeText}
                highContrast={highContrast}
              />
            ))}
          </SettingsSection>
        </>
      ) : (
        <View style={styles.prefsLoadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.prefsLoadingText}>Loading preferences…</Text>
        </View>
      )}

      <SettingsSection
        highContrast={highContrast}
        variant="headerRow"
        icon={
          <View style={[styles.sectionIcon, { backgroundColor: colors.success + "20" }]}>
            <Shield color={colors.success} size={20} />
          </View>
        }
        title="Security"
        subtitle="Protect your account"
      >
        {SECURITY_ITEMS.map((item) => (
          <SettingsNavRow
            key={item.label}
            label={item.label}
            description={item.desc}
            largeText={largeText}
            highContrast={highContrast}
            comingSoon
          />
        ))}
      </SettingsSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  header: { marginBottom: 20 },
  title: { fontWeight: "700", color: colors.foreground, letterSpacing: -0.3 },
  subtitle: { color: colors.mutedForeground, marginTop: 6, lineHeight: 20 },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: "auto",
  },
  addButtonText: { fontSize: 14, fontWeight: "500", color: "#fff" },
  contactsList: { gap: 12 },
  emptyState: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.muted,
    marginBottom: 12,
  },
  emptyStateHighContrast: {
    borderColor: colors.foreground,
    borderStyle: "solid",
    borderWidth: 2,
  },
  emptyTitle: { fontWeight: "600", color: colors.foreground, marginBottom: 4 },
  emptyDesc: { color: colors.mutedForeground, lineHeight: 20 },
  contactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.muted,
  },
  contactLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  contactAvatarText: { fontSize: 14, fontWeight: "600", color: colors.mutedForeground },
  contactName: { fontWeight: "500", color: colors.foreground },
  contactRelation: { color: colors.mutedForeground, marginTop: 2 },
  contactPhone: { color: colors.mutedForeground },
  prefsLoadingCard: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prefsLoadingText: { fontSize: 14, color: colors.mutedForeground },
});
