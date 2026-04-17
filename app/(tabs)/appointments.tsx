import { useMemo, useState } from "react";
import { Alert, View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import {
  CalendarDays,
  Plus,
  MapPin,
  Stethoscope,
  Headset,
  ChevronLeft,
  ChevronRight,
  BriefcaseMedical,
  Video,
  ArrowRight,
  FileText,
  CalendarArrowDown
} from "lucide-react-native";
import { useAuth } from "@/src/context/AuthContext";
import { useAppointments } from "@/src/hooks/useAppointments";
import type { Appointment } from "@/src/types/health";
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay, isBefore } from "date-fns";
import { colors } from "@/src/theme/colors";
import { useTheme } from "@/src/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Screen } from "@/src/components/app/Screen";
import { AppointmentFormModal } from "@/src/components/appointments/AppointmentFormModal";
import type { AppointmentInput } from "@/src/lib/appointments";
import { useProviders } from "@/src/hooks/useProviders";

const typeColors: Record<string, { bg: string; text: string }> = {
  checkup: { bg: colors.primary + "1A", text: colors.primary },
  specialist: { bg: colors.info + "1A", text: colors.info },
  lab: { bg: colors.warning + "1A", text: colors.warning },
  therapy: { bg: colors.success + "1A", text: colors.success },
  other: { bg: colors.muted + "33", text: colors.mutedForeground },
};

const generateDays = (startDate: Date) => {
  return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
};

function isSameDateString(dateA: string, dateB: string) {
  return dateA.slice(0, 10) === dateB.slice(0, 10);
}

function visitTypeShort(v: Appointment["visitType"]) {
  switch (v) {
    case "in_person":
      return "In person";
    case "virtual":
      return "Virtual";
    case "follow_up":
      return "Follow-up";
    default:
      return "";
  }
}

export default function AppointmentsScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { appointments, addAppointment, updateAppointment, deleteAppointment } = useAppointments(user?.uid);
  const { providers, loading: providersLoading } = useProviders(user?.uid);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekOffset, setWeekOffset] = useState(0); 
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  
  const selectedDateString = format(selectedDate, "yyyy-MM-dd");
  const isCurrentWeek = weekOffset === 0;
  
  // Robust Dark Mode Colors
  const appBg = isDark ? "#000000" : colors.background;
  const surfaceBg = isDark ? "#121212" : colors.card;
  const surfaceBorder = isDark ? "#262626" : colors.border;
  const dateStripBg = isDark ? "#0A0A0A" : colors.secondary + "20";
  const textColor = isDark ? "#F5F5F5" : colors.foreground;
  const mutedTextColor = isDark ? "#A3A3A3" : colors.mutedForeground;

  const filteredAppointments = appointments.filter((apt) => {
    return isSameDateString(apt.date, selectedDateString);
  });

  const weekDays = useMemo(() => {
    const baseDate = addDays(new Date(), weekOffset * 7);
    return generateDays(baseDate);
  }, [weekOffset]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (appointment: Appointment) => {
    setEditing(appointment);
    setModalOpen(true);
  };

  const jumpToToday = () => {
    setWeekOffset(0);
    setSelectedDate(new Date());
  };

  const handleSave = async (input: AppointmentInput) => {
    if (!user?.uid) {
      throw new Error("You must be signed in to book appointments.");
    }
    if (editing) {
      await updateAppointment(editing.id, input);
      setEditing(null);
      return;
    }
    await addAppointment(input);
  };

  const pastVisits = useMemo(() => {
    const todayStart = startOfDay(new Date());
    return [...appointments]
      .filter((a) => {
        try {
          return isBefore(startOfDay(parseISO(a.date)), todayStart);
        } catch {
          return false;
        }
      })
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
      .slice(0, 6);
  }, [appointments]);

  return (
    <Screen 
      title="Your Schedule" 
      subtitle="CARE MANAGEMENT" 
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: appBg }}
      contentClassName="px-0 pt-0 pb-0"
    >
      <View style={styles.heroSection}>
        {providersLoading && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: mutedTextColor, fontSize: 13 }}>Loading providers…</Text>
          </View>
        )}
        <TouchableOpacity 
          style={[styles.mainScheduleButton, { backgroundColor: colors.primary }]} 
          onPress={openAdd} 
          disabled={!user}
        >
          <View style={styles.plusCircle}>
            <Plus color={colors.primary} size={18} strokeWidth={3} />
          </View>
          <Text style={styles.mainScheduleText}>Schedule New{"\n"}Appointment</Text>
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      <View style={[styles.dateSelectorContainer, { backgroundColor: dateStripBg }]}>
        <View style={styles.dateHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {format(weekDays[0], "MMMM yyyy")}
            </Text>
            <Text style={{ color: mutedTextColor, fontSize: 12, fontWeight: "600", marginTop: 2 }}>
              Select Date
            </Text>
          </View>
          
          <View style={styles.dateArrows}>
            {!isCurrentWeek && (
              <TouchableOpacity 
                style={[styles.todayButton, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}
                onPress={jumpToToday}
              >
                <Text style={[styles.todayText, { color: colors.primary }]}>Today</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.arrowButton, { backgroundColor: surfaceBg }]}
              onPress={() => setWeekOffset(prev => prev - 1)}
            >
              <ChevronLeft size={18} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.arrowButton, { backgroundColor: surfaceBg }]}
              onPress={() => setWeekOffset(prev => prev + 1)}
            >
              <ChevronRight size={18} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.dateScroll}
        >
          {weekDays.map((date) => {
            const isSelected = isSameDateString(format(date, "yyyy-MM-dd"), selectedDateString);
            return (
              <TouchableOpacity 
                key={date.toISOString()}
                style={[
                  styles.datePill, 
                  isSelected ? { backgroundColor: colors.primary, borderWidth: 0 } : { backgroundColor: surfaceBg, borderColor: surfaceBorder, borderWidth: 1 }
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dayText, { color: isSelected ? "#fff" : mutedTextColor }]}>
                  {format(date, "EEE").toUpperCase()}
                </Text>
                <Text style={[styles.dateText, { color: isSelected ? "#fff" : textColor }]}>
                  {format(date, "dd")}
                </Text>
                {isSelected && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.appointmentsList}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Upcoming{"\n"}Appointments</Text>
          <View style={[styles.badge, { backgroundColor: colors.primary + "1A" }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{filteredAppointments.length} SCHEDULED</Text>
          </View>
        </View>

        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((apt) => {
            const tc = typeColors[apt.type] || typeColors.other;
            const IconComp = apt.type === 'therapy' ? Video : BriefcaseMedical;

            return (
              <Card key={apt.id} style={[styles.aptCard, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}>
                <View style={[styles.iconBox, { backgroundColor: tc.bg }]}>
                  <IconComp size={22} color={tc.text} />
                </View>
                
                <Text style={[styles.aptTitle, { color: textColor }]}>
                  {apt.providerName || apt.doctorName || apt.title}
                </Text>
                
                <View style={styles.aptMeta}>
                  <View style={styles.metaItem}>
                    <Stethoscope size={14} color={mutedTextColor} />
                    <Text style={[styles.metaText, { color: mutedTextColor }]} numberOfLines={2}>
                      {apt.reason || apt.title}
                    </Text>
                  </View>
                  {visitTypeShort(apt.visitType) ? (
                    <View style={styles.metaItem}>
                      <FileText size={14} color={mutedTextColor} />
                      <Text style={[styles.metaText, { color: mutedTextColor }]}>{visitTypeShort(apt.visitType)}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaItem}>
                    <MapPin size={14} color={mutedTextColor} />
                    <Text style={[styles.metaText, { color: mutedTextColor }]}>{apt.location}</Text>
                  </View>
                </View>

                <View style={styles.aptTimeRow}>
                  <Text style={[styles.aptTimeTitle, { color: colors.primary }]}>
                    {isToday(parseISO(apt.date)) ? "Today" : isTomorrow(parseISO(apt.date)) ? "Tomorrow" : format(parseISO(apt.date), "MMM dd, yyyy")}
                  </Text>
                  <Text style={[styles.aptTimeValue, { color: textColor }]}>{apt.time}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity onPress={() => openEdit(apt)}>
                    <Text style={[styles.linkText, { color: colors.primary }]}>
                      {apt.type === 'therapy' ? "Join Meeting" : "View Details"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        ) : (
          <View style={[styles.emptyState, { backgroundColor: surfaceBg, borderColor: surfaceBorder, borderWidth: 1 }]}>
             <View style={{ backgroundColor: colors.primary + "10", padding: 16, borderRadius: 20, marginBottom: 16 }}>
               <CalendarDays size={32} color={colors.primary} style={{ opacity: 0.8 }} />
             </View>
             <Text style={[styles.emptySubtitle, { color: textColor, marginBottom: 8 }]}>No appointments on this date.</Text>
             <Text style={{ color: mutedTextColor, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
               Take a day off, or schedule a new visit if needed.
             </Text>
             <Button variant="outline" size="sm" onPress={openAdd} style={{ borderColor: surfaceBorder }}>
               <CalendarArrowDown size={14} color={colors.primary} style={{ marginRight: 6 }} />
               <Text style={{ color: colors.primary, fontWeight: "600" }}>Schedule Now</Text>
             </Button>
          </View>
        )}
      </View>

      {/* Recent Visits Timeline */}
      <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 16 }]}>Recent Visits</Text>
      <Card style={[styles.recentVisitsCard, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}>
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineLine, { backgroundColor: surfaceBorder }]} />
          {pastVisits.length === 0 ? (
            <Text style={{ color: mutedTextColor, paddingLeft: 28, paddingBottom: 12 }}>
              No past appointments yet. Completed visits will appear here.
            </Text>
          ) : (
            pastVisits.map((apt, idx) => (
              <View key={apt.id} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: idx === 0 ? colors.primary : mutedTextColor,
                      borderColor: idx === 0 ? colors.primary + "40" : "transparent",
                      borderWidth: idx === 0 ? 4 : 0,
                    },
                  ]}
                />
                <Text style={[styles.timelineDate, { color: mutedTextColor }]}>
                  {format(parseISO(apt.date), "MMM dd, yyyy").toUpperCase()}
                </Text>
                <Text style={[styles.timelineTitle, { color: textColor }]}>{apt.title}</Text>
                <Text style={[styles.timelineDoctor, { color: mutedTextColor }]}>
                  {apt.providerName || apt.doctorName || "Provider"}
                </Text>
                <TouchableOpacity style={styles.timelineAction} onPress={() => openEdit(apt)}>
                  <Text style={[styles.timelineActionText, { color: colors.primary }]}>Details</Text>
                  <ArrowRight size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.fullHistoryButton, { backgroundColor: isDark ? "#262626" : colors.secondary + "30" }]}
          onPress={() => Alert.alert("History", "Full history view can list all past appointments in a future update.")}
        >
          <Text style={[styles.fullHistoryText, { color: textColor }]}>View Full History</Text>
          <ArrowRight size={16} color={mutedTextColor} />
        </TouchableOpacity>
      </Card>

      {/* Support Banner */}
      <View style={[styles.supportBanner, { backgroundColor: colors.primary + "1A" }]}>
        <Text style={[styles.supportTitle, { color: textColor }]}>Need assistance{"\n"}with your booking?</Text>
        <Text style={[styles.supportText, { color: textColor, opacity: 0.8 }]}>
          Our 24/7 patient advocacy team is ready to help you find the right specialist or reschedule your existing appointments with ease.
        </Text>
        
        <View style={styles.supportActions}>
          <Button style={{ backgroundColor: colors.primary, borderRadius: 24, height: 44, paddingHorizontal: 20 }} onPress={() => Alert.alert("Support", "Chat connecting...")}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Chat Now</Text>
          </Button>
          <Button variant="outline" style={{ borderRadius: 24, height: 44, paddingHorizontal: 20, backgroundColor: surfaceBg, borderColor: surfaceBorder }} onPress={() => Alert.alert("Support", "Dialing...")}>
            <Text style={{ color: textColor, fontWeight: "600" }}>Call Support</Text>
          </Button>
        </View>

        <View style={styles.supportIconWrap}>
          <Headset color={colors.primary} size={150} strokeWidth={1} style={styles.watermark} />
        </View>
      </View>

      <AppointmentFormModal
        visible={modalOpen}
        initial={editing}
        providers={providers}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroSection: { marginBottom: 28, marginTop: 12 },
  mainScheduleButton: {
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'flex-start',
  },
  plusCircle: {
    backgroundColor: "#ffffff",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  mainScheduleText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  
  dateSelectorContainer: {
    marginBottom: 32,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginHorizontal: -16, 
  },
  dateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  dateArrows: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 4,
  },
  todayText: {
    fontSize: 12,
    fontWeight: "700",
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateScroll: {
    gap: 12,
  },
  datePill: {
    width: 64,
    height: 90,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dayText: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 22,
    fontWeight: "800",
  },
  activeDot: {
    width: 4,
    height: 4,
    backgroundColor: "#ffffff",
    borderRadius: 2,
    marginTop: 8,
  },

  sectionHeaderRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: 20 
  },
  badge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: "800", 
    letterSpacing: 0.5
  },
  appointmentsList: { marginBottom: 32 },

  aptCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  aptTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  aptMeta: { gap: 8, marginBottom: 20 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontSize: 13, fontWeight: "500" },
  aptTimeRow: { marginBottom: 16 },
  aptTimeTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  aptTimeValue: { fontSize: 14, fontWeight: "500" },
  cardFooter: { flexDirection: "row" },
  linkText: { fontSize: 14, fontWeight: "700" },
  
  emptyState: { padding: 40, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptySubtitle: { fontSize: 16, fontWeight: "700" },

  recentVisitsCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
  },
  timelineContainer: {
    position: 'relative',
    marginLeft: 8,
    marginBottom: 12,
  },
  timelineLine: {
    position: 'absolute',
    left: 4,
    top: 12,
    bottom: 12,
    width: 2,
    borderRadius: 1,
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 28,
    marginBottom: 28,
  },
  timelineDot: {
    position: 'absolute',
    left: -1,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineDate: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  timelineTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  timelineDoctor: { fontSize: 14, marginBottom: 10 },
  timelineAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timelineActionText: { fontSize: 13, fontWeight: "700" },
  fullHistoryButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullHistoryText: { fontSize: 14, fontWeight: "700" },

  supportBanner: { 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 48,
    position: 'relative',
    overflow: 'hidden',
  },
  supportTitle: { fontSize: 24, fontWeight: "800", marginBottom: 12, zIndex: 2, letterSpacing: -0.5 },
  supportText: { fontSize: 14, lineHeight: 22, marginBottom: 24, zIndex: 2 },
  supportActions: { flexDirection: "row", gap: 12, zIndex: 2 },
  supportIconWrap: { 
    position: 'absolute',
    bottom: -30,
    right: -20,
    opacity: 0.1, 
    zIndex: 1,
  },
  watermark: {
    transform: [{ rotate: '-15deg' }]
  }
});