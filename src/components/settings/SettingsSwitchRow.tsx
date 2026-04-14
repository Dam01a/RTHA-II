import { View, Text, StyleSheet, Switch } from "react-native";
import { colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

type SettingsSwitchRowProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  largeText?: boolean;
  highContrast?: boolean;
};

export function SettingsSwitchRow({
  label,
  description,
  value,
  onValueChange,
  largeText = false,
  highContrast = false,
}: SettingsSwitchRowProps) {
  const { isDark } = useTheme();
  const fs = (base: number) => (largeText ? Math.round(base * 1.12) : base);
  const borderColor = highContrast ? colors.foreground : colors.border;
  const rowBorderWidth = highContrast ? 2 : isDark ? 0 : 1;

  return (
    <View style={[styles.row, { borderColor, borderWidth: rowBorderWidth, backgroundColor: isDark ? "#111111" : colors.muted }]}>
      <View style={styles.textCol}>
        <Text style={[styles.label, { fontSize: fs(16) }, isDark && { color: "#f8fafc" }]}>{label}</Text>
        <Text style={[styles.desc, { fontSize: fs(14) }, isDark && { color: "#a3a3a3" }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.muted, true: colors.primary + "60" }}
        thumbColor={value ? colors.primary : colors.mutedForeground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.muted,
    marginBottom: 10,
  },
  textCol: { flex: 1, paddingRight: 12 },
  label: { fontWeight: "500", color: colors.foreground },
  desc: { color: colors.mutedForeground, marginTop: 2 },
});
