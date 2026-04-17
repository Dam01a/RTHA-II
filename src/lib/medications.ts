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
import type { Medication } from "../types/health";

const STORAGE_PREFIX = "@rtha/medications/";

function storageKey(uid: string) {
  return `${STORAGE_PREFIX}${uid}`;
}

/** In-memory subscribers for AsyncStorage mode (no Firestore). */
const asSubscribers = new Map<string, Set<(meds: Medication[]) => void>>();

function logMedicationError(
  operation: string,
  uid: string,
  details: Record<string, unknown>,
  error: unknown
) {
  const normalized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };
  console.error("[medications] firestore operation failed", {
    operation,
    uid,
    collectionPath: `users/${uid}/medications`,
    ...details,
    error: normalized,
  });
}

function generateId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  return `med_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

function medicationsCollectionRef(uid: string) {
  if (!db) {
    throw new Error("Firestore disabled");
  }
  return collection(db, "users", uid, "medications");
}

function docToMedication(id: string, data: DocumentData): Medication {
  const times = Array.isArray(data.times) ? data.times.map((t: unknown) => String(t)) : ["08:00"];
  return {
    id,
    name: String(data.name ?? ""),
    dosage: String(data.dosage ?? ""),
    frequency: String(data.frequency ?? ""),
    times,
    startDate: String(data.startDate ?? ""),
    endDate: data.endDate ? String(data.endDate) : undefined,
    refillReminder: Boolean(data.refillReminder),
    pillsRemaining: data.pillsRemaining != null ? Number(data.pillsRemaining) : undefined,
    totalPills: data.totalPills != null ? Number(data.totalPills) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
    taken: Boolean(data.taken),
  };
}

function medicationToFirestorePayload(
  med: Omit<Medication, "id">,
  options: { isCreate?: boolean } = {}
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: med.name,
    dosage: med.dosage,
    frequency: med.frequency,
    times: med.times,
    startDate: med.startDate,
    refillReminder: med.refillReminder,
    taken: med.taken ?? false,
  };
  if (med.endDate) {
    payload.endDate = med.endDate;
  }
  if (med.pillsRemaining != null) {
    payload.pillsRemaining = med.pillsRemaining;
  }
  if (med.totalPills != null) {
    payload.totalPills = med.totalPills;
  }
  if (med.notes) {
    payload.notes = med.notes;
  }
  if (options.isCreate) {
    payload.createdAt = serverTimestamp();
  }
  payload.updatedAt = serverTimestamp();
  return payload;
}

async function loadMedicationsFromAsyncStorage(uid: string): Promise<Medication[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const out: Medication[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const o = item as Record<string, unknown>;
      out.push({
        id: String(o.id ?? generateId()),
        name: String(o.name ?? ""),
        dosage: String(o.dosage ?? ""),
        frequency: String(o.frequency ?? ""),
        times: Array.isArray(o.times) ? o.times.map(String) : ["08:00"],
        startDate: String(o.startDate ?? ""),
        endDate: o.endDate ? String(o.endDate) : undefined,
        refillReminder: Boolean(o.refillReminder),
        pillsRemaining: o.pillsRemaining != null ? Number(o.pillsRemaining) : undefined,
        totalPills: o.totalPills != null ? Number(o.totalPills) : undefined,
        notes: o.notes ? String(o.notes) : undefined,
        taken: Boolean(o.taken),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function saveMedicationsToAsyncStorage(uid: string, medications: Medication[]): Promise<void> {
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(medications));
}

async function notifyAsyncStorageSubscribers(uid: string) {
  const meds = await loadMedicationsFromAsyncStorage(uid);
  const set = asSubscribers.get(uid);
  set?.forEach((cb) => {
    cb(meds);
  });
}

export function subscribeMedications(
  uid: string,
  onChange: (medications: Medication[]) => void,
  onError?: (error: Error) => void
) {
  if (!db) {
    loadMedicationsFromAsyncStorage(uid).then(onChange).catch(() => onChange([]));
    const set = asSubscribers.get(uid) ?? new Set();
    set.add(onChange);
    asSubscribers.set(uid, set);
    return () => {
      set.delete(onChange);
      if (set.size === 0) {
        asSubscribers.delete(uid);
      }
    };
  }

  const q = query(medicationsCollectionRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => docToMedication(d.id, d.data()));
      onChange(list);
    },
    (err) => {
      logMedicationError("subscribe", uid, {}, err);
      onError?.(err as Error);
    }
  );
}

export type MedicationInput = Omit<Medication, "id">;

export async function addMedication(uid: string, input: MedicationInput): Promise<string> {
  const id = generateId();
  const med: Medication = {
    id,
    ...input,
  };

  if (!db) {
    const existing = await loadMedicationsFromAsyncStorage(uid);
    const next = [...existing, med];
    await saveMedicationsToAsyncStorage(uid, next);
    await notifyAsyncStorageSubscribers(uid);
    return id;
  }

  try {
    await setDoc(doc(db, "users", uid, "medications", id), medicationToFirestorePayload(med, { isCreate: true }));
  } catch (error) {
    logMedicationError("add", uid, { medicationId: id, payload: med }, error);
    throw error;
  }
  return id;
}

export async function updateMedication(uid: string, medicationId: string, patch: Partial<MedicationInput>): Promise<void> {
  if (!db) {
    const existing = await loadMedicationsFromAsyncStorage(uid);
    const next = existing.map((m) =>
      m.id === medicationId ? { ...m, ...patch, id: m.id } : m
    );
    if (!next.some((m) => m.id === medicationId)) {
      return;
    }
    await saveMedicationsToAsyncStorage(uid, next);
    await notifyAsyncStorageSubscribers(uid);
    return;
  }

  try {
    const ref = doc(db, "users", uid, "medications", medicationId);
    const updatePayload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (patch.name !== undefined) {
      updatePayload.name = patch.name;
    }
    if (patch.dosage !== undefined) {
      updatePayload.dosage = patch.dosage;
    }
    if (patch.frequency !== undefined) {
      updatePayload.frequency = patch.frequency;
    }
    if (patch.times !== undefined) {
      updatePayload.times = patch.times;
    }
    if (patch.startDate !== undefined) {
      updatePayload.startDate = patch.startDate;
    }
    if (patch.endDate !== undefined) {
      updatePayload.endDate = patch.endDate ?? null;
    }
    if (patch.refillReminder !== undefined) {
      updatePayload.refillReminder = patch.refillReminder;
    }
    if (patch.pillsRemaining !== undefined) {
      updatePayload.pillsRemaining = patch.pillsRemaining ?? null;
    }
    if (patch.totalPills !== undefined) {
      updatePayload.totalPills = patch.totalPills ?? null;
    }
    if (patch.notes !== undefined) {
      updatePayload.notes = patch.notes ?? null;
    }
    if (patch.taken !== undefined) {
      updatePayload.taken = patch.taken;
    }
    await updateDoc(ref, updatePayload);
  } catch (error) {
    logMedicationError("update", uid, { medicationId, patch }, error);
    throw error;
  }
}

export async function deleteMedication(uid: string, medicationId: string): Promise<void> {
  if (!db) {
    const existing = await loadMedicationsFromAsyncStorage(uid);
    const next = existing.filter((m) => m.id !== medicationId);
    await saveMedicationsToAsyncStorage(uid, next);
    await notifyAsyncStorageSubscribers(uid);
    return;
  }

  try {
    await deleteDoc(doc(db, "users", uid, "medications", medicationId));
  } catch (error) {
    logMedicationError("delete", uid, { medicationId }, error);
    throw error;
  }
}
