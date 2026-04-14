import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
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
import {
  Bell,
  Camera,
  Check,
  ChevronRight,
  Eye,
  Lock,
  MoreHorizontal,
  Moon,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sun,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { colors } from "../../src/theme/colors";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { ensureEmergencyContactsSeeded } from "../../src/lib/emergencyContacts";
import { auth, db } from "../../src/lib/firebase";
import { useEmergencyContactsSubscription } from "../../src/hooks/useEmergencyContactsSubscription";
import type { EmergencyContact } from "../../src/types/health";
import {
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from "../../src/lib/emergencyContacts";
import { useSettingsPreferences } from "../../src/hooks/useSettingsPreferences";

// ─── Types ────────────────────────────────────────────────────────────────────

type TextSize = "small" | "medium" | "large";
type ThemeMode = "system" | "light" | "dark";

// ─── Profile reducer ──────────────────────────────────────────────────────────

type ProfileFields = { firstName: string; lastName: string; phoneNumber: string; address: string };

type ProfileState = ProfileFields & {
  isLoading: boolean;
  isSaving: boolean;
  saveMessage: string | null;
};

type ProfileAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; payload: ProfileFields }
  | { type: "SET_FIELD"; field: keyof ProfileFields; value: string }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR"; message: string }
  | { type: "VALIDATION_ERROR"; message: string };

const initialProfile: ProfileState = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  address: "",
  isLoading: false,
  isSaving: false,
  saveMessage: null,
};

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case "LOAD_START":   return { ...state, isLoading: true, saveMessage: null };
    case "LOAD_SUCCESS": return { ...state, isLoading: false, ...action.payload };
    case "SET_FIELD":    return { ...state, [action.field]: action.value, saveMessage: null };
    case "SAVE_START":   return { ...state, isSaving: true, saveMessage: null };
    case "SAVE_SUCCESS": return { ...state, isSaving: false, saveMessage: "Saved" };
    case "SAVE_ERROR":   return { ...state, isSaving: false, saveMessage: action.message };
    case "VALIDATION_ERROR": return { ...state, saveMessage: action.message };
    default: return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitials(name: string): string {
  return name.split(" ").filter(Boolean).map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "NA";
}

const AVATAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// ─── Primitives ───────────────────────────────────────────────────────────────

function Divider({ isDark }: { isDark: boolean }) {
  return <View style={[s.divider, { backgroundColor: isDark ? "#1c1c1c" : "#f0f0f5" }]} />;
}

function Card({
  children,
  isDark,
  tinted,
}: {
  children: React.ReactNode;
  isDark: boolean;
  tinted?: boolean;
}) {
  const bg = tinted
    ? isDark ? "#080e1a" : "#eef2ff"
    : isDark ? "#0d0d0d" : "#fff";
  return (
    <View style={[s.card, { backgroundColor: bg, shadowColor: isDark ? "transparent" : "#000" }]}>
      {children}
    </View>
  );
}

function RowLabel({ label, isDark }: { label: string; isDark: boolean }) {
  return <Text style={[s.rowLabel, { color: isDark ? "#555" : "#b0b8c8" }]}>{label}</Text>;
}

function SwitchRow({
  label,
  sub,
  value,
  onChange,
  isDark,
  accent,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isDark: boolean;
  accent?: string;
}) {
  return (
    <View style={s.switchRow}>
      <View style={s.switchTexts}>
        <Text style={[s.switchLabel, { color: accent ?? (isDark ? "#ededed" : "#0f172a") }]}>{label}</Text>
        {!!sub && <Text style={[s.switchSub, { color: isDark ? "#555" : "#94a3b8" }]}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: isDark ? "#2a2a2a" : "#e2e8f0", true: colors.primary }}
        thumbColor="#fff"
        ios_backgroundColor={isDark ? "#2a2a2a" : "#e2e8f0"}
      />
    </View>
  );
}

function NavRow({
  iconBg,
  icon,
  label,
  sub,
  onPress,
  isDark,
  danger,
}: {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  onPress: () => void;
  isDark: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.navRow, pressed && s.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[s.navIconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={s.navTexts}>
        <Text style={[s.navLabel, { color: danger ? colors.destructive : isDark ? "#ededed" : "#0f172a" }]}>
          {label}
        </Text>
        {!!sub && <Text style={[s.navSub, { color: isDark ? "#555" : "#94a3b8" }]}>{sub}</Text>}
      </View>
      <ChevronRight size={16} color={isDark ? "#333" : "#cbd5e1"} />
    </Pressable>
  );
}

// ─── Add Contact Modal ────────────────────────────────────────────────────────

function AddContactModal({
  visible,
  onClose,
  initial,
  onSave,
  onDelete,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  initial?: EmergencyContact | null;
  onSave: (name: string, rel: string, phone: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  isDark: boolean;
}) {
  const [name, setName] = useState("");
  const [rel, setRel] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? "");
    setRel(initial?.relationship ?? "");
    setPhone(initial?.phone ?? "");
  }, [visible, initial]);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing Fields", "Name and phone number are required.");
      return;
    }
    try {
      setIsSubmitting(true);
      await onSave(name.trim(), rel.trim(), phone.trim());
      setName(""); setRel(""); setPhone("");
      onClose();
    } catch {
      // Keep modal open so the user can retry/correct inputs.
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardBg = isDark ? "#0d0d0d" : "#fff";
  const inputBg = isDark ? "#1a1a1a" : "#f0f0f5";
  const textClr = isDark ? "#ededed" : "#0f172a";
  const mutedClr = isDark ? "#666" : "#94a3b8";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
          style={s.modalKeyboardWrap}
        >
          <Pressable style={[s.sheet, { backgroundColor: cardBg }]} onPress={(e) => e.stopPropagation()}>
            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { color: textClr }]}>Add Emergency Contact</Text>
            {[
              { label: "Full Name", val: name, set: setName, cap: "words" as const, kb: "default" as const, ph: "e.g. Jane Doe" },
              { label: "Relationship", val: rel, set: setRel, cap: "words" as const, kb: "default" as const, ph: "e.g. Spouse" },
              { label: "Phone Number", val: phone, set: setPhone, cap: "none" as const, kb: "phone-pad" as const, ph: "(555) 000-0000" },
            ].map((f) => (
              <View key={f.label} style={s.modalField}>
                <Text style={[s.modalFieldLabel, { color: mutedClr }]}>{f.label}</Text>
                <TextInput
                  style={[s.modalInput, { backgroundColor: inputBg, color: textClr }]}
                  value={f.val}
                  onChangeText={f.set}
                  placeholder={f.ph}
                  placeholderTextColor={mutedClr}
                  autoCapitalize={f.cap}
                  keyboardType={f.kb}
                  autoCorrect={false}
                />
              </View>
            ))}
            <View style={s.sheetActions}>
              <Pressable
                style={({ pressed }) => [s.sheetCancel, { backgroundColor: inputBg }, pressed && s.pressed, isSubmitting && { opacity: 0.6 }]}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={[s.sheetCancelText, { color: mutedClr }]}>Cancel</Text>
              </Pressable>
              {isEdit && onDelete ? (
                <Pressable
                  style={({ pressed }) => [s.sheetDelete, pressed && s.pressed, isSubmitting && { opacity: 0.6 }]}
                  onPress={async () => {
                    Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            setIsSubmitting(true);
                            await onDelete();
                            onClose();
                          } finally {
                            setIsSubmitting(false);
                          }
                        },
                      },
                    ]);
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.destructive} size="small" />
                  ) : (
                    <Text style={s.sheetDeleteText}>Delete</Text>
                  )}
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [
                  s.sheetConfirm,
                  { backgroundColor: colors.primary },
                  pressed && s.pressed,
                  isSubmitting && { opacity: 0.6 },
                ]}
                onPress={submit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.sheetConfirmText}>{isEdit ? "Save Contact" : "Add Contact"}</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({
  visible,
  onClose,
  profile,
  dispatch,
  onSave,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  profile: ProfileState;
  dispatch: React.Dispatch<ProfileAction>;
  onSave: () => void;
  isDark: boolean;
}) {
  const isBusy = profile.isSaving || profile.isLoading;
  const cardBg = isDark ? "#0d0d0d" : "#fff";
  const inputBg = isDark ? "#1a1a1a" : "#f0f0f5";
  const textClr = isDark ? "#ededed" : "#0f172a";
  const mutedClr = isDark ? "#666" : "#94a3b8";

  const fields: { label: string; field: keyof ProfileFields; ph: string; cap: "words" | "none"; kb: "default" | "phone-pad"; multi?: boolean }[] = [
    { label: "First Name", field: "firstName", ph: "First name", cap: "words", kb: "default" },
    { label: "Last Name", field: "lastName", ph: "Last name", cap: "words", kb: "default" },
    { label: "Phone Number", field: "phoneNumber", ph: "(555) 000-0000", cap: "none", kb: "phone-pad" },
    { label: "Address", field: "address", ph: "Street, City, State", cap: "words", kb: "default", multi: true },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: cardBg, maxHeight: "88%" }]} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { color: textClr }]}>Edit Profile</Text>
            {fields.map((f) => (
              <View key={f.field} style={s.modalField}>
                <Text style={[s.modalFieldLabel, { color: mutedClr }]}>{f.label}</Text>
                <TextInput
                  style={[s.modalInput, { backgroundColor: inputBg, color: textClr }, f.multi && { minHeight: 72, textAlignVertical: "top" }]}
                  value={profile[f.field]}
                  onChangeText={(v) => dispatch({ type: "SET_FIELD", field: f.field, value: v })}
                  placeholder={f.ph}
                  placeholderTextColor={mutedClr}
                  autoCapitalize={f.cap}
                  keyboardType={f.kb}
                  autoCorrect={false}
                  multiline={f.multi}
                />
              </View>
            ))}
            {!!profile.saveMessage && (
              <Text style={[s.saveMsg, { color: profile.saveMessage === "Saved" ? colors.success : colors.destructive }]}>
                {profile.saveMessage}
              </Text>
            )}
            <View style={s.sheetActions}>
              <Pressable style={({ pressed }) => [s.sheetCancel, { backgroundColor: inputBg }, pressed && s.pressed]} onPress={onClose}>
                <Text style={[s.sheetCancelText, { color: mutedClr }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.sheetConfirm, { backgroundColor: colors.primary }, isBusy && { opacity: 0.6 }, pressed && !isBusy && s.pressed]}
                onPress={onSave}
                disabled={isBusy}
              >
                {isBusy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.sheetConfirmText}>Save Changes</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const { preferences, setPreference, isHydrated } = useSettingsPreferences();
  const { contacts } = useEmergencyContactsSubscription(user?.uid);
  const { mode, setMode, isDark } = useTheme();

  const [profile, dispatch] = useReducer(profileReducer, initialProfile);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [textSize, setTextSize] = useState<TextSize>("medium");
  const mountedRef = useRef(true);

  const highContrast = preferences.highContrast;
  const scaleMap: Record<TextSize, number> = { small: 0.9, medium: 1, large: 1.12 };
  const fs = useCallback((n: number) => Math.round(n * scaleMap[textSize]), [textSize]);

  const profileName = useMemo(() => {
    const full = `${profile.firstName.trim()} ${profile.lastName.trim()}`.trim();
    return full || user?.displayName?.trim() || user?.email?.split("@")[0] || "User";
  }, [profile.firstName, profile.lastName, user]);

  const initials = useMemo(() => buildInitials(profileName), [profileName]);
  const contacts_ = user?.uid ? contacts : [];

  // Dark/light tokens
  const bg       = isDark ? "#000000" : "#f2f2f7";
  const textClr  = isDark ? "#ededed" : "#0f172a";
  const mutedClr = isDark ? "#666"    : "#94a3b8";

  // ── Load profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      if (!user) { dispatch({ type: "LOAD_SUCCESS", payload: { firstName: "", lastName: "", phoneNumber: "", address: "" } }); return; }
      dispatch({ type: "LOAD_START" });
      try {
        const authName = user.displayName?.trim() ?? "";
        const [first = "", ...rest] = authName ? authName.split(" ") : [];
        if (!db) { if (mountedRef.current) dispatch({ type: "LOAD_SUCCESS", payload: { firstName: first, lastName: rest.join(" "), phoneNumber: "", address: "" } }); return; }
        const snap = await getDoc(doc(db, "users", user.uid));
        const d = snap.exists() ? snap.data() : null;
        if (!mountedRef.current) return;
        dispatch({ type: "LOAD_SUCCESS", payload: {
          firstName:   typeof d?.firstName   === "string" ? d.firstName   : first,
          lastName:    typeof d?.lastName    === "string" ? d.lastName    : rest.join(" "),
          phoneNumber: typeof d?.phoneNumber === "string" ? d.phoneNumber : "",
          address:     typeof d?.address     === "string" ? d.address     : "",
        }});
      } catch { if (mountedRef.current) dispatch({ type: "SAVE_ERROR", message: "Failed to load profile." }); }
    })();
    return () => { mountedRef.current = false; };
  }, [user]);

  // ── Save profile ──────────────────────────────────────────────────────────
  const saveProfile = useCallback(async () => {
    if (!user) return;
    const { firstName: fn, lastName: ln, phoneNumber: ph, address: ad } = profile;
    const firstName = fn.trim(); const lastName = ln.trim();
    if (!firstName || !lastName) { dispatch({ type: "VALIDATION_ERROR", message: "First and last name are required." }); return; }
    dispatch({ type: "SAVE_START" });
    try {
      const displayName = `${firstName} ${lastName}`;
      await updateProfile(user, { displayName });
      if (db) await setDoc(doc(db, "users", user.uid), { firstName, lastName, phoneNumber: ph.trim(), address: ad.trim(), displayName, email: user.email ?? null, updatedAt: serverTimestamp() }, { merge: true });
      await refreshUser();
      if (mountedRef.current) dispatch({ type: "SAVE_SUCCESS" });
    } catch { if (mountedRef.current) dispatch({ type: "SAVE_ERROR", message: "Could not save. Please try again." }); }
  }, [user, profile, refreshUser]);

  // ── Password reset ────────────────────────────────────────────────────────
  const handlePasswordReset = useCallback(() => {
    if (!user?.email) { Alert.alert("No Email", "No email address on your account."); return; }
    Alert.alert("Reset Password", `A reset link will be sent to:\n${user.email}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Send Link", onPress: async () => {
        try { if (auth) await sendPasswordResetEmail(auth, user.email!); Alert.alert("Sent", "Check your inbox for the password reset link."); }
        catch { Alert.alert("Error", "Could not send reset email. Please try again."); }
      }},
    ]);
  }, [user]);

  // ── Data privacy ──────────────────────────────────────────────────────────
  const handleDataPrivacy = useCallback(() => {
    Alert.alert(
      "Data Privacy & HIPAA",
      "Your health data is encrypted at rest and in transit. We comply with HIPAA regulations and never share your data with third parties without explicit consent.\n\nTo request data deletion contact: support@vitalis-health.com",
      [{ text: "Got it" }]
    );
  }, []);

  // ── Biometric ─────────────────────────────────────────────────────────────
  const handleBiometric = useCallback(() => {
    Alert.alert("Biometric Login", "Enable biometric authentication in your device settings, then return here to activate it.", [{ text: "OK" }]);
  }, []);

  // ── Add contact ───────────────────────────────────────────────────────────
  const handleAddContact = useCallback(async (name: string, rel: string, phone: string) => {
    if (!user?.uid) return;
    if (!editingContact && contacts_.length >= 5) {
      Alert.alert("Maximum Reached", "You can only save up to 5 emergency contacts.");
      return;
    }
    try {
      if (editingContact) {
        await updateEmergencyContact(user.uid, editingContact.id, {
          name,
          relationship: rel || "Contact",
          phone,
        });
      } else {
        await addEmergencyContact(user.uid, {
          name,
          relationship: rel || "Contact",
          phone,
        });
      }
      setEditingContact(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not save contact. Please try again.";
      Alert.alert("Error", message);
      throw error;
    }
  }, [user, contacts_.length, editingContact]);

  const handleDeleteContact = useCallback(async () => {
    if (!user?.uid || !editingContact) return;
    try {
      await deleteEmergencyContact(user.uid, editingContact.id);
      setEditingContact(null);
    } catch {
      Alert.alert("Error", "Could not delete contact. Please try again.");
    }
  }, [user, editingContact]);

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  }, [logout]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Profile Hero ── */}
        <View style={s.hero}>
          <View style={s.avatarWrap}>
            <View style={[s.avatar, { backgroundColor: colors.primary }]}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <Pressable
              style={[s.avatarCam, { backgroundColor: colors.primary }]}
              onPress={() => setShowEditModal(true)}
              accessibilityLabel="Edit profile photo"
            >
              <Camera size={11} color="#fff" />
            </Pressable>
          </View>
          <Text style={[s.heroRole, { color: mutedClr, fontSize: fs(10) }]}>PATIENT PROFILE</Text>
          <Text style={[s.heroName, { color: textClr, fontSize: fs(22) }]}>{profileName}</Text>
          <Text style={[s.heroEmail, { color: mutedClr, fontSize: fs(13) }]}>{user?.email ?? "—"}</Text>
          <Pressable
            style={({ pressed }) => [s.editBtn, { backgroundColor: colors.primary }, pressed && s.pressed]}
            onPress={() => setShowEditModal(true)}
          >
            <Text style={[s.editBtnText, { fontSize: fs(14) }]}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* ── Clinical ID ── */}
        <Card isDark={isDark} tinted>
          <View style={s.clinicalRow}>
            <View style={[s.clinicalIcon, { backgroundColor: colors.primary + "22" }]}>
              <ShieldCheck size={20} color={colors.primary} />
            </View>
            <View style={s.clinicalTexts}>
              <Text style={[s.clinicalTitle, { color: isDark ? "#a5b4fc" : colors.primary, fontSize: fs(15) }]}>
                Clinical ID
              </Text>
              <Text style={[s.clinicalDesc, { color: isDark ? "#6366f1aa" : "#6366f1b0", fontSize: fs(12) }]}>
                Your data is secured using military-grade encryption in accordance with HIPAA compliance.
              </Text>
            </View>
          </View>
          <View style={[s.verifiedBadge, { backgroundColor: isDark ? "#0d2010" : "#dcfce7" }]}>
            <Check size={12} color={colors.success} />
            <Text style={[s.verifiedText, { color: colors.success, fontSize: fs(12) }]}>Verified Account</Text>
          </View>
        </Card>

        {/* ── Emergency Contacts ── */}
        <View style={s.block}>
          <View style={s.blockHeader}>
            <View style={s.contactsHeaderLeft}>
              <Text style={[s.blockTitle, { color: textClr, fontSize: fs(16) }]}>Emergency Contacts</Text>
              <Text style={[s.contactsCount, { color: mutedClr, fontSize: fs(12) }]}>{contacts_.length}/5</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                s.addBtn,
                pressed && s.pressed,
                contacts_.length >= 5 && s.addBtnDisabled,
              ]}
              onPress={() => {
                if (contacts_.length >= 5) {
                  Alert.alert("Maximum Reached", "You can only save up to 5 emergency contacts.");
                  return;
                }
                setEditingContact(null);
                setShowAddContact(true);
              }}
              disabled={contacts_.length >= 5}
            >
              <Plus size={13} color={colors.primary} />
              <Text style={[s.addBtnText, { color: colors.primary, fontSize: fs(13) }]}>Add New</Text>
            </Pressable>
          </View>
          <Card isDark={isDark}>
            {contacts_.length === 0 ? (
              <Pressable
                style={s.emptyContacts}
                onPress={() => user?.uid && ensureEmergencyContactsSeeded(user.uid)}
              >
                <Phone size={20} color={mutedClr} />
                <Text style={[s.emptyText, { color: mutedClr, fontSize: fs(13) }]}>
                  No contacts yet. Tap to sync defaults.
                </Text>
              </Pressable>
            ) : (
              contacts_.map((c, i) => {
                const ini = buildInitials(c.name);
                const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <View key={c.id}>
                    {i > 0 && <Divider isDark={isDark} />}
                    <View style={s.contactRow}>
                      <View style={[s.contactAvatar, { backgroundColor: avatarBg + "22" }]}>
                        <Text style={[s.contactAvatarText, { color: avatarBg, fontSize: fs(13) }]}>{ini}</Text>
                      </View>
                      <View style={s.contactTexts}>
                        <Text style={[s.contactName, { color: textClr, fontSize: fs(14) }]} numberOfLines={1}>{c.name}</Text>
                        <Text style={[s.contactSub, { color: mutedClr, fontSize: fs(12) }]} numberOfLines={1}>
                          {c.relationship} • {c.phone}
                        </Text>
                      </View>
                      <Pressable
                        style={s.contactMore}
                        onPress={() => {
                          setEditingContact(c);
                          setShowAddContact(true);
                        }}
                      >
                        <MoreHorizontal size={18} color={mutedClr} />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </View>

        {/* ── Notifications ── */}
        {isHydrated && (
          <View style={s.block}>
            <View style={s.blockHeader}>
              <Text style={[s.blockTitle, { color: textClr, fontSize: fs(16) }]}>Notifications</Text>
              <Bell size={16} color={mutedClr} />
            </View>
            <Card isDark={isDark}>
              {([
                { key: "medicationReminders" as const,  label: "Medication Reminders",  sub: "Alerts for scheduled prescriptions" },
                { key: "appointmentReminders" as const, label: "Appointment Alerts",     sub: "Notifications for upcoming visits" },
                { key: "emergencyAlerts" as const,      label: "Critical Vitals",        sub: "Instant alerts for life-critical changes", accent: colors.destructive },
                { key: "refillAlerts" as const,         label: "Refill Reminders",       sub: "Be notified when supply is low" },
              ]).map((item, i) => (
                <View key={item.key}>
                  {i > 0 && <Divider isDark={isDark} />}
                  <SwitchRow
                    label={item.label}
                    sub={item.sub}
                    value={preferences[item.key]}
                    onChange={(v) => setPreference(item.key, v)}
                    isDark={isDark}
                    accent={item.accent}
                  />
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* ── Appearance ── */}
        <View style={s.block}>
          <Text style={[s.blockTitle, { color: textClr, fontSize: fs(16), marginBottom: 10 }]}>Appearance</Text>
          <Card isDark={isDark}>
            {/* Theme */}
            <RowLabel label="INTERFACE THEME" isDark={isDark} />
            <View style={s.themeRow}>
              {([
                { val: "light"  as ThemeMode, label: "Light",  icon: (a: boolean) => <Sun  size={15} color={a ? "#fff" : mutedClr} /> },
                { val: "dark"   as ThemeMode, label: "Dark",   icon: (a: boolean) => <Moon size={15} color={a ? "#fff" : mutedClr} /> },
                { val: "system" as ThemeMode, label: "System", icon: (a: boolean) => <Smartphone size={15} color={a ? "#fff" : mutedClr} /> },
              ]).map((t) => {
                const active = mode === t.val;
                return (
                  <Pressable
                    key={t.val}
                    style={({ pressed }) => [
                      s.themeBtn,
                      { backgroundColor: active ? colors.primary : isDark ? "#1a1a1a" : "#f0f0f5" },
                      pressed && s.pressed,
                    ]}
                    onPress={() => setMode(t.val)}
                  >
                    {t.icon(active)}
                    <Text style={[s.themeBtnText, { color: active ? "#fff" : mutedClr, fontSize: fs(12) }]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Divider isDark={isDark} />

            {/* Text size */}
            <RowLabel label="TEXT SIZE" isDark={isDark} />
            <View style={s.textSizeRow}>
              {(["small", "medium", "large"] as TextSize[]).map((sz) => {
                const active = textSize === sz;
                const labelSize = sz === "small" ? 13 : sz === "medium" ? 16 : 20;
                return (
                  <Pressable
                    key={sz}
                    style={({ pressed }) => [
                      s.textSizeBtn,
                      { backgroundColor: active ? colors.primary : isDark ? "#1a1a1a" : "#f0f0f5" },
                      pressed && s.pressed,
                    ]}
                    onPress={() => setTextSize(sz)}
                    accessibilityLabel={`Text size ${sz}`}
                  >
                    <Text style={[s.textSizeBtnText, { fontSize: labelSize, color: active ? "#fff" : mutedClr }]}>
                      Aa
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Divider isDark={isDark} />

            {/* High contrast */}
            <RowLabel label="VISUAL CONTRAST" isDark={isDark} />
            {isHydrated && (
              <SwitchRow
                label="High Contrast Mode"
                sub=""
                value={highContrast}
                onChange={(v) => setPreference("highContrast", v)}
                isDark={isDark}
              />
            )}
          </Card>
        </View>

        {/* ── Account & Privacy ── */}
        <View style={s.block}>
          <Text style={[s.blockTitle, { color: textClr, fontSize: fs(16), marginBottom: 10 }]}>
            Account & Privacy
          </Text>
          <Card isDark={isDark}>
            <NavRow
              iconBg="#6366f120"
              icon={<RotateCcw size={16} color="#6366f1" />}
              label="Password Reset"
              sub="Update your security credentials"
              onPress={handlePasswordReset}
              isDark={isDark}
            />
            <Divider isDark={isDark} />
            <NavRow
              iconBg={colors.success + "20"}
              icon={<Eye size={16} color={colors.success} />}
              label="Data Privacy"
              sub="Manage sharing & HIPAA consents"
              onPress={handleDataPrivacy}
              isDark={isDark}
            />
            <Divider isDark={isDark} />
            <NavRow
              iconBg={colors.warning + "20"}
              icon={<Lock size={16} color={colors.warning} />}
              label="Biometric Login"
              sub="Use fingerprint or face recognition"
              onPress={handleBiometric}
              isDark={isDark}
            />
          </Card>
        </View>

        {/* ── Sign Out ── */}
        <View style={s.signOutWrap}>
          <Pressable
            style={({ pressed }) => [s.signOutBtn, { borderColor: colors.destructive + "55" }, pressed && s.pressed]}
            onPress={handleSignOut}
          >
            <Text style={[s.signOutText, { color: colors.destructive, fontSize: fs(15) }]}>Sign Out</Text>
          </Pressable>
          <Text style={[s.version, { color: mutedClr, fontSize: fs(11) }]}>App Version 4.2.1-clinical-release</Text>
        </View>
      </ScrollView>

      {/* ── Modals ── */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => { setShowEditModal(false); dispatch({ type: "SET_FIELD", field: "firstName", value: profile.firstName }); }}
        profile={profile}
        dispatch={dispatch}
        onSave={saveProfile}
        isDark={isDark}
      />
      <AddContactModal
        visible={showAddContact}
        onClose={() => {
          setShowAddContact(false);
          setEditingContact(null);
        }}
        initial={editingContact}
        onSave={handleAddContact}
        onDelete={handleDeleteContact}
        isDark={isDark}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 0, gap: 18 },
  pressed: { opacity: 0.65 },

  // Card
  card: { borderRadius: 18, padding: 16, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },

  // Divider
  divider: { height: 1, marginVertical: 2 },

  // Row label
  rowLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.9, marginBottom: 10 },

  // Switch row
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, gap: 12 },
  switchTexts: { flex: 1 },
  switchLabel: { fontSize: 14, fontWeight: "600" },
  switchSub: { fontSize: 12, marginTop: 2 },

  // Nav row
  navRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  navIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  navTexts: { flex: 1 },
  navLabel: { fontSize: 14, fontWeight: "600" },
  navSub: { fontSize: 12, marginTop: 2 },

  // Block
  block: { gap: 10 },
  blockHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  contactsHeaderLeft: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  contactsCount: { fontWeight: "600" },
  blockTitle: { fontWeight: "700", letterSpacing: -0.2 },

  // Hero
  hero: { alignItems: "center", paddingVertical: 8, gap: 5 },
  avatarWrap: { position: "relative", marginBottom: 4 },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 34, fontWeight: "800", color: "#fff" },
  avatarCam: { position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  heroRole: { fontWeight: "800", letterSpacing: 1.5, marginTop: 4 },
  heroName: { fontWeight: "800", letterSpacing: -0.5 },
  heroEmail: {},
  editBtn: { paddingHorizontal: 28, paddingVertical: 10, borderRadius: 50, marginTop: 4 },
  editBtnText: { color: "#fff", fontWeight: "700" },

  // Clinical ID
  clinicalRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 10 },
  clinicalIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  clinicalTexts: { flex: 1 },
  clinicalTitle: { fontWeight: "700", marginBottom: 4 },
  clinicalDesc: { lineHeight: 17 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  verifiedText: { fontWeight: "700" },

  // Emergency contacts
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addBtnDisabled: { opacity: 0.45 },
  addBtnText: { fontWeight: "700" },
  emptyContacts: { alignItems: "center", gap: 8, paddingVertical: 28 },
  emptyText: { textAlign: "center" },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  contactAvatarText: { fontWeight: "800" },
  contactTexts: { flex: 1, minWidth: 0 },
  contactName: { fontWeight: "600" },
  contactSub: { marginTop: 2 },
  contactMore: { padding: 4 },

  // Appearance
  themeRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  themeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12 },
  themeBtnText: { fontWeight: "600" },
  textSizeRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  textSizeBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  textSizeBtnText: { fontWeight: "700" },

  // Sign out
  signOutWrap: { alignItems: "center", gap: 10, paddingTop: 4 },
  signOutBtn: { paddingHorizontal: 52, paddingVertical: 14, borderRadius: 50, borderWidth: 1.5 },
  signOutText: { fontWeight: "700" },
  version: { textAlign: "center" },

  // Modals
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalKeyboardWrap: { width: "100%", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: "800", marginBottom: 20 },
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  sheetCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  sheetCancelText: { fontWeight: "600", fontSize: 15 },
  sheetConfirm: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  sheetConfirmText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sheetDelete: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: colors.destructive + "20" },
  sheetDeleteText: { color: colors.destructive, fontWeight: "700", fontSize: 15 },
  modalField: { gap: 6, marginBottom: 14 },
  modalFieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  modalInput: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  saveMsg: { fontSize: 13, marginBottom: 6 },
});