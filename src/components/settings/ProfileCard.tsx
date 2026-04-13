import { View, Text, StyleSheet, Pressable } from "react-native";
import { LogOut } from "lucide-react-native";
import { colors } from "../../theme/colors";

type ProfileCardProps = {
  email: string;
  initials: string;
  onSignOut: () => void;
  largeText?: boolean;
  highContrast?: boolean;
};

export function ProfileCard({ email, initials, onSignOut, largeText = false, highContrast = false }: ProfileCardProps) {
  const fs = (base: number) => (largeText ? Math.round(base * 1.12) : base);
  const borderColor = highContrast ? colors.foreground : colors.border;

  return (
    <View style={styles.profileRow}>
      <View style={[styles.avatar, highContrast && styles.avatarHighContrast]}>
        <Text style={[styles.avatarText, { fontSize: fs(24) }]}>{initials}</Text>
      </View>
      <View style={styles.profileInfo}>
        <Text style={[styles.profileName, { fontSize: fs(18) }]} numberOfLines={1}>
          {email}
        </Text>
        <Text style={[styles.profileEmail, { fontSize: fs(14) }]}>Signed in with Firebase</Text>
      </View>
      <Pressable
        style={[styles.signOutButton, { borderColor }]}
        onPress={onSignOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <LogOut color={colors.destructive} size={18} />
        <Text style={[styles.signOutText, { fontSize: fs(14) }]}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  profileRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarHighContrast: {
    borderWidth: 2,
    borderColor: colors.foreground,
  },
  avatarText: { fontWeight: "700", color: "#fff" },
  profileInfo: { flex: 1 },
  profileName: { fontWeight: "600", color: colors.foreground },
  profileEmail: { color: colors.mutedForeground, marginTop: 4 },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  signOutText: { fontWeight: "600", color: colors.destructive },
});
