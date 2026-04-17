import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X, Plus, Trash2 } from "lucide-react-native";
import type { Medication } from "../../types/health";
import type { MedicationInput } from "../../lib/medications";
import { colors } from "../../theme/colors";

const FREQUENCY_PRESETS = ["Once daily", "Twice daily", "Three times daily", "As needed", "Weekly"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): MedicationInput {
  return {
    name: "",
    dosage: "",
    frequency: "Once daily",
    times: ["08:00"],
    startDate: todayISO(),
    refillReminder: true,
    pillsRemaining: undefined,
    totalPills: undefined,
    notes: "",
    taken: false,
  };
}

function medicationToInput(m: Medication): MedicationInput {
  return {
    name: m.name,
    dosage: m.dosage,
    frequency: m.frequency,
    times: m.times.length ? [...m.times] : ["08:00"],
    startDate: m.startDate || todayISO(),
    endDate: m.endDate,
    refillReminder: m.refillReminder,
    pillsRemaining: m.pillsRemaining,
    totalPills: m.totalPills,
    notes: m.notes ?? "",
    taken: m.taken ?? false,
  };
}

type Props = {
  visible: boolean;
  onClose: () => void;
  /** null = create new */
  initial: Medication | null;
  onSave: (input: MedicationInput) => Promise<void>;
  title?: string;
};

export function MedicationFormModal({ visible, onClose, initial, onSave, title }: Props) {
  const [form, setForm] = useState<MedicationInput>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(initial ? medicationToInput(initial) : emptyForm());
    }
  }, [visible, initial]);

  const setField = <K extends keyof MedicationInput>(key: K, value: MedicationInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setTimeAt = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.times];
      next[index] = value;
      return { ...prev, times: next };
    });
  };

  const addTimeRow = () => {
    setForm((prev) => ({ ...prev, times: [...prev.times, "12:00"] }));
  };

  const removeTimeRow = (index: number) => {
    setForm((prev) => {
      if (prev.times.length <= 1) {
        return prev;
      }
      return { ...prev, times: prev.times.filter((_, i) => i !== index) };
    });
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      Alert.alert("Missing name", "Please enter a medication name.");
      return;
    }
    const dosage = form.dosage.trim();
    if (!dosage) {
      Alert.alert("Missing dosage", "Please enter a dosage (e.g. 500mg).");
      return;
    }
    const times = form.times.map((t) => t.trim()).filter(Boolean);
    if (times.length === 0) {
      Alert.alert("Schedule", "Add at least one time (e.g. 08:00).");
      return;
    }

    const payload: MedicationInput = {
      ...form,
      name,
      dosage,
      frequency: form.frequency.trim() || "Once daily",
      times,
      startDate: form.startDate.trim() || todayISO(),
      notes: form.notes?.trim() || undefined,
      pillsRemaining:
        form.pillsRemaining != null && form.pillsRemaining !== ("" as unknown as number)
          ? Number(form.pillsRemaining)
          : undefined,
      totalPills:
        form.totalPills != null && form.totalPills !== ("" as unknown as number)
          ? Number(form.totalPills)
          : undefined,
    };

    if (
      payload.pillsRemaining != null &&
      Number.isNaN(payload.pillsRemaining)
    ) {
      Alert.alert("Invalid number", "Pills remaining must be a number.");
      return;
    }
    if (payload.totalPills != null && Number.isNaN(payload.totalPills)) {
      Alert.alert("Invalid number", "Total pills must be a number.");
      return;
    }

    setSaving(true);
    try {
      await onSave(payload);
      Alert.alert("Saved", initial ? "Medication updated successfully." : "Medication saved successfully.");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Could not save medication. Try again.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const headerTitle = title ?? (initial ? "Edit medication" : "Add medication");

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <X color={colors.foreground} size={24} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(t) => setField("name", t)}
            placeholder="e.g. Metformin"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={styles.label}>Dosage</Text>
          <TextInput
            style={styles.input}
            value={form.dosage}
            onChangeText={(t) => setField("dosage", t)}
            placeholder="e.g. 500mg"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={styles.label}>Frequency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {FREQUENCY_PRESETS.map((p) => (
              <Pressable
                key={p}
                onPress={() => setField("frequency", p)}
                style={[styles.chip, form.frequency === p && styles.chipActive]}
              >
                <Text style={[styles.chipText, form.frequency === p && styles.chipTextActive]}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <TextInput
            style={styles.input}
            value={form.frequency}
            onChangeText={(t) => setField("frequency", t)}
            placeholder="Or type custom frequency"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={styles.label}>Times (24h HH:mm)</Text>
          {form.times.map((time, index) => (
            <View key={index} style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={time}
                onChangeText={(t) => setTimeAt(index, t)}
                placeholder="08:00"
                placeholderTextColor={colors.mutedForeground}
              />
              <Pressable
                style={styles.iconBtn}
                onPress={() => removeTimeRow(index)}
                disabled={form.times.length <= 1}
              >
                <Trash2
                  color={form.times.length <= 1 ? colors.mutedForeground : colors.destructive}
                  size={20}
                />
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addTimeBtn} onPress={addTimeRow}>
            <Plus color={colors.primary} size={18} />
            <Text style={styles.addTimeText}>Add time</Text>
          </Pressable>

          <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={form.startDate}
            onChangeText={(t) => setField("startDate", t)}
            placeholder={todayISO()}
            placeholderTextColor={colors.mutedForeground}
          />

          <View style={styles.rowBetween}>
            <View style={styles.flex1}>
              <Text style={styles.label}>Refill reminders</Text>
              <Text style={styles.hint}>Notify when supply is low</Text>
            </View>
            <Switch
              value={form.refillReminder}
              onValueChange={(v) => setField("refillReminder", v)}
              trackColor={{ false: colors.muted, true: colors.primary + "60" }}
              thumbColor={form.refillReminder ? colors.primary : colors.mutedForeground}
            />
          </View>

          <View style={styles.rowGap}>
            <View style={styles.half}>
              <Text style={styles.label}>Pills remaining</Text>
              <TextInput
                style={styles.input}
                value={form.pillsRemaining != null ? String(form.pillsRemaining) : ""}
                onChangeText={(t) => {
                  if (t.trim() === "") {
                    setField("pillsRemaining", undefined);
                  } else {
                    const n = parseInt(t, 10);
                    setField("pillsRemaining", Number.isNaN(n) ? undefined : n);
                  }
                }}
                keyboardType="number-pad"
                placeholder="Optional"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Total pills</Text>
              <TextInput
                style={styles.input}
                value={form.totalPills != null ? String(form.totalPills) : ""}
                onChangeText={(t) => {
                  if (t.trim() === "") {
                    setField("totalPills", undefined);
                  } else {
                    const n = parseInt(t, 10);
                    setField("totalPills", Number.isNaN(n) ? undefined : n);
                  }
                }}
                keyboardType="number-pad"
                placeholder="Optional"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={form.notes ?? ""}
            onChangeText={(t) => setField("notes", t)}
            placeholder="Optional instructions"
            placeholderTextColor={colors.mutedForeground}
            multiline
          />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.cancelBtn} onPress={onClose} disabled={saving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? "Saving…" : "Save"}</Text>
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
  scrollContent: { padding: 16, paddingBottom: 32 },
  label: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 },
  hint: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.foreground,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  timeInput: { flex: 1, marginBottom: 0 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  iconBtn: { padding: 10 },
  chipsRow: { marginBottom: 8, maxHeight: 44 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.muted,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary + "25" },
  chipText: { fontSize: 13, color: colors.mutedForeground, fontWeight: "500" },
  chipTextActive: { color: colors.primary, fontWeight: "600" },
  addTimeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  addTimeText: { fontSize: 15, fontWeight: "600", color: colors.primary },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  flex1: { flex: 1 },
  rowGap: { flexDirection: "row", gap: 12, marginBottom: 8 },
  half: { flex: 1 },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  saveText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
