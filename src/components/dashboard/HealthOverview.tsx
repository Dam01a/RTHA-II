import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { HeartPulse, Activity, Droplets, Scale, ChevronRight } from "lucide-react-native";
import { mockHealthMetrics } from "@/src/data/mockData";
import { colors } from "@/src/theme/colors";

const metricConfig: Record<
  string,
  { icon: React.ElementType; label: string; colorClass: string }
> = {
  blood_pressure: { icon: HeartPulse, label: "Blood Pressure", colorClass: "destructive" },
  heart_rate: { icon: Activity, label: "Heart Rate", colorClass: "primary" },
  blood_sugar: { icon: Droplets, label: "Blood Sugar", colorClass: "info" },
  weight: { icon: Scale, label: "Weight", colorClass: "success" },
  temperature: { icon: Activity, label: "Temperature", colorClass: "warning" },
};

const colorMap: Record<string, { bg: string; text: string }> = {
  destructive: { bg: colors.destructive + "20", text: colors.destructive },
  primary: { bg: colors.primary + "20", text: colors.primary },
  info: { bg: colors.info + "20", text: colors.info },
  success: { bg: colors.success + "20", text: colors.success },
  warning: { bg: colors.warning + "20", text: colors.warning },
};

export default function HealthOverview() {
  const router = useRouter();
  const latestMetrics = Object.keys(metricConfig).map((type) => {
    return mockHealthMetrics.find((m) => m.type === type) || null;
  }).filter(Boolean);

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Health Overview</Text>
          <Text style={styles.subtitle}>Your latest vitals</Text>
        </View>
        <Pressable onPress={() => router.push("/health")} style={styles.viewAll}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight color={colors.primary} size={16} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {latestMetrics.map((metric) => {
          if (!metric) return null;
          const config = metricConfig[metric.type];
          const colors_ = colorMap[config.colorClass] || colorMap.primary;
          const Icon = config.icon;
          return (
            <View key={metric.id} style={styles.metricCard}>
              <View style={[styles.iconBox, { backgroundColor: colors_.bg }]}>
                <Icon color={colors_.text} size={16} />
              </View>
              <Text style={styles.metricLabel}>{config.label}</Text>
              <Text style={styles.metricValue}>
                {metric.value}
                <Text style={styles.metricUnit}> {metric.unit}</Text>
              </Text>
              <Text style={styles.metricDate}>
                {metric.date} at {metric.time}
              </Text>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  metricLabel: { fontSize: 12, fontWeight: "500", color: colors.mutedForeground },
  metricValue: { fontSize: 20, fontWeight: "700", color: colors.foreground, marginTop: 4 },
  metricUnit: { fontSize: 12, fontWeight: "400", color: colors.mutedForeground },
  metricDate: { fontSize: 11, color: colors.mutedForeground, marginTop: 4 },
});
