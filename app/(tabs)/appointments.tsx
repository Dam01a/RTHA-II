import { useState } from "react";
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable } from "react-native";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  MapPin,
  User,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { mockAppointments } from "@/src/data/mockData";
import { Appointment } from "@/src/types/health";
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from "date-fns";
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
  return format(date, "EEEE, MMMM d");
}

export default function AppointmentsScreen() {
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedAppointments = filteredAppointments.reduce(
    (groups, apt) => {
      if (!groups[apt.date]) groups[apt.date] = [];
      groups[apt.date].push(apt);
      return groups;
    },
    {} as Record<string, Appointment[]>
  );
  const sortedDates = Object.keys(groupedAppointments).sort();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = Array(firstDayOfWeek).fill(null);
  const appointmentDates = new Set(appointments.map((apt) => apt.date));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Appointments</Text>
          <Text style={styles.subtitle}>Schedule and manage your medical appointments</Text>
        </View>
        <Pressable style={styles.addButton}>
          <Plus color="#fff" size={20} />
          <Text style={styles.addButtonText}>New Appointment</Text>
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Search color={colors.mutedForeground} size={20} style={styles.searchIcon} />
        <TextInput
          placeholder="Search appointments..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.appointmentsList}>
        {sortedDates.map((date) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateLabel}>{formatAppointmentDate(date)}</Text>
            {groupedAppointments[date].map((apt) => {
              const tc = typeColors[apt.type] || typeColors.other;
              return (
                <View key={apt.id} style={styles.aptCard}>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeText}>
                      {apt.time.split(":")[0]}:{apt.time.split(":")[1]}
                    </Text>
                    <Text style={styles.timeAmPm}>
                      {parseInt(apt.time) >= 12 ? "PM" : "AM"}
                    </Text>
                  </View>
                  <View style={styles.aptContent}>
                    <Text style={styles.aptTitle}>{apt.title}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
                      <Text style={[styles.typeText, { color: tc.text }]}>{apt.type}</Text>
                    </View>
                    <View style={styles.aptMeta}>
                      {apt.doctorName && (
                        <View style={styles.metaItem}>
                          <User size={14} color={colors.mutedForeground} />
                          <Text style={styles.metaText}>{apt.doctorName}</Text>
                        </View>
                      )}
                      <View style={styles.metaItem}>
                        <MapPin size={14} color={colors.mutedForeground} />
                        <Text style={styles.metaText}>{apt.location}</Text>
                      </View>
                      {apt.reminder && (
                        <View style={[styles.metaItem, { color: colors.primary }]}>
                          <Bell size={14} color={colors.primary} />
                          <Text style={[styles.metaText, { color: colors.primary }]}>
                            Reminder set
                          </Text>
                        </View>
                      )}
                    </View>
                    {apt.notes && (
                      <Text style={styles.aptNotes}>📝 {apt.notes}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {sortedDates.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Calendar size={32} color={colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>No appointments found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Try a different search term"
                : "Schedule your first appointment to get started"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, -1))}>
            <ChevronLeft color={colors.foreground} size={24} />
          </Pressable>
          <Text style={styles.calendarMonth}>{format(currentMonth, "MMMM yyyy")}</Text>
          <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight color={colors.foreground} size={24} />
          </Pressable>
        </View>
        <View style={styles.dayLabels}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <Text key={day} style={styles.dayLabel}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {paddingDays.map((_, i) => (
            <View key={`p-${i}`} style={styles.calendarDay} />
          ))}
          {daysInMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const hasAppointment = appointmentDates.has(dateStr);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);
            return (
              <Pressable
                key={dateStr}
                onPress={() => setSelectedDate(day)}
                style={[
                  styles.calendarDay,
                  styles.calendarDayButton,
                  isSelected && styles.calendarDaySelected,
                  isCurrentDay && !isSelected && styles.calendarDayToday,
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    isSelected && { color: "#fff" },
                    isCurrentDay && !isSelected && { color: colors.primary },
                  ]}
                >
                  {format(day, "d")}
                </Text>
                {hasAppointment && !isSelected && (
                  <View style={styles.appointmentDot} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
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
  appointmentsList: { marginBottom: 24 },
  dateGroup: { marginBottom: 24 },
  dateLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.mutedForeground,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  aptCard: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  timeBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  timeText: { fontSize: 18, fontWeight: "700", color: colors.primary },
  timeAmPm: { fontSize: 12, color: colors.mutedForeground },
  aptContent: { flex: 1 },
  aptTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 8,
  },
  typeText: { fontSize: 12, fontWeight: "500" },
  aptMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 14, color: colors.mutedForeground },
  aptNotes: { fontSize: 14, color: colors.mutedForeground, fontStyle: "italic", marginTop: 12 },
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
  calendarSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarMonth: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  dayLabels: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: colors.mutedForeground,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarDayButton: { borderRadius: 8 },
  calendarDaySelected: { backgroundColor: colors.primary },
  calendarDayToday: { backgroundColor: colors.primary + "20" },
  calendarDayText: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  appointmentDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
