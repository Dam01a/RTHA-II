import { useState } from "react";
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable } from "react-native";
import { Pill, Plus, Search, Clock, Bell, AlertTriangle, Check, Package } from "lucide-react-native";
import { mockMedications } from "@/src/data/mockData";
import { Medication } from "@/src/types/health";
import { colors } from "@/src/theme/colors";

export default function MedicationsScreen() {
  const [medications, setMedications] = useState<Medication[]>(mockMedications);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMedications = medications.filter((med) =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMedication = (id: string) => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, taken: !med.taken } : med))
    );
  };

  const getRefillStatus = (med: Medication) => {
    if (!med.pillsRemaining || !med.totalPills) return null;
    const percentage = (med.pillsRemaining / med.totalPills) * 100;
    if (percentage <= 20) return "critical";
    if (percentage <= 40) return "warning";
    return "good";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Medications</Text>
          <Text style={styles.subtitle}>Manage your medications and reminders</Text>
        </View>
        <Pressable style={styles.addButton}>
          <Plus color="#fff" size={20} />
          <Text style={styles.addButtonText}>Add Medication</Text>
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Search color={colors.mutedForeground} size={20} style={styles.searchIcon} />
        <TextInput
          placeholder="Search medications..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.list}>
        {filteredMedications.map((med) => {
          const refillStatus = getRefillStatus(med);
          return (
            <View key={med.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Pressable
                  onPress={() => toggleMedication(med.id)}
                  style={[
                    styles.checkButton,
                    med.taken ? styles.checkTaken : styles.checkPending,
                  ]}
                >
                  {med.taken ? (
                    <Check color={colors.successForeground} size={24} />
                  ) : (
                    <Pill color={colors.mutedForeground} size={24} />
                  )}
                </Pressable>
                <View style={styles.cardContent}>
                  <Text
                    style={[
                      styles.medName,
                      med.taken && { textDecorationLine: "line-through", color: colors.success },
                    ]}
                  >
                    {med.name}
                  </Text>
                  <Text style={styles.medDosage}>
                    {med.dosage} • {med.frequency}
                  </Text>
                  <View style={styles.scheduleRow}>
                    <View style={styles.scheduleTag}>
                      <Clock size={16} color={colors.mutedForeground} />
                      <Text style={styles.scheduleText}>{med.times.join(", ")}</Text>
                    </View>
                    {med.refillReminder && (
                      <View style={styles.refillTag}>
                        <Bell size={16} color={colors.primary} />
                        <Text style={styles.refillText}>Refill alerts on</Text>
                      </View>
                    )}
                  </View>
                  {med.pillsRemaining != null && med.totalPills != null && (
                    <View style={styles.refillSection}>
                      <View style={styles.refillHeader}>
                        <View style={styles.refillInfo}>
                          <Package size={16} color={colors.mutedForeground} />
                          <Text style={styles.refillCount}>
                            {med.pillsRemaining} of {med.totalPills} remaining
                          </Text>
                        </View>
                        {refillStatus === "critical" && (
                          <View style={styles.alertRow}>
                            <AlertTriangle size={16} color={colors.destructive} />
                            <Text style={styles.alertText}>Refill needed</Text>
                          </View>
                        )}
                        {refillStatus === "warning" && (
                          <View style={styles.alertRow}>
                            <AlertTriangle size={16} color={colors.warning} />
                            <Text style={[styles.alertText, { color: colors.warning }]}>
                              Running low
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.progressBg}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${(med.pillsRemaining / med.totalPills) * 100}%`,
                              backgroundColor:
                                refillStatus === "critical"
                                  ? colors.destructive
                                  : refillStatus === "warning"
                                  ? colors.warning
                                  : colors.success,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                  {med.notes && (
                    <Text style={styles.notes}>💡 {med.notes}</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {filteredMedications.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Pill size={32} color={colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>No medications found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? "Try a different search term" : "Add your first medication to get started"}
            </Text>
          </View>
        )}
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: "flex-start",
  },
  addButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 24,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: colors.foreground, paddingVertical: 0 },
  list: { gap: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRow: { flexDirection: "row", gap: 16 },
  checkButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  checkTaken: { borderColor: colors.success, backgroundColor: colors.success },
  checkPending: { borderColor: colors.mutedForeground + "50" },
  cardContent: { flex: 1 },
  medName: { fontSize: 18, fontWeight: "600", color: colors.foreground },
  medDosage: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  scheduleRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  scheduleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.muted + "80",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scheduleText: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  refillTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refillText: { fontSize: 14, fontWeight: "500", color: colors.primary },
  refillSection: { marginTop: 16 },
  refillHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  refillInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  refillCount: { fontSize: 14, color: colors.mutedForeground },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  alertText: { fontSize: 14, fontWeight: "500", color: colors.destructive },
  progressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  notes: { fontSize: 14, color: colors.mutedForeground, fontStyle: "italic", marginTop: 12 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.muted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: colors.foreground },
  emptySubtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 8, textAlign: "center" },
});
