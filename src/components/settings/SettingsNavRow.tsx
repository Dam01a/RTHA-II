import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

type SettingsNavRowProps = {
  label: string;
  description: string;
  largeText?: boolean;
  highContrast?: boolean;
  comingSoon?: boolean;
  onPress?: () => void;
};

export function SettingsNavRow({
  label,
  description,
  largeText = false,
  highContrast = false,
  comingSoon = true,
  onPress,
}: SettingsNavRowProps) {
  const { isDark } = useTheme();
  const fs = (base: number) => (largeText ? Math.round(base * 1.12) : base);
  const borderColor = highContrast ? colors.foreground : colors.border;
  const rowBorderWidth = highContrast ? 2 : isDark ? 0 : 1;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (comingSoon) {
      Alert.alert("Coming soon", "This option is not available yet.");
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          borderColor,
          borderWidth: rowBorderWidth,
          opacity: pressed ? 0.85 : 1,
          backgroundColor: isDark ? "#111111" : colors.muted,
        },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.textCol}>
        <Text style={[styles.label, { fontSize: fs(16) }, isDark && { color: "#f8fafc" }]}>{label}</Text>
        <Text style={[styles.desc, { fontSize: fs(14) }, isDark && { color: "#a3a3a3" }]}>{description}</Text>
        {comingSoon ? (
          <Text style={[styles.badge, { fontSize: fs(12) }]}>Coming soon</Text>
        ) : null}
      </View>
      <ChevronRight color={colors.mutedForeground} size={20} />
    </Pressable>
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
  badge: { color: colors.primary, fontWeight: "600", marginTop: 4 },
});
