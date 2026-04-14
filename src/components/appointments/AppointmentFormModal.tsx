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
import type { Appointment } from "@/src/types/health";
import type { AppointmentInput } from "@/src/lib/appointments";

const TYPE_OPTIONS: Appointment["type"][] = ["checkup", "specialist", "lab", "therapy", "other"];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  visible: boolean;
  initial: Appointment | null;
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
    doctorName: "",
    type: "checkup",
    notes: "",
    reminder: true,
  };
}

function fromInitial(initial: Appointment): FormState {
  return {
    title: initial.title,
    date: initial.date,
    time: initial.time,
    location: initial.location,
    doctorName: initial.doctorName ?? "",
    type: initial.type,
    notes: initial.notes ?? "",
    reminder: initial.reminder,
  };
}

export function AppointmentFormModal({ visible, initial, onClose, onSave }: Props) {
  const { isDark } = useTheme();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setForm(initial ? fromInitial(initial) : emptyForm());
  }, [visible, initial]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert("Missing title", "Please enter an appointment title.");
      return;
    }
    if (!form.date.trim() || !form.time.trim()) {
      Alert.alert("Missing date/time", "Please enter both date and time.");
      return;
    }
    if (!form.location.trim()) {
      Alert.alert("Missing location", "Please enter a location.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        date: form.date.trim(),
        time: form.time.trim(),
        location: form.location.trim(),
        doctorName: form.doctorName?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      onClose();
    } catch {
      Alert.alert("Save failed", "Could not save appointment. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[styles.flex, isDark && { backgroundColor: "#000" }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.header, isDark && { backgroundColor: "#050505", borderBottomColor: "#262626" }]}>
          <Text style={[styles.headerTitle, isDark && { color: "#f8fafc" }]}>{initial ? "Edit appointment" : "New appointment"}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <X color={isDark ? "#f8fafc" : colors.foreground} size={22} />
          </Pressable>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Title</Text>
          <TextInput style={[styles.input, isDark && styles.inputDark]} value={form.title} onChangeText={(t) => setField("title", t)} />

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
          <TextInput style={[styles.input, isDark && styles.inputDark]} value={form.location} onChangeText={(t) => setField("location", t)} />

          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Doctor (optional)</Text>
          <TextInput style={[styles.input, isDark && styles.inputDark]} value={form.doctorName ?? ""} onChangeText={(t) => setField("doctorName", t)} />

          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Type</Text>
          <View style={styles.types}>
            {TYPE_OPTIONS.map((type) => (
              <Pressable
                key={type}
                onPress={() => setField("type", type)}
                style={[styles.typeChip, form.type === type && styles.typeChipActive, isDark && form.type !== type && styles.typeChipDark]}
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
            <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Reminder</Text>
            <Switch value={form.reminder} onValueChange={(v) => setField("reminder", v)} />
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
  notes: { minHeight: 90, textAlignVertical: "top" },
  types: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  typeChip: { backgroundColor: colors.muted, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8 },
  typeChipDark: { backgroundColor: "#111111" },
  typeChipActive: { backgroundColor: colors.primary + "25" },
  typeChipText: { color: colors.mutedForeground, fontSize: 12, fontWeight: "600" },
  typeChipTextActive: { color: colors.primary },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
