import { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import {
  Pill,
  Plus,
  Clock,
  Check,
  CalendarDays,
  ArrowRight,
  Droplet,
  Activity,
  BriefcaseMedical,
  Sun,
  Moon,
  Sunrise
} from "lucide-react-native";
import { MedicationFormModal } from "../../src/components/medications/MedicationFormModal";
import { colors } from "../../src/theme/colors";
import { useAuth } from "../../src/context/AuthContext";
import { useMedications } from "../../src/hooks/useMedications";
import type { Medication } from "../../src/types/health";
import type { MedicationInput } from "../../src/lib/medications";
import { useTheme } from "../../src/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Screen } from "@/src/components/app/Screen";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MedicationsScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { medications, loading, addMedication, updateMedication, deleteMedication } = useMedications(user?.uid);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [greeting, setGreeting] = useState("Good morning");
  const [GreetingIcon, setGreetingIcon] = useState<any>(Sunrise);

  // Dynamic Theme Colors
  const appBg = isDark ? "#000000" : "#F4F7F9"; 
  const surfaceBg = isDark ? "#121212" : colors.card;
  const surfaceBorder = isDark ? "#262626" : colors.border;
  const textColor = isDark ? "#F5F5F5" : colors.foreground;
  const mutedTextColor = isDark ? "#A3A3A3" : colors.mutedForeground;

  // Set greeting based on local time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
      setGreetingIcon(() => Sunrise);
    } else if (hour < 17) {
      setGreeting("Good afternoon");
      setGreetingIcon(() => Sun);
    } else {
      setGreeting("Good evening");
      setGreetingIcon(() => Moon);
    }
  }, []);

  const toggleMedication = (med: Medication) => {
    if (!user?.uid) return;
    // Trigger a smooth layout animation before updating state
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    updateMedication(med.id, { taken: !med.taken });
  };

  const getRefillStatus = (med: Medication) => {
    if (!med.pillsRemaining || !med.totalPills) return null;
    const percentage = (med.pillsRemaining / med.totalPills) * 100;
    if (percentage <= 20) return "critical";
    if (percentage <= 40) return "warning";
    return "good";
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (med: Medication) => {
    setEditing(med);
    setModalOpen(true);
  };

  const handleSave = async (input: MedicationInput) => {
    if (!user?.uid) {
      throw new Error("You must be signed in to save medications.");
    }
    if (editing) {
      await updateMedication(editing.id, input);
    } else {
      await addMedication(input);
    }
  };

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: appBg }]}>
        <Pill color={mutedTextColor} size={56} strokeWidth={1.5} />
        <Text style={[styles.authTitle, { color: textColor }]}>Sign in required</Text>
        <Text style={[styles.authSubtitle, { color: mutedTextColor }]}>Log in to add and manage your medications securely.</Text>
      </View>
    );
  }

  return (
    <>
      <Screen 
        title="Medications" 
        subtitle="Your sanctuary for precision health management." 
        style={{ backgroundColor: appBg }}
        showsVerticalScrollIndicator={false}
        contentClassName="px-0 pt-0 pb-0"
      >
          {/* Personalized Greeting */}
          <View style={styles.greetingContainer}>
            <GreetingIcon color={colors.primary} size={24} style={{ marginRight: 8 }} />
            <Text style={[styles.greetingText, { color: textColor }]}>{greeting}, {user.displayName || "there"}</Text>
          </View>

          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: mutedTextColor, marginTop: 8 }}>Syncing your schedule…</Text>
            </View>
          )}

          {/* 1. TODAY'S SCHEDULE (Robust Flexbox Timeline) */}
          <View style={[styles.scheduleSection, { backgroundColor: isDark ? "#0A0A0A" : colors.muted + "30" }]}>
            <View style={styles.scheduleHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Today's Schedule</Text>
                <Text style={styles.dateText}>OCTOBER 24, 2023</Text>
              </View>
              <TouchableOpacity style={[styles.calendarBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
                <CalendarDays color="#fff" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.timelineWrapper}>
              {medications.length > 0 ? (
                medications.map((med, index) => {
                  const time = med.times?.[0] || "08:00";
                  const isLast = index === medications.length - 1;

                  return (
                    <View key={`timeline-${med.id}`} style={styles.timelineRow}>
                      {/* Left Column: Time */}
                      <View style={styles.timeCol}>
                        <View style={[styles.timeBubble, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}>
                          <Text style={[styles.timeText, { color: textColor }]}>{time}</Text>
                        </View>
                      </View>

                      {/* Center Column: Node & Line */}
                      <View style={styles.lineCol}>
                        <View style={[
                          styles.timelineNode, 
                          { backgroundColor: med.taken ? colors.success : surfaceBg, borderColor: med.taken ? colors.success : colors.primary }
                        ]}>
                          {med.taken && <Check size={10} color="#fff" strokeWidth={4} />}
                        </View>
                        {!isLast && <View style={[styles.timelineLine, { backgroundColor: surfaceBorder }]} />}
                      </View>

                      {/* Right Column: Card */}
                      <View style={styles.cardCol}>
                        <Card style={[styles.timelineCard, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}>
                          <View style={styles.cardInfo}>
                            <View style={[styles.iconCircle, { backgroundColor: med.taken ? colors.success + "15" : colors.primary + "10" }]}>
                              <Pill size={20} color={med.taken ? colors.success : colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.medName, { color: textColor, textDecorationLine: med.taken ? 'line-through' : 'none' }]}>
                                {med.name}
                              </Text>
                              <Text style={[styles.medDosage, { color: mutedTextColor }]}>
                                {med.dosage} • {med.notes ? "With food" : "As directed"}
                              </Text>
                            </View>
                          </View>

                          {med.taken ? (
                            <View style={[styles.statusBadge, { backgroundColor: colors.success + "15" }]}>
                              <Check size={14} color={colors.success} strokeWidth={3} />
                              <Text style={[styles.statusText, { color: colors.success }]}>TAKEN</Text>
                            </View>
                          ) : (
                            <TouchableOpacity 
                              style={[styles.takeBtn, { backgroundColor: colors.primary }]}
                              onPress={() => toggleMedication(med)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.takeBtnText}>Mark Taken</Text>
                            </TouchableOpacity>
                          )}
                        </Card>
                      </View>
                    </View>
                  );
                })
              ) : (
                 <View style={styles.emptyTimeline}>
                   <Clock color={mutedTextColor} size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                   <Text style={[styles.emptyTimelineText, { color: mutedTextColor }]}>No medications scheduled for today.</Text>
                 </View>
              )}
            </View>
          </View>

          {/* 2. HERO ADD BUTTON */}
          <TouchableOpacity 
            style={[styles.heroButton, { backgroundColor: colors.primary }]} 
            onPress={openAdd}
            activeOpacity={0.9}
          >
            <View style={styles.heroIconWrap}>
              <Plus color="#fff" size={26} strokeWidth={3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Add New Medication</Text>
              <Text style={styles.heroSubtitle}>Track a new prescription or supplement</Text>
            </View>
          </TouchableOpacity>

          {/* 3. WEEKLY ADHERENCE */}
          <View style={[styles.adherenceCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "20", borderWidth: 1 }]}>
            <Text style={[styles.adherenceTitle, { color: textColor }]}>Weekly Adherence</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreNumber, { color: textColor }]}>94<Text style={styles.scorePercent}>%</Text></Text>
              <View style={[styles.scoreBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.scoreLabel, { color: colors.primary }]}>Excellent</Text>
              </View>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? "#262626" : "#ffffff" }]}>
              <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: "94%" }]} />
            </View>
            <Text style={[styles.adherenceDesc, { color: colors.primary }]}>
              You've missed <Text style={{ fontWeight: '700' }}>only 1 dose in the last 7 days.</Text> Consistency is key to your treatment success.
            </Text>
          </View>

          {/* 4. ACTIVE PRESCRIPTIONS */}
          <View style={styles.prescriptionsHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Active Prescriptions</Text>
            <TouchableOpacity style={styles.historyLink} activeOpacity={0.6}>
              <Text style={[styles.historyText, { color: colors.primary }]}>View History</Text>
              <ArrowRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {medications.map((med, index) => {
              const refillStatus = getRefillStatus(med);
              const IconComp = index % 3 === 0 ? BriefcaseMedical : index % 3 === 1 ? Droplet : Activity;
              const tagText = index % 3 === 0 ? "CHRONIC" : index % 3 === 1 ? "VITALS" : "GLUCOSE";

              return (
                <TouchableOpacity key={`list-${med.id}`} onPress={() => openEdit(med)} activeOpacity={0.7}>
                  <Card style={[styles.prescriptionCard, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}>
                    
                    <View style={styles.prescHeaderRow}>
                      <View style={[styles.prescIconWrap, { backgroundColor: colors.muted + "40" }]}>
                        <IconComp size={22} color={colors.primary} />
                      </View>
                      <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "15" }]}>
                        <Text style={[styles.categoryText, { color: colors.primary }]}>{tagText}</Text>
                      </View>
                    </View>

                    <Text style={[styles.prescTitle, { color: textColor }]}>{med.name}</Text>
                    <Text style={[styles.prescSubtitle, { color: mutedTextColor }]}>
                      {med.notes || "General Health Management"}
                    </Text>

                    <View style={[styles.divider, { backgroundColor: surfaceBorder }]} />

                    <View style={styles.dataGrid}>
                      <View style={styles.dataCol}>
                        <Text style={[styles.dataLabel, { color: mutedTextColor }]}>Dosage</Text>
                        <Text style={[styles.dataValue, { color: textColor }]}>{med.dosage}</Text>
                      </View>
                      <View style={[styles.dataCol, { alignItems: 'center' }]}>
                        <Text style={[styles.dataLabel, { color: mutedTextColor }]}>Frequency</Text>
                        <Text style={[styles.dataValue, { color: textColor }]}>{med.frequency}</Text>
                      </View>
                      <View style={[styles.dataCol, { alignItems: 'flex-end' }]}>
                        <Text style={[styles.dataLabel, { color: mutedTextColor }]}>Supply</Text>
                        <Text style={[
                          styles.dataValue, 
                          { color: refillStatus === 'critical' ? colors.destructive : refillStatus === 'warning' ? colors.warning : colors.success }
                        ]}>
                          {med.pillsRemaining != null ? `${med.pillsRemaining} days left` : "Unknown"}
                        </Text>
                      </View>
                    </View>

                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
      </Screen>

      <MedicationFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initial={editing}
        onSave={handleSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  authTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  authSubtitle: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  loadingBox: { paddingVertical: 24, alignItems: "center", justifyContent: "center" },
  
  // Greeting
  greetingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 },
  greetingText: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },

  // Section Titles
  sectionTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },

  // Timeline Structure (Flexbox)
  scheduleSection: { borderRadius: 28, padding: 24, marginBottom: 24 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  dateText: { fontSize: 12, fontWeight: "700", color: "#64748b", marginTop: 4, letterSpacing: 1.2 },
  calendarBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  
  timelineWrapper: { position: 'relative' },
  timelineRow: { flexDirection: 'row', minHeight: 90 },
  
  timeCol: { width: 65, alignItems: 'flex-start', paddingTop: 18 },
  timeBubble: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  timeText: { fontSize: 12, fontWeight: "700" },
  
  lineCol: { width: 30, alignItems: 'center' },
  timelineNode: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, marginTop: 24, zIndex: 2, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1, marginTop: -4, marginBottom: -24 }, // Connects dots smoothly
  
  cardCol: { flex: 1, paddingLeft: 12, paddingBottom: 24 },
  timelineCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  medName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  medDosage: { fontSize: 13, fontWeight: "500" },
  
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  takeBtn: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 12, borderRadius: 16 },
  takeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  emptyTimeline: { alignItems: 'center', paddingVertical: 30 },
  emptyTimelineText: { fontSize: 15, fontWeight: '500' },

  // Hero Add Button
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    marginBottom: 32,
    shadowColor: "#0052cc",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  heroIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.2)", alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 6, letterSpacing: -0.5 },
  heroSubtitle: { color: "#fff", fontSize: 14, opacity: 0.9, lineHeight: 20 },

  // Adherence Card
  adherenceCard: { borderRadius: 28, padding: 24, marginBottom: 40 },
  adherenceTitle: { fontSize: 17, fontWeight: "700", marginBottom: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  scoreNumber: { fontSize: 48, fontWeight: "800", lineHeight: 52 },
  scorePercent: { fontSize: 24, fontWeight: "600" },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scoreLabel: { fontSize: 14, fontWeight: "800" },
  progressBarBg: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 20 },
  progressBarFill: { height: '100%', borderRadius: 5 },
  adherenceDesc: { fontSize: 13, lineHeight: 20 },

  // Active Prescriptions List
  prescriptionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 },
  historyLink: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  historyText: { fontSize: 14, fontWeight: "700" },
  list: { gap: 16 },
  
  prescriptionCard: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  prescHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  prescIconWrap: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  categoryText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  
  prescTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  prescSubtitle: { fontSize: 14, marginBottom: 20 },
  divider: { height: 1, width: '100%', marginBottom: 20 },
  
  dataGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dataCol: { flex: 1 },
  dataLabel: { fontSize: 12, marginBottom: 6, fontWeight: "500" },
  dataValue: { fontSize: 14, fontWeight: "700" },
});