import { View, Text, StyleSheet } from "react-native";
import { Pill, Calendar, HeartPulse, Clock } from "lucide-react-native";
import { colors } from "@/src/theme/colors";

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
  const c = colorMap[colorClass];
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardContent}>
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.iconBox, { backgroundColor: c.bg }]}>
          <Icon color={c.text} size={24} />
        </View>
      </View>
    </View>
  );
}

export default function QuickStats() {
  const stats = [
    {
      icon: Pill,
      label: "Medications Today",
      value: "4",
      subtitle: "2 completed, 2 remaining",
      colorClass: "primary" as const,
    },
    {
      icon: Calendar,
      label: "Appointments",
      value: "3",
      subtitle: "Next: Jan 22 at 10:00 AM",
      colorClass: "info" as const,
    },
    {
      icon: HeartPulse,
      label: "Blood Pressure",
      value: "120/80",
      subtitle: "Last checked today",
      colorClass: "success" as const,
    },
    {
      icon: Clock,
      label: "Streak",
      value: "7",
      subtitle: "Days of adherence",
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
