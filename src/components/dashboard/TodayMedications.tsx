import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Check, Clock, Pill, ChevronRight } from "lucide-react-native";
import { mockMedications } from "@/src/data/mockData";
import { colors } from "@/src/theme/colors";

export default function TodayMedications() {
  const [medications, setMedications] = useState(mockMedications);
  const router = useRouter();

  const toggleMedication = (id: string) => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, taken: !med.taken } : med))
    );
  };

  const takenCount = medications.filter((m) => m.taken).length;
  const progress = medications.length > 0 ? (takenCount / medications.length) * 100 : 0;

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
        {medications.map((med) => (
          <View
            key={med.id}
            style={[
              styles.medItem,
              med.taken ? styles.medItemTaken : styles.medItemPending,
            ]}
          >
            <Pressable
              onPress={() => toggleMedication(med.id)}
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
              <Text style={styles.timeText}>{med.times[0]}</Text>
            </View>
          </View>
        ))}
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
