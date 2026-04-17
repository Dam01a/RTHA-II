import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { colors } from "@/src/theme/colors";
import { useTheme } from "@/src/context/ThemeContext";
import type { Appointment, Provider } from "@/src/types/health";
import type { AppointmentInput } from "@/src/lib/appointments";

const CATEGORY_OPTIONS: Appointment["type"][] = ["checkup", "specialist", "lab", "therapy", "other"];
const VISIT_TYPE_OPTIONS: NonNullable<Appointment["visitType"]>[] = ["in_person", "virtual", "follow_up"];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function visitTypeLabel(v: Appointment["visitType"]) {
  switch (v) {
    case "in_person":
      return "In person";
    case "virtual":
      return "Virtual";
    case "follow_up":
      return "Follow-up";
    default:
      return "In person";
  }
}

type Props = {
  visible: boolean;
  initial: Appointment | null;
  providers: Provider[];
  onClose: () => void;
  onSave: (input: AppointmentInput) => Promise<void>;
};

type FormState = AppointmentInput;

function emptyForm(): FormState {
  return {
    title: "",
    date: todayDate(),
    time: "09:00",
    location: "",
    providerId: undefined,
    providerName: undefined,
    doctorName: undefined,
    reason: "",
    visitType: "in_person",
    type: "checkup",
    notes: "",
    reminder: true,
    reminderSmsEnabled: true,
  };
}

function fromInitial(initial: Appointment): FormState {
  return {
    title: initial.title,
    date: initial.date,
    time: initial.time,
    location: initial.location,
    providerId: initial.providerId,
    providerName: initial.providerName,
    doctorName: initial.doctorName,
    reason: initial.reason ?? "",
    visitType: initial.visitType ?? "in_person",
    type: initial.type,
    notes: initial.notes ?? "",
    reminder: initial.reminder,
    reminderSmsEnabled: initial.reminderSmsEnabled ?? false,
  };
}

export function AppointmentFormModal({ visible, initial, providers, onClose, onSave }: Props) {
  const { isDark } = useTheme();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setForm(initial ? fromInitial(initial) : emptyForm());
  }, [visible, initial]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectProvider = (p: Provider) => {
    setForm((prev) => ({
      ...prev,
      providerId: p.id,
      providerName: p.name,
      doctorName: p.name,
      location: prev.location.trim() ? prev.location : p.location,
      title: prev.title.trim() ? prev.title : `Visit with ${p.name}`,
    }));
  };

  const handleSave = async () => {
    if (!form.providerId || !form.providerName) {
      Alert.alert("Provider required", "Choose a doctor or clinic from the list.");
      return;
    }
    if (!form.reason?.trim()) {
      Alert.alert("Reason required", "Please describe the reason for this visit.");
      return;
    }
    if (!form.visitType) {
      Alert.alert("Visit type", "Select how this visit will happen (in person, virtual, or follow-up).");
      return;
    }
    if (!form.date.trim() || !form.time.trim()) {
      Alert.alert("Missing date/time", "Please enter both date and time.");
      return;
    }
    if (!form.location.trim()) {
      Alert.alert("Location required", "Enter where the visit takes place (or your home for telehealth).");
      return;
    }
    const title =
      form.title.trim() ||
      `${visitTypeLabel(form.visitType)} — ${form.providerName}`;

    setSaving(true);
    try {
      await onSave({
        ...form,
        title: title.trim(),
        date: form.date.trim(),
        time: form.time.trim(),
        location: form.location.trim(),
        providerId: form.providerId,
        providerName: form.providerName,
        doctorName: form.doctorName ?? form.providerName,
        reason: form.reason.trim(),
        visitType: form.visitType,
        notes: form.notes?.trim() || undefined,
        reminder: form.reminderSmsEnabled,
        reminderSmsEnabled: form.reminderSmsEnabled,
      });
      Alert.alert("Saved", initial ? "Appointment updated." : "Appointment booked.");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Could not save appointment. Try again.";
      Alert.alert("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.flex, isDark && { backgroundColor: "#000" }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, isDark && { backgroundColor: "#050505", borderBottomColor: "#262626" }]}>
          <Text style={[styles.headerTitle, isDark && { color: "#f8fafc" }]}>
            {initial ? "Edit appointment" : "Book appointment"}
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <X color={isDark ? "#f8fafc" : colors.foreground} size={22} />
          </Pressable>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Provider</Text>
          <Text style={[styles.hint, isDark && { color: "#94a3b8" }]}>
            Select who you are seeing. Directory is maintained for your organization.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerRow}>
            {providers.map((p) => {
              const selected = form.providerId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => selectProvider(p)}
                  style={[
                    styles.providerCard,
                    selected && styles.providerCardActive,
                    isDark && !selected && { backgroundColor: "#0a0a0a", borderColor: "#262626" },
                  ]}
                >
                  <Text style={[styles.providerName, isDark && { color: "#f8fafc" }]} numberOfLines={2}>
                    {p.name}
                  </Text>
                  <Text style={[styles.providerMeta, isDark && { color: "#94a3b8" }]} numberOfLines={1}>
                    {p.specialty}
                  </Text>
                  <Text style={[styles.providerLoc, isDark && { color: "#64748b" }]} numberOfLines={1}>
                    {p.location}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {providers.length === 0 && (
            <Text style={[styles.warn, isDark && { color: "#fbbf24" }]}>
              No providers loaded. Check your connection and Firestore rules for `providers`.
            </Text>
          )}

          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Reason for visit</Text>
          <TextInput
            style={[styles.input, styles.notes, isDark && styles.inputDark]}
            placeholder="e.g. Annual physical, blood pressure follow-up"
            placeholderTextColor={colors.mutedForeground}
            value={form.reason ?? ""}
            onChangeText={(t) => setField("reason", t)}
            multiline
          />

          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Visit type</Text>
          <View style={styles.types}>
            {VISIT_TYPE_OPTIONS.map((vt) => (
              <Pressable
                key={vt}
                onPress={() => setField("visitType", vt)}
                style={[styles.typeChip, form.visitType === vt && styles.typeChipActive, isDark && styles.typeChipDark]}
              >
                <Text style={[styles.typeChipText, form.visitType === vt && styles.typeChipTextActive]}>
                  {visitTypeLabel(vt)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Title (optional)</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={form.title}
            onChangeText={(t) => setField("title", t)}
            placeholder="Defaults from provider + visit type"
            placeholderTextColor={colors.mutedForeground}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Date (YYYY-MM-DD)</Text>
              <TextInput style={[styles.input, isDark && styles.inputDark]} value={form.date} onChangeText={(t) => setField("date", t)} />
            </View>
            <View style={styles.half}>
              <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Time (HH:mm)</Text>
              <TextInput style={[styles.input, isDark && styles.inputDark]} value={form.time} onChangeText={(t) => setField("time", t)} />
            </View>
          </View>

          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Location</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={form.location}
            onChangeText={(t) => setField("location", t)}
            placeholder="Clinic address or Virtual"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Category</Text>
          <View style={styles.types}>
            {CATEGORY_OPTIONS.map((type) => (
              <Pressable
                key={type}
                onPress={() => setField("type", type)}
                style={[styles.typeChip, form.type === type && styles.typeChipActive, isDark && styles.typeChipDark]}
              >
                <Text style={[styles.typeChipText, form.type === type && styles.typeChipTextActive]}>{type}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notes, isDark && styles.inputDark]}
            multiline
            value={form.notes ?? ""}
            onChangeText={(t) => setField("notes", t)}
          />

          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.label, isDark && { color: "#f8fafc", marginBottom: 4 }]}>SMS reminder</Text>
              <Text style={[styles.hint, isDark && { color: "#94a3b8" }]}>
                Sends ~24h before (or soon if sooner). Uses the phone number saved in Settings → Profile.
              </Text>
            </View>
            <Switch
              value={form.reminderSmsEnabled}
              onValueChange={(v) => {
                setField("reminderSmsEnabled", v);
                setField("reminder", v);
              }}
            />
          </View>
        </ScrollView>
        <View style={[styles.footer, isDark && { backgroundColor: "#050505", borderTopColor: "#262626" }]}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose} disabled={saving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.save]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 },
  hint: { fontSize: 12, color: colors.mutedForeground, marginBottom: 10, lineHeight: 18 },
  warn: { fontSize: 13, color: colors.warning, marginBottom: 12 },
  providerRow: { marginBottom: 16, maxHeight: 120 },
  providerCard: {
    width: 160,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: 10,
  },
  providerCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "12",
  },
  providerName: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  providerMeta: { fontSize: 12, marginBottom: 2 },
  providerLoc: { fontSize: 11 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    backgroundColor: colors.card,
    color: colors.foreground,
  },
  inputDark: { backgroundColor: "#0a0a0a", borderColor: "#262626", color: "#f8fafc" },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  notes: { minHeight: 72, textAlignVertical: "top" },
  types: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  typeChip: { backgroundColor: colors.muted, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8 },
  typeChipDark: { backgroundColor: "#111111" },
  typeChipActive: { backgroundColor: colors.primary + "25" },
  typeChipText: { color: colors.mutedForeground, fontSize: 12, fontWeight: "600" },
  typeChipTextActive: { color: colors.primary },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  btn: { flex: 1, alignItems: "center", borderRadius: 12, paddingVertical: 12 },
  cancel: { borderWidth: 1, borderColor: colors.border },
  save: { backgroundColor: colors.primary },
  cancelText: { color: colors.foreground, fontWeight: "600" },
  saveText: { color: "#fff", fontWeight: "600" },
});
