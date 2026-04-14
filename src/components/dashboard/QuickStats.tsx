import { View, Text, StyleSheet } from "react-native";
import { Pill, Calendar, HeartPulse, Clock } from "lucide-react-native";
import { colors } from "@/src/theme/colors";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import { useMedications } from "@/src/hooks/useMedications";
import { useAppointments } from "@/src/hooks/useAppointments";
import { useHealthMetrics } from "@/src/hooks/useHealthMetrics";
import { isToday, parseISO } from "date-fns";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle: string;
  colorClass: keyof typeof colorMap;
}

const colorMap = {
  primary: { bg: colors.primary + "20", text: colors.primary },
  info: { bg: colors.info + "20", text: colors.info },
  success: { bg: colors.success + "20", text: colors.success },
  warning: { bg: colors.warning + "20", text: colors.warning },
};

function StatCard({ icon: Icon, label, value, subtitle, colorClass }: StatCardProps) {
  const { isDark } = useTheme();
  const c = colorMap[colorClass];
  return (
    <View style={[styles.card, { backgroundColor: isDark ? "#050505" : colors.card }]}>
      <View style={styles.cardContent}>
        <View>
          <Text style={[styles.label, isDark && { color: "#a3a3a3" }]}>{label}</Text>
          <Text style={[styles.value, isDark && { color: "#f8fafc" }]}>{value}</Text>
          <Text style={[styles.subtitle, isDark && { color: "#a3a3a3" }]}>{subtitle}</Text>
        </View>
        <View style={[styles.iconBox, { backgroundColor: c.bg }]}>
          <Icon color={c.text} size={24} />
        </View>
      </View>
    </View>
  );
}

export default function QuickStats() {
  const { user } = useAuth();
  const { medications } = useMedications(user?.uid);
  const { appointments } = useAppointments(user?.uid);
  const { metrics } = useHealthMetrics(user?.uid);
  const todayMeds = medications.length;
  const takenMeds = medications.filter((m) => m.taken).length;
  const nextAppointment = appointments[0];
  const latestBloodPressure = metrics.find((m) => m.type === "blood_pressure");
  const streak = medications.length
    ? medications.filter((m) => m.taken).length
    : 0;

  const stats = [
    {
      icon: Pill,
      label: "Medications Today",
      value: String(todayMeds),
      subtitle: `${takenMeds} completed, ${Math.max(todayMeds - takenMeds, 0)} remaining`,
      colorClass: "primary" as const,
    },
    {
      icon: Calendar,
      label: "Appointments",
      value: String(appointments.length),
      subtitle: nextAppointment ? `Next: ${nextAppointment.date} at ${nextAppointment.time}` : "No upcoming appointment",
      colorClass: "info" as const,
    },
    {
      icon: HeartPulse,
      label: "Blood Pressure",
      value: latestBloodPressure ? `${latestBloodPressure.systolic ?? "--"}/${latestBloodPressure.diastolic ?? "--"}` : "--/--",
      subtitle: latestBloodPressure
        ? isToday(parseISO(latestBloodPressure.recordedAt))
          ? "Last checked today"
          : `Last checked ${latestBloodPressure.recordedAt.slice(0, 10)}`
        : "No readings yet",
      colorClass: "success" as const,
    },
    {
      icon: Clock,
      label: "Streak",
      value: String(streak),
      subtitle: "Taken medications",
      colorClass: "warning" as const,
    },
  ];

  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 16 },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  label: { fontSize: 14, color: colors.mutedForeground, fontWeight: "500" },
  value: { fontSize: 28, fontWeight: "700", color: colors.foreground, marginTop: 4 },
  subtitle: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});
