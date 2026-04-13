import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Pill,
  Plus,
  Search,
  Clock,
  Bell,
  AlertTriangle,
  Check,
  Package,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { MedicationFormModal } from "../../src/components/medications/MedicationFormModal";
import { colors } from "../../src/theme/colors";
import { useAuth } from "../../src/context/AuthContext";
import { useMedications } from "../../src/hooks/useMedications";
import type { Medication } from "../../src/types/health";
import type { MedicationInput } from "../../src/lib/medications";

export default function MedicationsScreen() {
  const { user } = useAuth();
  const { medications, loading, addMedication, updateMedication, deleteMedication } = useMedications(
    user?.uid
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);

  const filteredMedications = useMemo(
    () =>
      medications.filter((med) => med.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [medications, searchQuery]
  );

  const toggleMedication = (med: Medication) => {
    if (!user?.uid) {
      return;
    }
    updateMedication(med.id, { taken: !med.taken });
  };

  const getRefillStatus = (med: Medication) => {
    if (!med.pillsRemaining || !med.totalPills) return null;
    const percentage = (med.pillsRemaining / med.totalPills) * 100;
    if (percentage <= 20) return "critical";
    if (percentage <= 40) return "warning";
    return "good";
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (med: Medication) => {
    setEditing(med);
    setModalOpen(true);
  };

  const confirmDelete = (med: Medication) => {
    Alert.alert(
      "Delete medication",
      `Remove "${med.name}" from your list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => user?.uid && deleteMedication(med.id),
        },
      ]
    );
  };

  const handleSave = async (input: MedicationInput) => {
    if (!user?.uid) {
      return;
    }
    if (editing) {
      await updateMedication(editing.id, input);
    } else {
      await addMedication(input);
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Pill color={colors.mutedForeground} size={40} />
        <Text style={styles.authTitle}>Sign in required</Text>
        <Text style={styles.authSubtitle}>Log in to add and manage your medications.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Medications</Text>
            <Text style={styles.subtitle}>Manage your medications and reminders</Text>
          </View>
          <Pressable style={styles.addButton} onPress={openAdd}>
            <Plus color="#fff" size={20} />
            <Text style={styles.addButtonText}>Add Medication</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading medications…</Text>
          </View>
        ) : null}

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
                    onPress={() => toggleMedication(med)}
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
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.medName,
                          med.taken && { textDecorationLine: "line-through", color: colors.success },
                        ]}
                      >
                        {med.name}
                      </Text>
                      <View style={styles.actions}>
                        <Pressable
                          onPress={() => openEdit(med)}
                          style={styles.actionBtn}
                          accessibilityLabel={`Edit ${med.name}`}
                        >
                          <Pencil color={colors.primary} size={20} />
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDelete(med)}
                          style={styles.actionBtn}
                          accessibilityLabel={`Delete ${med.name}`}
                        >
                          <Trash2 color={colors.destructive} size={20} />
                        </Pressable>
                      </View>
                    </View>
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
                    {med.notes ? <Text style={styles.notes}>💡 {med.notes}</Text> : null}
                  </View>
                </View>
              </View>
            );
          })}

          {!loading && filteredMedications.length === 0 && (
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

      <MedicationFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initial={editing}
        onSave={handleSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  authTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  authSubtitle: { fontSize: 15, color: colors.mutedForeground, textAlign: "center" },
  loadingBox: { paddingVertical: 24, alignItems: "center", gap: 8 },
  loadingText: { fontSize: 14, color: colors.mutedForeground },
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
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  actions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 6 },
  medName: { fontSize: 18, fontWeight: "600", color: colors.foreground, flex: 1 },
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
