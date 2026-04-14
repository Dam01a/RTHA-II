import { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import {
  Plus,
  CalendarDays,
  Droplet,
  Pill,
  Clock,
  Stethoscope,
  Check,
  Activity,
  AlertCircle
} from "lucide-react-native";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { useMedications } from "@/src/hooks/useMedications";
import { useAppointments } from "@/src/hooks/useAppointments";
import { colors } from "@/src/theme/colors";
import { Screen } from "@/src/components/app/Screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import EmergencyButton from "@/src/components/emergency/EmergencyButton";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  // Real-time Data Hooks
  const { medications } = useMedications(user?.uid);
  const { appointments } = useAppointments(user?.uid);
  
  // Extract First Name Only
  const rawName = user?.displayName?.trim() || user?.email?.split("@")[0] || "there";
  const firstName = rawName.split(" ")[0];

  // Precision Theming
  const appBg = isDark ? "#000000" : "#F8FAFC";
  const surfaceBg = isDark ? "#121212" : "#FFFFFF";
  const surfaceBorder = isDark ? "#262626" : colors.border;
  const textColor = isDark ? "#F5F5F5" : "#0F172A";
  const mutedTextColor = isDark ? "#A3A3A3" : "#475569";
  const historyCardBg = isDark ? "#1A1A1A" : "#F1F5F9";

  // --- REAL-TIME CALCULATIONS ---
  const pendingMeds = medications?.filter(med => !med.taken) || [];
  const nextMed = pendingMeds.length > 0 ? pendingMeds[0] : null;
  const nextAppt = appointments?.length > 0 ? appointments[0] : null;

  const takenMeds = medications?.filter(med => med.taken) || [];
  const totalMedsCount = medications?.length || 0;
  const todayAdherence = totalMedsCount > 0 ? Math.round((takenMeds.length / totalMedsCount) * 100) : 0;
  
  const chartData = [40, 60, 50, 80, 60, 100, todayAdherence || 85];

  const recentActivities = [];
  if (takenMeds.length > 0) {
    const lastTaken = takenMeds[takenMeds.length - 1]; 
    recentActivities.push({
      id: `med-${lastTaken.id}`,
      title: "Meds Taken",
      subtitle: `${lastTaken.name} ${lastTaken.dosage}`,
      time: "Recent", 
      icon: Check,
      iconColor: colors.success,
      iconBg: colors.success + "1A"
    });
  }
  if (nextAppt) {
    recentActivities.push({
      id: `appt-${nextAppt.id}`,
      title: "Upcoming Visit",
      subtitle: nextAppt.doctorName || nextAppt.title,
      time: "Scheduled",
      icon: CalendarDays,
      iconColor: colors.primary,
      iconBg: colors.primary + "1A"
    });
  }

  const formatApptDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  return (
    <Screen 
      title={`Hello, ${firstName}`} 
      subtitle="Your health journey is looking steady today." 
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: appBg }} // <-- RESTORED DARK MODE FIX
    >
      <View style={[styles.contentContainer, { backgroundColor: appBg }]}>
        {/* 1. PRIORITY SAFETY ACTION */}
        <View style={styles.emergencySection}>
          <Text style={[styles.emergencyLabel, { color: mutedTextColor }]}>PRIORITY SAFETY</Text>
          <EmergencyButton />
        </View>

        {/* 2. STACKED QUICK ACTIONS */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => router.push("/medications")}
          >
            <Text style={styles.primaryActionText}>Add Medication</Text>
            <View style={styles.iconCircleWhite}>
              <Plus size={18} color={colors.primary} strokeWidth={3} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryActionBtn, { backgroundColor: isDark ? colors.primary + "30" : colors.primary + "15" }]}
            activeOpacity={0.8}
            onPress={() => router.push("/appointments")}
          >
            <Text style={[styles.secondaryActionText, { color: isDark ? "#fff" : "#334155" }]}>
              Book Appointment
            </Text>
            <CalendarDays size={20} color={isDark ? "#fff" : "#475569"} />
          </TouchableOpacity>
        </View>

        {/* 3. DAILY TIP */}
        <View style={[styles.tipCard, { backgroundColor: colors.primary + "15" }]}>
          <View style={styles.tipTextWrap}>
            <Text style={[styles.tipBadge, { color: colors.primary }]}>DAILY TIP</Text>
            <Text style={[styles.tipTitle, { color: textColor }]}>Hydration & Recovery</Text>
            <Text style={[styles.tipDesc, { color: mutedTextColor }]}>
              Increasing water intake by 20% today can help offset the fatigue from your new dosage.
            </Text>
          </View>
          <View style={styles.tipIconWrap}>
            <Droplet size={110} color={colors.primary} style={{ opacity: 0.15 }} />
          </View>
        </View>

        {/* 3. NEXT DOSE CARD */}
        <Card style={[styles.infoCard, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
              <Pill size={20} color={colors.primary} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: colors.success + "1A" }]}>
              <Text style={[styles.statusBadgeText, { color: "#166534" }]}>
                {nextMed ? "NEXT DOSE" : "ALL CAUGHT UP"}
              </Text>
            </View>
          </View>
          
          {nextMed ? (
            <View style={styles.cardContentWrap}>
              <Text style={[styles.cardTitle, { color: textColor }]}>{nextMed.name}</Text>
              <Text style={[styles.cardSubtitle, { color: mutedTextColor }]}>
                {nextMed.dosage} • {nextMed.frequency}
              </Text>
              <View style={styles.cardFooter}>
                <Clock size={16} color={colors.primary} />
                <Text style={[styles.footerText, { color: colors.primary }]}>
                  {nextMed.times?.[0] || "08:00 AM"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.cardContentWrap}>
              <Text style={[styles.cardSubtitle, { color: mutedTextColor, marginTop: 4 }]}>
                You have no pending medications for today. Great job!
              </Text>
            </View>
          )}
        </Card>

        {/* 4. COMING UP APPOINTMENT CARD */}
        <Card style={[styles.infoCard, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
              <Stethoscope size={20} color={mutedTextColor} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isDark ? "#262626" : "#F1F5F9" }]}>
              <Text style={[styles.statusBadgeText, { color: mutedTextColor }]}>
                {nextAppt ? "COMING UP" : "NO APPOINTMENTS"}
              </Text>
            </View>
          </View>
          
          {nextAppt ? (
            <View style={styles.cardContentWrap}>
              <Text style={[styles.cardTitle, { color: textColor }]}>{nextAppt.doctorName || nextAppt.title}</Text>
              <Text style={[styles.cardSubtitle, { color: mutedTextColor }]}>
                {nextAppt.type || "Scheduled Visit"}
              </Text>
              <View style={styles.cardFooter}>
                <CalendarDays size={16} color={mutedTextColor} />
                <Text style={[styles.footerText, { color: mutedTextColor }]}>
                  {formatApptDate(nextAppt.date)}, {nextAppt.time}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.cardContentWrap}>
               <Text style={[styles.cardSubtitle, { color: mutedTextColor, marginTop: 4 }]}>
                You have no upcoming appointments scheduled.
              </Text>
            </View>
          )}
        </Card>

        {/* 5. HEALTH HISTORY SECTION */}
        <View style={[styles.historyContainer, { backgroundColor: historyCardBg }]}>
          <View style={styles.historyHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.historyTitle, { color: textColor }]}>Health History</Text>
              <Text style={[styles.historySubtitle, { color: mutedTextColor }]}>Vital activity from the last 7 days</Text>
            </View>
            <TouchableOpacity activeOpacity={0.6} style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.fullReportText, { color: colors.primary }]}>Full</Text>
              <Text style={[styles.fullReportText, { color: colors.primary }]}>Report</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartContainer}>
            {chartData.map((height, index) => {
              const isLast = index === chartData.length - 1;
              return (
                <View 
                  key={`chart-${index}`} 
                  style={[
                    styles.chartBar, 
                    { 
                      height: `${height}%`, 
                      minHeight: 12, 
                      backgroundColor: isLast ? colors.primary : colors.primary + (isDark ? "40" : "20") 
                    }
                  ]} 
                />
              );
            })}
          </View>

          <View style={styles.historyList}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const IconComp = activity.icon;
                return (
                  <View key={activity.id} style={[styles.historyListItem, { backgroundColor: surfaceBg }]}>
                    <View style={styles.historyItemLeft}>
                      <View style={[styles.historyIconBox, { backgroundColor: activity.iconBg }]}>
                        <IconComp size={16} color={activity.iconColor} strokeWidth={3} />
                      </View>
                      <View style={styles.historyTextWrap}>
                        <Text style={[styles.historyItemTitle, { color: textColor }]}>{activity.title}</Text>
                        <Text style={[styles.historyItemSub, { color: mutedTextColor }]} numberOfLines={1}>
                          {activity.subtitle}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.historyItemTime, { color: mutedTextColor }]}>{activity.time}</Text>
                  </View>
                );
              })
            ) : (
              <View style={[styles.historyListItem, { backgroundColor: surfaceBg, justifyContent: 'flex-start' }]}>
                <View style={[styles.historyIconBox, { backgroundColor: colors.muted + "20", marginRight: 12 }]}>
                  <AlertCircle size={16} color={mutedTextColor} />
                </View>
                <View style={styles.historyTextWrap}>
                  <Text style={[styles.historyItemTitle, { color: textColor }]}>No recent activity</Text>
                  <Text style={[styles.historyItemSub, { color: mutedTextColor }]}>Your latest actions will appear here.</Text>
                </View>
              </View>
            )}
          </View>
        </View>

      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentContainer: { 
    paddingBottom: 100, 
    marginTop: 16,
    flex: 1
  },

  // Actions
  emergencySection: { marginBottom: 20, gap: 8 },
  emergencyLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  actionsSection: { gap: 16, marginBottom: 24 },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    elevation: 2,
  },
  primaryActionText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  iconCircleWhite: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff", alignItems: 'center', justifyContent: 'center' },
  
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  secondaryActionText: { fontSize: 16, fontWeight: "500" },

  // Daily Tip
  tipCard: { 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 24, 
    position: 'relative', 
    overflow: 'hidden',
    flexDirection: 'row',
  },
  tipTextWrap: { flex: 1, zIndex: 2, paddingRight: 20 },
  tipBadge: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 12 },
  tipTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  tipDesc: { fontSize: 14, lineHeight: 22 },
  tipIconWrap: { position: 'absolute', bottom: -20, right: -20, zIndex: 1 },

  // Info Cards 
  infoCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 0, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  
  cardContentWrap: { width: '100%', flexShrink: 1 }, 
  cardTitle: { fontSize: 22, fontWeight: "700", marginBottom: 6, flexWrap: 'wrap' },
  cardSubtitle: { fontSize: 15, marginBottom: 20, flexWrap: 'wrap' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { fontSize: 15, fontWeight: "600" },

  // Health History
  historyContainer: { borderRadius: 32, padding: 24, marginTop: 8, marginBottom: 24 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  historyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  historySubtitle: { fontSize: 14 },
  fullReportText: { fontSize: 14, fontWeight: "600", textAlign: 'right' },
  
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, marginBottom: 32, paddingHorizontal: 4 },
  chartBar: { width: '11%', borderRadius: 6 }, 
  
  historyList: { gap: 12 },
  historyListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16 },
  historyItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, paddingRight: 8 }, 
  historyIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  historyTextWrap: { flex: 1 },
  historyItemTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  historyItemSub: { fontSize: 13 },
  historyItemTime: { fontSize: 12, flexShrink: 0 },
});