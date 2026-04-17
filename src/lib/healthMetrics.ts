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
import type { HealthMetric, HealthMetricInput } from "../types/health";

const STORAGE_PREFIX = "@rtha/healthMetrics/";

function storageKey(uid: string) {
  return `${STORAGE_PREFIX}${uid}`;
}

const asSubscribers = new Map<string, Set<(metrics: HealthMetric[]) => void>>();

function logHealthMetricError(
  operation: string,
  uid: string,
  details: Record<string, unknown>,
  error: unknown
) {
  const normalized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };
  console.error("[healthMetrics] firestore operation failed", {
    operation,
    uid,
    collectionPath: `users/${uid}/healthMetrics`,
    ...details,
    error: normalized,
  });
}

function generateId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  return `hmet_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

function normalizeRecordedAt(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && "toDate" in (value as object)) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  return new Date().toISOString();
}

function docToHealthMetric(id: string, data: DocumentData): HealthMetric {
  return {
    id,
    type: (data.type as HealthMetric["type"]) ?? "heart_rate",
    recordedAt: normalizeRecordedAt(data.recordedAt),
    value: data.value != null ? Number(data.value) : undefined,
    unit: data.unit ? String(data.unit) : undefined,
    systolic: data.systolic != null ? Number(data.systolic) : undefined,
    diastolic: data.diastolic != null ? Number(data.diastolic) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
  };
}

function healthMetricToFirestorePayload(input: HealthMetricInput, options: { isCreate?: boolean } = {}) {
  const payload: Record<string, unknown> = {
    type: input.type,
    recordedAt: input.recordedAt,
    unit: input.unit ?? null,
    value: input.value ?? null,
    systolic: input.systolic ?? null,
    diastolic: input.diastolic ?? null,
    notes: input.notes ?? null,
    updatedAt: serverTimestamp(),
  };
  if (options.isCreate) {
    payload.createdAt = serverTimestamp();
  }
  return payload;
}

async function loadFromAsyncStorage(uid: string): Promise<HealthMetric[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item) => ({
        id: String(item.id ?? generateId()),
        type: (item.type as HealthMetric["type"]) ?? "heart_rate",
        recordedAt: typeof item.recordedAt === "string" ? item.recordedAt : new Date().toISOString(),
        value: item.value != null ? Number(item.value) : undefined,
        unit: item.unit ? String(item.unit) : undefined,
        systolic: item.systolic != null ? Number(item.systolic) : undefined,
        diastolic: item.diastolic != null ? Number(item.diastolic) : undefined,
        notes: item.notes ? String(item.notes) : undefined,
      }))
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  } catch {
    return [];
  }
}

async function saveToAsyncStorage(uid: string, metrics: HealthMetric[]): Promise<void> {
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(metrics));
}

async function notifyAsyncStorageSubscribers(uid: string) {
  const metrics = await loadFromAsyncStorage(uid);
  asSubscribers.get(uid)?.forEach((cb) => cb(metrics));
}

export function subscribeHealthMetrics(
  uid: string,
  onChange: (metrics: HealthMetric[]) => void,
  onError?: (error: Error) => void
) {
  if (!db) {
    loadFromAsyncStorage(uid).then(onChange).catch(() => onChange([]));
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

  const q = query(collection(db, "users", uid, "healthMetrics"), orderBy("recordedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((d) => docToHealthMetric(d.id, d.data())));
    },
    (err) => {
      logHealthMetricError("subscribe", uid, {}, err);
      onError?.(err as Error);
    }
  );
}

export async function addHealthMetric(uid: string, input: HealthMetricInput): Promise<string> {
  const id = generateId();
  const metric: HealthMetric = { id, ...input };

  if (!db) {
    const current = await loadFromAsyncStorage(uid);
    await saveToAsyncStorage(
      uid,
      [metric, ...current].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    );
    await notifyAsyncStorageSubscribers(uid);
    return id;
  }

  try {
    await setDoc(doc(db, "users", uid, "healthMetrics", id), healthMetricToFirestorePayload(input, { isCreate: true }));
  } catch (error) {
    logHealthMetricError("add", uid, { metricId: id, payload: metric }, error);
    throw error;
  }
  return id;
}

export async function updateHealthMetric(uid: string, metricId: string, patch: Partial<HealthMetricInput>): Promise<void> {
  if (!db) {
    const current = await loadFromAsyncStorage(uid);
    const next = current.map((m) => (m.id === metricId ? { ...m, ...patch, id: m.id } : m));
    await saveToAsyncStorage(uid, next);
    await notifyAsyncStorageSubscribers(uid);
    return;
  }

  try {
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (patch.type !== undefined) payload.type = patch.type;
    if (patch.recordedAt !== undefined) payload.recordedAt = patch.recordedAt;
    if (patch.value !== undefined) payload.value = patch.value ?? null;
    if (patch.unit !== undefined) payload.unit = patch.unit ?? null;
    if (patch.systolic !== undefined) payload.systolic = patch.systolic ?? null;
    if (patch.diastolic !== undefined) payload.diastolic = patch.diastolic ?? null;
    if (patch.notes !== undefined) payload.notes = patch.notes ?? null;
    await updateDoc(doc(db, "users", uid, "healthMetrics", metricId), payload);
  } catch (error) {
    logHealthMetricError("update", uid, { metricId, patch }, error);
    throw error;
  }
}

export async function deleteHealthMetric(uid: string, metricId: string): Promise<void> {
  if (!db) {
    const current = await loadFromAsyncStorage(uid);
    await saveToAsyncStorage(uid, current.filter((m) => m.id !== metricId));
    await notifyAsyncStorageSubscribers(uid);
    return;
  }

  try {
    await deleteDoc(doc(db, "users", uid, "healthMetrics", metricId));
  } catch (error) {
    logHealthMetricError("delete", uid, { metricId }, error);
    throw error;
  }
}
