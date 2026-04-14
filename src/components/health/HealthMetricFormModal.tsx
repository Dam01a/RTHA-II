import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { colors } from "@/src/theme/colors";
import { useTheme } from "@/src/context/ThemeContext";
import type { HealthMetric, HealthMetricInput } from "@/src/types/health";

const METRIC_TYPES: HealthMetric["type"][] = [
  "blood_pressure",
  "heart_rate",
  "blood_sugar",
  "weight",
  "temperature",
];

const METRIC_LABELS: Record<HealthMetric["type"], string> = {
  blood_pressure: "Blood Pressure",
  heart_rate: "Heart Rate",
  blood_sugar: "Blood Sugar",
  weight: "Weight",
  temperature: "Temperature",
};

const METRIC_UNITS: Record<HealthMetric["type"], string> = {
  blood_pressure: "mmHg",
  heart_rate: "bpm",
  blood_sugar: "mg/dL",
  weight: "lbs",
  temperature: "degF",
};

type FormState = {
  type: HealthMetric["type"];
  date: string;
  time: string;
  value: string;
  systolic: string;
  diastolic: string;
  notes: string;
};

function nowParts() {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
  };
}

function emptyForm(type: HealthMetric["type"] = "blood_pressure"): FormState {
  const { date, time } = nowParts();
  return { type, date, time, value: "", systolic: "", diastolic: "", notes: "" };
}

function toForm(initial: HealthMetric): FormState {
  const date = initial.recordedAt.slice(0, 10);
  const time = initial.recordedAt.slice(11, 16);
  return {
    type: initial.type,
    date,
    time,
    value: initial.value != null ? String(initial.value) : "",
    systolic: initial.systolic != null ? String(initial.systolic) : "",
    diastolic: initial.diastolic != null ? String(initial.diastolic) : "",
    notes: initial.notes ?? "",
  };
}

type Props = {
  visible: boolean;
  initial: HealthMetric | null;
  selectedType?: HealthMetric["type"];
  onClose: () => void;
  onSave: (input: HealthMetricInput) => Promise<void>;
};

export function HealthMetricFormModal({ visible, initial, selectedType, onClose, onSave }: Props) {
  const { isDark } = useTheme();
  const [form, setForm] = useState<FormState>(emptyForm(selectedType));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setForm(initial ? toForm(initial) : emptyForm(selectedType ?? "blood_pressure"));
  }, [visible, initial, selectedType]);

  const title = initial ? "Edit Reading" : "Log Reading";
  const isBloodPressure = form.type === "blood_pressure";

  const containerStyle = useMemo(
    () => [styles.flex, isDark && { backgroundColor: "#000" }],
    [isDark]
  );

  const inputStyle = useMemo(
    () => [styles.input, isDark && { backgroundColor: "#0a0a0a", borderColor: "#262626", color: "#f8fafc" }],
    [isDark]
  );

  const buildPayload = (): HealthMetricInput | null => {
    if (!form.date || !form.time) {
      Alert.alert("Missing date/time", "Please provide both date and time.");
      return null;
    }
    const recordedAt = new Date(`${form.date}T${form.time}:00`).toISOString();
    if (isBloodPressure) {
      const systolic = Number(form.systolic);
      const diastolic = Number(form.diastolic);
      if (Number.isNaN(systolic) || Number.isNaN(diastolic)) {
        Alert.alert("Invalid blood pressure", "Systolic and diastolic must be numeric.");
        return null;
      }
      return {
        type: form.type,
        recordedAt,
        systolic,
        diastolic,
        unit: METRIC_UNITS.blood_pressure,
        notes: form.notes.trim() || undefined,
      };
    }

    const value = Number(form.value);
    if (Number.isNaN(value)) {
      Alert.alert("Invalid value", "Please enter a numeric value.");
      return null;
    }
    return {
      type: form.type,
      recordedAt,
      value,
      unit: METRIC_UNITS[form.type],
      notes: form.notes.trim() || undefined,
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch {
      Alert.alert("Save failed", "Could not save health reading. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={containerStyle} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.header, isDark && { backgroundColor: "#050505", borderBottomColor: "#262626" }]}>
          <Text style={[styles.headerTitle, isDark && { color: "#f8fafc" }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <X color={isDark ? "#f8fafc" : colors.foreground} size={24} />
          </Pressable>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Metric Type</Text>
          <View style={styles.chipsRow}>
            {METRIC_TYPES.map((type) => {
              const selected = form.type === type;
              return (
                <Pressable
                  key={type}
                  style={[
                    styles.chip,
                    selected && styles.chipActive,
                    isDark && !selected && { backgroundColor: "#111111" },
                  ]}
                  onPress={() => setForm((prev) => ({ ...prev, type }))}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>{METRIC_LABELS[type]}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Date (YYYY-MM-DD)</Text>
              <TextInput style={inputStyle} value={form.date} onChangeText={(date) => setForm((p) => ({ ...p, date }))} />
            </View>
            <View style={styles.half}>
              <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Time (HH:mm)</Text>
              <TextInput style={inputStyle} value={form.time} onChangeText={(time) => setForm((p) => ({ ...p, time }))} />
            </View>
          </View>

          {isBloodPressure ? (
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Systolic</Text>
                <TextInput style={inputStyle} keyboardType="numeric" value={form.systolic} onChangeText={(systolic) => setForm((p) => ({ ...p, systolic }))} />
              </View>
              <View style={styles.half}>
                <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Diastolic</Text>
                <TextInput style={inputStyle} keyboardType="numeric" value={form.diastolic} onChangeText={(diastolic) => setForm((p) => ({ ...p, diastolic }))} />
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Value ({METRIC_UNITS[form.type]})</Text>
              <TextInput style={inputStyle} keyboardType="numeric" value={form.value} onChangeText={(value) => setForm((p) => ({ ...p, value }))} />
            </>
          )}

          <Text style={[styles.label, isDark && { color: "#f8fafc" }]}>Notes</Text>
          <TextInput
            style={[inputStyle, styles.notes]}
            multiline
            value={form.notes}
            onChangeText={(notes) => setForm((p) => ({ ...p, notes }))}
          />
        </ScrollView>
        <View style={[styles.footer, isDark && { backgroundColor: "#050505", borderTopColor: "#262626" }]}>
          <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onClose} disabled={saving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.saveBtn]} onPress={handleSave} disabled={saving}>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    color: colors.foreground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  notes: { minHeight: 84, textAlignVertical: "top" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.muted },
  chipActive: { backgroundColor: colors.primary + "20" },
  chipText: { color: colors.mutedForeground, fontSize: 13, fontWeight: "500" },
  chipTextActive: { color: colors.primary, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  btn: { flex: 1, alignItems: "center", borderRadius: 12, paddingVertical: 12 },
  cancelBtn: { borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.foreground, fontWeight: "600" },
  saveBtn: { backgroundColor: colors.primary },
  saveText: { color: "#fff", fontWeight: "600" },
});
