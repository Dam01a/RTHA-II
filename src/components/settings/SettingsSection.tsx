import type { ReactNode } from "react";
import { StyleSheet, View, Text } from "react-native";
import { colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

type SettingsSectionProps = {
  children: ReactNode;
  /** When true, use stronger borders (high-contrast mode on Settings screen). */
  highContrast?: boolean;
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  /** e.g. Sync button */
  headerRight?: ReactNode;
  /** Use row layout with icon + title (default) vs title-only */
  variant?: "default" | "headerRow";
};

export function SettingsSection({
  children,
  highContrast = false,
  icon,
  title,
  subtitle,
  headerRight,
  variant = "default",
}: SettingsSectionProps) {
  const { isDark } = useTheme();
  const borderColor = highContrast ? colors.foreground : colors.border;
  const cardBg = highContrast ? "#ffffff" : isDark ? "#050505" : colors.card;

  const showHeader = Boolean(title && (icon || subtitle || headerRight));

  return (
    <View style={[styles.section, { backgroundColor: cardBg, borderWidth: highContrast ? 2 : 0, borderColor }]}>
      {showHeader &&
        (variant === "headerRow" ? (
          <View style={styles.sectionHeaderRow}>
            {icon}
            <View style={styles.headerTextWrap}>
              <Text style={[styles.sectionTitle, isDark && { color: "#f8fafc" }]}>{title}</Text>
              {subtitle ? <Text style={[styles.sectionSubtitle, isDark && { color: "#a3a3a3" }]}>{subtitle}</Text> : null}
            </View>
            {headerRight}
          </View>
        ) : (
          <View style={styles.sectionHeader}>
            {icon}
            <View style={styles.headerTextWrap}>
              <Text style={[styles.sectionTitle, isDark && { color: "#f8fafc" }]}>{title}</Text>
              {subtitle ? <Text style={[styles.sectionSubtitle, isDark && { color: "#a3a3a3" }]}>{subtitle}</Text> : null}
            </View>
            {headerRight}
          </View>
        ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  headerTextWrap: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  sectionSubtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
});
