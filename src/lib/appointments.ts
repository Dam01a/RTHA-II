import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Appointment } from "../types/health";
import {
  deleteAppointmentReminderQueue,
  syncAppointmentReminderQueue,
} from "./appointmentReminders";
import { getUserPhoneForReminders } from "./userProfile";

const STORAGE_PREFIX = "@rtha/appointments/";

function storageKey(uid: string) {
  return `${STORAGE_PREFIX}${uid}`;
}

const asSubscribers = new Map<string, Set<(items: Appointment[]) => void>>();

function logAppointmentError(
  operation: string,
  uid: string,
  details: Record<string, unknown>,
  error: unknown
) {
  const normalized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };
  console.error("[appointments] firestore operation failed", {
    operation,
    uid,
    collectionPath: `users/${uid}/appointments`,
    ...details,
    error: normalized,
  });
}

function generateId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `apt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

function docToAppointment(id: string, data: DocumentData): Appointment {
  return {
    id,
    title: String(data.title ?? ""),
    date: String(data.date ?? ""),
    time: String(data.time ?? ""),
    location: String(data.location ?? ""),
    providerId: data.providerId ? String(data.providerId) : undefined,
    providerName: data.providerName ? String(data.providerName) : undefined,
    doctorName: data.doctorName ? String(data.doctorName) : undefined,
    reason: data.reason ? String(data.reason) : undefined,
    visitType: (data.visitType as Appointment["visitType"]) ?? undefined,
    type: (data.type as Appointment["type"]) ?? "other",
    notes: data.notes ? String(data.notes) : undefined,
    reminder: Boolean(data.reminder),
    reminderSmsEnabled: Boolean(data.reminderSmsEnabled),
    reminderStatus: (data.reminderStatus as Appointment["reminderStatus"]) ?? "pending",
  };
}

function sortAppointmentsByDateTime(items: Appointment[]): Appointment[] {
  return [...items].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

function appointmentPayload(input: Omit<Appointment, "id">, options: { isCreate?: boolean } = {}) {
  const payload: Record<string, unknown> = {
    title: input.title,
    date: input.date,
    time: input.time,
    location: input.location,
    providerId: input.providerId ?? null,
    providerName: input.providerName ?? null,
    doctorName: input.doctorName ?? null,
    reason: input.reason ?? null,
    visitType: input.visitType ?? null,
    type: input.type,
    notes: input.notes ?? null,
    reminder: input.reminder,
    reminderSmsEnabled: input.reminderSmsEnabled ?? false,
    reminderStatus: input.reminderSmsEnabled ? "scheduled" : "pending",
    updatedAt: serverTimestamp(),
  };
  if (options.isCreate) payload.createdAt = serverTimestamp();
  return payload;
}

async function loadFromAsyncStorage(uid: string): Promise<Appointment[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
           .map((o) => ({
        id: String(o.id ?? generateId()),
        title: String(o.title ?? ""),
        date: String(o.date ?? ""),
        time: String(o.time ?? ""),
        location: String(o.location ?? ""),
        providerId: o.providerId ? String(o.providerId) : undefined,
        providerName: o.providerName ? String(o.providerName) : undefined,
        doctorName: o.doctorName ? String(o.doctorName) : undefined,
        reason: o.reason ? String(o.reason) : undefined,
        visitType: (o.visitType as Appointment["visitType"]) ?? undefined,
        type: (o.type as Appointment["type"]) ?? "other",
        notes: o.notes ? String(o.notes) : undefined,
        reminder: Boolean(o.reminder),
        reminderSmsEnabled: Boolean(o.reminderSmsEnabled),
        reminderStatus: (o.reminderStatus as Appointment["reminderStatus"]) ?? "pending",
      }))
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  } catch {
    return [];
  }
}

async function saveToAsyncStorage(uid: string, items: Appointment[]) {
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(items));
}

async function notifySubscribers(uid: string) {
  const items = await loadFromAsyncStorage(uid);
  asSubscribers.get(uid)?.forEach((cb) => cb(items));
}

export function subscribeAppointments(
  uid: string,
  onChange: (items: Appointment[]) => void,
  onError?: (error: Error) => void
) {
  if (!db) {
    loadFromAsyncStorage(uid).then(onChange).catch(() => onChange([]));
    const set = asSubscribers.get(uid) ?? new Set();
    set.add(onChange);
    asSubscribers.set(uid, set);
    return () => {
      set.delete(onChange);
      if (set.size === 0) asSubscribers.delete(uid);
    };
  }

  const ref = collection(db, "users", uid, "appointments");
  return onSnapshot(
    ref,
    (snapshot) => onChange(sortAppointmentsByDateTime(snapshot.docs.map((d) => docToAppointment(d.id, d.data())))),
    (err) => {
      logAppointmentError("subscribe", uid, {}, err);
      onError?.(err as Error);
    }
  );
}

export type AppointmentInput = Omit<Appointment, "id">;

function validateAppointmentInput(input: AppointmentInput) {
  if (!input.providerId || !input.providerName) {
    throw new Error("Please select a doctor/provider.");
  }
  if (!input.reason?.trim()) {
    throw new Error("Please provide a reason for visit.");
  }
  if (!input.visitType) {
    throw new Error("Please select a visit type.");
  }
  if (!input.location.trim()) {
    throw new Error("Please provide a location.");
  }
}

async function assertNoUserDoubleBooking(uid: string, date: string, time: string, excludeId?: string) {
  if (!db) return;
  const snapshot = await getDocs(collection(db, "users", uid, "appointments"));
  const conflict = snapshot.docs.some(
    (d) =>
      d.id !== excludeId &&
      String(d.data().date ?? "") === date &&
      String(d.data().time ?? "") === time
  );
  if (conflict) {
    throw new Error("You already have an appointment at this date and time.");
  }
}

function mergeAppointmentForUpdate(current: Appointment, patch: Partial<AppointmentInput>): AppointmentInput {
  return {
    title: patch.title ?? current.title,
    date: patch.date ?? current.date,
    time: patch.time ?? current.time,
    location: patch.location ?? current.location,
    providerId: patch.providerId ?? current.providerId,
    providerName: patch.providerName ?? current.providerName,
    doctorName: patch.doctorName ?? current.doctorName,
    reason: patch.reason ?? current.reason,
    visitType: patch.visitType ?? current.visitType ?? "in_person",
    type: patch.type ?? current.type,
    notes: patch.notes ?? current.notes,
    reminder: patch.reminder ?? current.reminder,
    reminderSmsEnabled: patch.reminderSmsEnabled ?? current.reminderSmsEnabled ?? false,
  };
}

async function applyReminderQueue(uid: string, appointmentId: string, input: AppointmentInput) {
  if (!db) return;
  if (input.reminderSmsEnabled) {
    const phone = await getUserPhoneForReminders(uid);
    if (!phone) {
      throw new Error("Add a phone number in Settings to enable SMS reminders.");
    }
    await syncAppointmentReminderQueue(uid, appointmentId, input, phone);
  } else {
    await deleteAppointmentReminderQueue(uid, appointmentId);
  }
}

export async function addAppointment(uid: string, input: AppointmentInput): Promise<string> {
  validateAppointmentInput(input);
  const id = generateId();
  const item: Appointment = { id, ...input };
  if (!db) {
    const current = await loadFromAsyncStorage(uid);
    await saveToAsyncStorage(uid, [...current, item]);
    await notifySubscribers(uid);
    return id;
  }
  try {
    await assertNoUserDoubleBooking(uid, input.date, input.time);
    await setDoc(doc(db, "users", uid, "appointments", id), appointmentPayload(input, { isCreate: true }));
    await applyReminderQueue(uid, id, input);
  } catch (error) {
    logAppointmentError("add", uid, { appointmentId: id, payload: item }, error);
    throw error;
  }
  return id;
}

export async function updateAppointment(uid: string, appointmentId: string, patch: Partial<AppointmentInput>) {
  if (!db) {
    const current = await loadFromAsyncStorage(uid);
    await saveToAsyncStorage(uid, current.map((a) => (a.id === appointmentId ? { ...a, ...patch, id: a.id } : a)));
    await notifySubscribers(uid);
    return;
  }
  try {
    const snap = await getDoc(doc(db, "users", uid, "appointments", appointmentId));
    if (!snap.exists) {
      throw new Error("Appointment not found.");
    }
    const current = docToAppointment(appointmentId, snap.data());
    const merged = mergeAppointmentForUpdate(current, patch);
    validateAppointmentInput(merged);
    if (merged.date && merged.time) {
      await assertNoUserDoubleBooking(uid, merged.date, merged.time, appointmentId);
    }
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.date !== undefined) payload.date = patch.date;
    if (patch.time !== undefined) payload.time = patch.time;
    if (patch.location !== undefined) payload.location = patch.location;
    if (patch.providerId !== undefined) payload.providerId = patch.providerId ?? null;
    if (patch.providerName !== undefined) payload.providerName = patch.providerName ?? null;
    if (patch.doctorName !== undefined) payload.doctorName = patch.doctorName ?? null;
    if (patch.reason !== undefined) payload.reason = patch.reason ?? null;
    if (patch.visitType !== undefined) payload.visitType = patch.visitType ?? null;
    if (patch.type !== undefined) payload.type = patch.type;
    if (patch.notes !== undefined) payload.notes = patch.notes ?? null;
    if (patch.reminder !== undefined) payload.reminder = patch.reminder;
    if (patch.reminderSmsEnabled !== undefined) payload.reminderSmsEnabled = patch.reminderSmsEnabled;
    if (patch.reminderSmsEnabled !== undefined) {
      payload.reminderStatus = patch.reminderSmsEnabled ? "scheduled" : "pending";
    }
    await updateDoc(doc(db, "users", uid, "appointments", appointmentId), payload);
    await applyReminderQueue(uid, appointmentId, merged);
  } catch (error) {
    logAppointmentError("update", uid, { appointmentId, patch }, error);
    throw error;
  }
}

export async function deleteAppointment(uid: string, appointmentId: string) {
  if (!db) {
    const current = await loadFromAsyncStorage(uid);
    await saveToAsyncStorage(uid, current.filter((a) => a.id !== appointmentId));
    await notifySubscribers(uid);
    return;
  }
  try {
    await deleteAppointmentReminderQueue(uid, appointmentId);
    await deleteDoc(doc(db, "users", uid, "appointments", appointmentId));
  } catch (error) {
    logAppointmentError("delete", uid, { appointmentId }, error);
    throw error;
  }
}
