import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Linking } from "react-native";
import { AlertTriangle, Phone, X, MapPin } from "lucide-react-native";
import { colors } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";
import { triggerEmergencyAlert } from "@/src/lib/emergencyService";
import type { EmergencyDispatchResult } from "@/src/types/emergency";

const COUNTDOWN_DURATION = 5;
const MIN_TRIGGER_INTERVAL_MS = 30_000;

export default function EmergencyButton() {
  const { user } = useAuth();
  const [isActivated, setIsActivated] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [isDispatching, setIsDispatching] = useState(false);
  const [result, setResult] = useState<EmergencyDispatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTriggeredAt, setLastTriggeredAt] = useState<number>(0);

  const cancelEmergency = useCallback(() => {
    setIsActivated(false);
    setCountdown(COUNTDOWN_DURATION);
    setIsDispatching(false);
    setResult(null);
    setError(null);
  }, []);

  const triggerEmergency = useCallback(() => {
    if (!user) {
      setError("You must be signed in.");
      return;
    }
    if (isDispatching || result) {
      return;
    }

    if (Date.now() - lastTriggeredAt < MIN_TRIGGER_INTERVAL_MS) {
      setError("Emergency alert was recently sent. Please wait before retrying.");
      return;
    }

    setIsDispatching(true);
    setError(null);
    setLastTriggeredAt(Date.now());

    triggerEmergencyAlert({
      uid: user.uid,
      email: user.email ?? null,
    })
      .then((dispatchResult) => setResult(dispatchResult))
      .catch(() => setError("Unable to deliver emergency alert right now."))
      .finally(() => setIsDispatching(false));
  }, [isDispatching, lastTriggeredAt, result, user]);

  const callEmergencyServices = useCallback(async () => {
    const url = "tel:911";
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      setError("Dialer unavailable on this device.");
      return;
    }
    await Linking.openURL(url);
  }, []);

  useEffect(() => {
    if (!isActivated || isDispatching || result) {
      return;
    }

    const timer: ReturnType<typeof setInterval> = setInterval(() => {
      setCountdown((prev) => {
        if (!Number.isFinite(prev) || prev <= 1) {
          setTimeout(() => {
            triggerEmergency();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActivated, isDispatching, result, countdown, triggerEmergency]);

  return (
    <>
      <View style={styles.quickActions}>
        <Pressable
          onPress={() => !isActivated && setIsActivated(true)}
          style={[styles.button, isActivated ? styles.buttonActive : styles.buttonInactive]}
        >
          <View style={[styles.iconBox, isActivated ? styles.iconBoxActive : styles.iconBoxInactive]}>
            <AlertTriangle color={isActivated ? "#fff" : colors.destructive} size={24} />
          </View>
          <View>
            <Text style={[styles.title, isActivated && styles.textWhite]}>Emergency</Text>
            <Text style={[styles.subtitle, isActivated && styles.textWhite80]}>Tap once to start SOS countdown</Text>
          </View>
        </Pressable>
        <Pressable style={styles.inlineCallButton} onPress={callEmergencyServices}>
          <Phone color="#fff" size={18} />
          <Text style={styles.inlineCallButtonText}>Call 911 now</Text>
        </Pressable>
      </View>

      <Modal visible={isActivated} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!result ? (
              <View style={styles.countdownContent}>
                <View style={styles.circleContainer}>
                  <View style={[styles.circleBg, styles.circle]}>
                    <Text style={styles.countdownText}>{isDispatching ? "..." : countdown}</Text>
                  </View>
                </View>
                <Text style={styles.modalTitle}>Emergency Alert</Text>
                <Text style={styles.modalSubtitle}>
                  {isDispatching
                    ? "Sending emergency alert..."
                    : `Your emergency contacts will be notified in ${countdown} seconds`}
                </Text>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <Pressable onPress={cancelEmergency} style={styles.cancelButton}>
                  <X color={colors.foreground} size={20} />
                  <Text style={styles.cancelText}>Cancel Emergency</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emergencyActive}>
                <View style={styles.phoneIcon}>
                  <Phone color="#fff" size={40} />
                </View>
                <Text style={styles.helpTitle}>Help is on the way!</Text>
                <Text style={styles.helpSubtitle}>
                  Alert status: {result.status.replace("_", " ")}
                </Text>
                <View style={styles.locationBox}>
                  <MapPin color="#fff" size={16} />
                  <Text style={styles.locationText}>{result.locationSummary}</Text>
                </View>
                <View style={styles.contactsList}>
                  <Text style={styles.contactsLabel}>Contacted:</Text>
                  {result.contactedPhones.length > 0 ? (
                    result.contactedPhones.map((phone) => (
                      <View key={phone} style={styles.contactItem}>
                        <Text style={styles.contactName}>{phone}</Text>
                        <Text style={styles.contactRelation}>SMS sent</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.contactItem}>
                      <Text style={styles.contactName}>No contacts confirmed</Text>
                      <Text style={styles.contactRelation}>Check provider logs</Text>
                    </View>
                  )}
                </View>
                <Pressable onPress={callEmergencyServices} style={styles.callButton}>
                  <Phone color="#fff" size={18} />
                  <Text style={styles.callButtonText}>Call 911</Text>
                </Pressable>
                <Pressable onPress={cancelEmergency} style={styles.safeButton}>
                  <Text style={styles.safeButtonText}>I'm Safe - Cancel Alert</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  quickActions: {
    gap: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonActive: {
    backgroundColor: colors.destructive,
  },
  buttonInactive: {
    backgroundColor: colors.destructive + "20",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBoxActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  iconBoxInactive: { backgroundColor: colors.destructive + "20" },
  title: { fontSize: 16, fontWeight: "600", color: colors.destructive },
  subtitle: { fontSize: 12, color: colors.destructive + "b3", marginTop: 2 },
  inlineCallButton: {
    backgroundColor: colors.destructive,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  inlineCallButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  textWhite: { color: "#fff" },
  textWhite80: { color: "rgba(255,255,255,0.8)" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  countdownContent: { padding: 32, alignItems: "center" },
  circleContainer: { marginBottom: 24 },
  circle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  circleBg: { backgroundColor: colors.muted },
  countdownText: { fontSize: 48, fontWeight: "700", color: colors.destructive },
  modalTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 8 },
  modalSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: "center",
    marginBottom: 24,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.mutedForeground + "50",
  },
  cancelText: { fontSize: 16, fontWeight: "500", color: colors.foreground },
  errorText: { color: colors.destructive, marginBottom: 10, textAlign: "center" },
  emergencyActive: {
    padding: 32,
    backgroundColor: colors.destructive,
    alignItems: "center",
  },
  phoneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  helpTitle: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 8 },
  helpSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 24 },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  locationText: { fontSize: 14, color: "#fff" },
  contactsList: { width: "100%", marginBottom: 24 },
  contactsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  contactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactName: { fontSize: 16, fontWeight: "500", color: "#fff" },
  contactRelation: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  safeButton: {
    width: "100%",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
  },
  callButton: {
    width: "100%",
    padding: 14,
    borderColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  callButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  safeButtonText: { fontSize: 16, fontWeight: "600", color: colors.destructive },
});
