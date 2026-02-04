import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import {
  User,
  Bell,
  Shield,
  Phone,
  Edit,
  Plus,
  ChevronRight,
  Heart,
} from "lucide-react-native";
import { Switch } from "react-native";
import { mockEmergencyContacts } from "@/src/data/mockData";
import { EmergencyContact } from "@/src/types/health";
import { colors } from "@/src/theme/colors";

export default function SettingsScreen() {
  const [emergencyContacts] = useState<EmergencyContact[]>(mockEmergencyContacts);
  const [settings, setSettings] = useState({
    medicationReminders: true,
    appointmentReminders: true,
    refillAlerts: true,
    emergencyAlerts: true,
    largeText: false,
    highContrast: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your preferences and account</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>john.doe@email.com</Text>
          </View>
          <Pressable style={styles.editButton}>
            <Edit color={colors.foreground} size={16} />
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.destructive + "20" }]}>
            <Phone color={colors.destructive} size={20} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <Text style={styles.sectionSubtitle}>People to notify in emergencies</Text>
          </View>
          <Pressable style={styles.addButton}>
            <Plus color="#fff" size={16} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
        <View style={styles.contactsList}>
          {emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
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
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRelation}>{contact.relationship}</Text>
                </View>
              </View>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.primary + "20" }]}>
            <Bell color={colors.primary} size={20} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <Text style={styles.sectionSubtitle}>Manage your alert preferences</Text>
          </View>
        </View>
        {[
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
        ].map((item) => (
          <View key={item.key} style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.settingDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={settings[item.key]}
              onValueChange={() => toggleSetting(item.key)}
              trackColor={{ false: colors.muted, true: colors.primary + "60" }}
              thumbColor={settings[item.key] ? colors.primary : colors.mutedForeground}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.info + "20" }]}>
            <Heart color={colors.info} size={20} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Accessibility</Text>
            <Text style={styles.sectionSubtitle}>Customize your experience</Text>
          </View>
        </View>
        {[
          { key: "largeText" as const, label: "Large Text", desc: "Increase font size for better readability" },
          {
            key: "highContrast" as const,
            label: "High Contrast",
            desc: "Enhance visual contrast for visibility",
          },
        ].map((item) => (
          <View key={item.key} style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.settingDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={settings[item.key]}
              onValueChange={() => toggleSetting(item.key)}
              trackColor={{ false: colors.muted, true: colors.primary + "60" }}
              thumbColor={settings[item.key] ? colors.primary : colors.mutedForeground}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.success + "20" }]}>
            <Shield color={colors.success} size={20} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Security</Text>
            <Text style={styles.sectionSubtitle}>Protect your account</Text>
          </View>
        </View>
        {[
          { label: "Change Password", desc: "Update your account password" },
          {
            label: "Two-Factor Authentication",
            desc: "Add an extra layer of security",
          },
          {
            label: "Biometric Login",
            desc: "Use fingerprint or face recognition",
          },
        ].map((item) => (
          <Pressable key={item.label} style={styles.securityRow}>
            <View>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.settingDesc}>{item.desc}</Text>
            </View>
            <ChevronRight color={colors.mutedForeground} size={20} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: "#fff" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "600", color: colors.foreground },
  profileEmail: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  sectionSubtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
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
  contactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
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
  contactName: { fontSize: 16, fontWeight: "500", color: colors.foreground },
  contactRelation: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  contactPhone: { fontSize: 14, color: colors.mutedForeground },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: 12,
  },
  settingLabel: { fontSize: 16, fontWeight: "500", color: colors.foreground },
  settingDesc: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  securityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: 12,
  },
});
