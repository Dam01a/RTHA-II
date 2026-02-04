import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Calendar, MapPin, User, ChevronRight, Clock } from "lucide-react-native";
import { mockAppointments } from "@/src/data/mockData";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { colors } from "@/src/theme/colors";

const typeColors: Record<string, { bg: string; text: string }> = {
  checkup: { bg: colors.primary + "20", text: colors.primary },
  specialist: { bg: colors.info + "20", text: colors.info },
  lab: { bg: colors.warning + "20", text: colors.warning },
  therapy: { bg: colors.success + "20", text: colors.success },
  other: { bg: colors.muted, text: colors.mutedForeground },
};

function formatAppointmentDate(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d, yyyy");
}

export default function UpcomingAppointments() {
  const router = useRouter();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Upcoming Appointments</Text>
          <Text style={styles.subtitle}>{mockAppointments.length} scheduled</Text>
        </View>
        <Pressable onPress={() => router.push("/appointments")} style={styles.viewAll}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight color={colors.primary} size={16} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {mockAppointments.map((apt) => {
          const tc = typeColors[apt.type] || typeColors.other;
          return (
            <View key={apt.id} style={styles.aptItem}>
              <View style={styles.dateBox}>
                <Text style={styles.dateDay}>{format(parseISO(apt.date), "d")}</Text>
                <Text style={styles.dateMonth}>{format(parseISO(apt.date), "MMM")}</Text>
              </View>
              <View style={styles.aptContent}>
                <View style={styles.aptHeader}>
                  <Text style={styles.aptTitle}>{apt.title}</Text>
                  <Text style={[styles.aptType, { backgroundColor: tc.bg, color: tc.text }]}>
                    {apt.type}
                  </Text>
                </View>
                <Text style={styles.aptDate}>{formatAppointmentDate(apt.date)}</Text>
                <View style={styles.aptMeta}>
                  <View style={styles.metaItem}>
                    <Clock size={14} color={colors.mutedForeground} />
                    <Text style={styles.metaText}>{apt.time}</Text>
                  </View>
                  {apt.doctorName && (
                    <View style={styles.metaItem}>
                      <User size={14} color={colors.mutedForeground} />
                      <Text style={styles.metaText}>{apt.doctorName}</Text>
                    </View>
                  )}
                  <View style={styles.metaItem}>
                    <MapPin size={14} color={colors.mutedForeground} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {apt.location}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
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
  list: { gap: 16 },
  aptItem: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  dateBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  dateDay: { fontSize: 18, fontWeight: "700", color: colors.primary },
  dateMonth: { fontSize: 12, fontWeight: "500", color: colors.primary },
  aptContent: { flex: 1 },
  aptHeader: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  aptTitle: { fontSize: 16, fontWeight: "500", color: colors.foreground },
  aptType: {
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  aptDate: { fontSize: 14, color: colors.primary, fontWeight: "500", marginTop: 4 },
  aptMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: colors.mutedForeground },
});
