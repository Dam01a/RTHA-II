import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { AlertTriangle, Phone, X, MapPin } from "lucide-react-native";
import { mockEmergencyContacts } from "@/src/data/mockData";
import { colors } from "@/src/theme/colors";

const COUNTDOWN_DURATION = 5;

export default function EmergencyButton() {
  const [isActivated, setIsActivated] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  const cancelEmergency = useCallback(() => {
    setIsActivated(false);
    setCountdown(COUNTDOWN_DURATION);
    setIsEmergencyMode(false);
  }, []);

  const triggerEmergency = useCallback(() => {
    setIsEmergencyMode(true);
    // In a real app, this would trigger GPS sharing and contact notifications
    console.log("Emergency triggered! Contacting:", mockEmergencyContacts);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isActivated && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (isActivated && countdown === 0) {
      triggerEmergency();
    }
    return () => clearInterval(timer);
  }, [isActivated, countdown, triggerEmergency]);

  return (
    <>
      <Pressable
        onPress={() => !isActivated && setIsActivated(true)}
        style={[styles.button, isActivated ? styles.buttonActive : styles.buttonInactive]}
      >
        <View style={[styles.iconBox, isActivated ? styles.iconBoxActive : styles.iconBoxInactive]}>
          <AlertTriangle color={isActivated ? "#fff" : colors.destructive} size={24} />
        </View>
        <View>
          <Text style={[styles.title, isActivated && styles.textWhite]}>Emergency</Text>
          <Text style={[styles.subtitle, isActivated && styles.textWhite80]}>One-tap assistance</Text>
        </View>
      </Pressable>

      <Modal visible={isActivated} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!isEmergencyMode ? (
              <View style={styles.countdownContent}>
                <View style={styles.circleContainer}>
                  <View style={[styles.circleBg, styles.circle]}>
                    <Text style={styles.countdownText}>{countdown}</Text>
                  </View>
                </View>
                <Text style={styles.modalTitle}>Emergency Alert</Text>
                <Text style={styles.modalSubtitle}>
                  Your emergency contacts will be notified in {countdown} seconds
                </Text>
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
                  Your emergency contacts have been notified
                </Text>
                <View style={styles.locationBox}>
                  <MapPin color="#fff" size={16} />
                  <Text style={styles.locationText}>Sharing your location...</Text>
                </View>
                <View style={styles.contactsList}>
                  <Text style={styles.contactsLabel}>Contacted:</Text>
                  {mockEmergencyContacts.slice(0, 2).map((contact) => (
                    <View key={contact.id} style={styles.contactItem}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactRelation}>{contact.relationship}</Text>
                    </View>
                  ))}
                </View>
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
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
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
  safeButtonText: { fontSize: 16, fontWeight: "600", color: colors.destructive },
});
