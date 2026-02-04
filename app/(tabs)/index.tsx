import { View, Text, ScrollView, StyleSheet } from "react-native";
import { format } from "date-fns";
import QuickStats from "@/src/components/dashboard/QuickStats";
import TodayMedications from "@/src/components/dashboard/TodayMedications";
import UpcomingAppointments from "@/src/components/dashboard/UpcomingAppointments";
import HealthOverview from "@/src/components/dashboard/HealthOverview";
import EmergencyButton from "@/src/components/emergency/EmergencyButton";
import { colors } from "@/src/theme/colors";

export default function DashboardScreen() {
  const today = new Date();
  const greeting = getGreeting();

  function getGreeting() {
    const hour = today.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{greeting}, John! 👋</Text>
        <Text style={styles.date}>{format(today, "EEEE, MMMM d, yyyy")}</Text>
      </View>

      <QuickStats />

      <View style={styles.grid}>
        <View style={styles.column}>
          <TodayMedications />
        </View>
        <View style={styles.column}>
          <UpcomingAppointments />
          <HealthOverview />
        </View>
      </View>

      <View style={styles.emergencySection}>
        <EmergencyButton />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  date: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  grid: { gap: 24, marginTop: 24 },
  column: { gap: 24 },
  emergencySection: { marginTop: 32 },
});
