import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Appointment } from "../types/health";

const STORAGE_PREFIX = "@rtha/appointments/";

function storageKey(uid: string) {
  return `${STORAGE_PREFIX}${uid}`;
}

const asSubscribers = new Map<string, Set<(items: Appointment[]) => void>>();

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
    doctorName: data.doctorName ? String(data.doctorName) : undefined,
    type: (data.type as Appointment["type"]) ?? "other",
    notes: data.notes ? String(data.notes) : undefined,
    reminder: Boolean(data.reminder),
  };
}

function appointmentPayload(input: Omit<Appointment, "id">, options: { isCreate?: boolean } = {}) {
  const payload: Record<string, unknown> = {
    title: input.title,
    date: input.date,
    time: input.time,
    location: input.location,
    doctorName: input.doctorName ?? null,
    type: input.type,
    notes: input.notes ?? null,
    reminder: input.reminder,
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
        doctorName: o.doctorName ? String(o.doctorName) : undefined,
        type: (o.type as Appointment["type"]) ?? "other",
        notes: o.notes ? String(o.notes) : undefined,
        reminder: Boolean(o.reminder),
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

  const q = query(collection(db, "users", uid, "appointments"), orderBy("date", "asc"), orderBy("time", "asc"));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => docToAppointment(d.id, d.data()))),
    (err) => {
      onError?.(err as Error);
      loadFromAsyncStorage(uid).then(onChange).catch(() => onChange([]));
    }
  );
}

export type AppointmentInput = Omit<Appointment, "id">;

export async function addAppointment(uid: string, input: AppointmentInput): Promise<string> {
  const id = generateId();
  const item: Appointment = { id, ...input };
  if (!db) {
    const current = await loadFromAsyncStorage(uid);
    await saveToAsyncStorage(uid, [...current, item]);
    await notifySubscribers(uid);
    return id;
  }
  try {
    await setDoc(doc(db, "users", uid, "appointments", id), appointmentPayload(input, { isCreate: true }));
  } catch {
    const current = await loadFromAsyncStorage(uid);
    await saveToAsyncStorage(uid, [...current, item]);
    await notifySubscribers(uid);
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
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.date !== undefined) payload.date = patch.date;
    if (patch.time !== undefined) payload.time = patch.time;
    if (patch.location !== undefined) payload.location = patch.location;
    if (patch.doctorName !== undefined) payload.doctorName = patch.doctorName ?? null;
    if (patch.type !== undefined) payload.type = patch.type;
    if (patch.notes !== undefined) payload.notes = patch.notes ?? null;
    if (patch.reminder !== undefined) payload.reminder = patch.reminder;
    await updateDoc(doc(db, "users", uid, "appointments", appointmentId), payload);
  } catch {
    const current = await loadFromAsyncStorage(uid);
    await saveToAsyncStorage(uid, current.map((a) => (a.id === appointmentId ? { ...a, ...patch, id: a.id } : a)));
    await notifySubscribers(uid);
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
    await deleteDoc(doc(db, "users", uid, "appointments", appointmentId));
  } catch {
    const current = await loadFromAsyncStorage(uid);
    await saveToAsyncStorage(uid, current.filter((a) => a.id !== appointmentId));
    await notifySubscribers(uid);
  }
}
