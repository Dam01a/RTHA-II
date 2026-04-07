import { useState } from "react";
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/theme/colors";

export default function ConfirmEmailScreen() {
  const { user, logout, sendVerificationEmail, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onResend = async () => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      await sendVerificationEmail();
      setMessage("Verification email sent. Check your inbox.");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError("Could not send verification email.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onIHaveVerified = async () => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      await refreshUser();
      setMessage("Account status refreshed.");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError("Could not refresh account status.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Confirm Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a verification email to:
        </Text>
        <Text style={styles.email}>{user?.email ?? "your account email"}</Text>
        <Text style={styles.subtitle}>
          Verify it, then tap "I have verified" to continue to the dashboard.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={onIHaveVerified} disabled={isSubmitting}>
          <Text style={styles.primaryButtonText}>{isSubmitting ? "Please wait..." : "I have verified"}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onResend} disabled={isSubmitting}>
          <Text style={styles.secondaryButtonText}>Resend verification email</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={logout} disabled={isSubmitting}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.mutedForeground,
    marginBottom: 8,
  },
  email: {
    color: colors.foreground,
    fontWeight: "600",
    marginBottom: 16,
  },
  errorText: {
    color: colors.destructive,
    marginBottom: 10,
  },
  successText: {
    color: colors.success,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    alignItems: "center",
    marginTop: 14,
  },
  secondaryButtonText: {
    color: colors.secondaryForeground,
    fontWeight: "500",
  },
});
