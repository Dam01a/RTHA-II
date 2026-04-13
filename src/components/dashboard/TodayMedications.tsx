import { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Check, Clock, Pill, ChevronRight } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { useMedications } from "../../hooks/useMedications";
import type { Medication } from "../../types/health";

const MAX_ITEMS = 5;

export default function TodayMedications() {
  const router = useRouter();
  const { user } = useAuth();
  const { medications, loading, updateMedication } = useMedications(user?.uid);

  const displayList = useMemo(() => medications.slice(0, MAX_ITEMS), [medications]);

  const toggleMedication = (med: Medication) => {
    if (!user?.uid) {
      return;
    }
    updateMedication(med.id, { taken: !med.taken });
  };

  const takenCount = medications.filter((m) => m.taken).length;
  const progress = medications.length > 0 ? (takenCount / medications.length) * 100 : 0;

  if (!user) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={styles.title}>Today's Medications</Text>
        <Text style={styles.subtitle}>Sign in to track your medications.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard, { backgroundColor: colors.card }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingLabel}>Loading medications…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today's Medications</Text>
          <Text style={styles.subtitle}>
            {takenCount} of {medications.length} completed
          </Text>
        </View>
        <Pressable onPress={() => router.push("/medications")} style={styles.viewAll}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight color={colors.primary} size={16} />
        </Pressable>
      </View>

      <View style={styles.progressBar}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.list}>
        {displayList.length === 0 ? (
          <Text style={styles.emptyHint}>No medications yet. Add some on the Medications tab.</Text>
        ) : (
          displayList.map((med) => (
            <View
              key={med.id}
              style={[
                styles.medItem,
                med.taken ? styles.medItemTaken : styles.medItemPending,
              ]}
            >
              <Pressable
                onPress={() => toggleMedication(med)}
                style={[
                  styles.checkButton,
                  med.taken ? styles.checkButtonTaken : styles.checkButtonPending,
                ]}
              >
                {med.taken ? (
                  <Check color={colors.successForeground} size={20} />
                ) : (
                  <Pill color={colors.mutedForeground} size={20} />
                )}
              </Pressable>
              <View style={styles.medContent}>
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
              </View>
              <View style={styles.timeBox}>
                <Clock color={colors.mutedForeground} size={16} />
                <Text style={styles.timeText}>{med.times[0] ?? "—"}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingCard: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
  },
  loadingLabel: { fontSize: 14, color: colors.mutedForeground },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "600", color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewAllText: { fontSize: 14, color: colors.primary, fontWeight: "500" },
  progressBar: { marginBottom: 20 },
  progressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  list: { gap: 12 },
  emptyHint: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
  medItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  medItemTaken: { backgroundColor: colors.success + "15", borderWidth: 1, borderColor: colors.success + "40" },
  medItemPending: { backgroundColor: colors.muted + "80" },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  checkButtonTaken: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  checkButtonPending: {
    borderColor: colors.mutedForeground + "50",
  },
  medContent: { flex: 1 },
  medName: { fontSize: 16, fontWeight: "500", color: colors.foreground },
  medDosage: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  timeBox: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { fontSize: 14, color: colors.mutedForeground },
});
