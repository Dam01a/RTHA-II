import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Provider } from "../types/health";

const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: "prov_carter",
    name: "Dr. Emily Carter",
    specialty: "Family Medicine",
    location: "Downtown Clinic",
    phone: "+1-555-0101",
  },
  {
    id: "prov_lee",
    name: "Dr. Michael Lee",
    specialty: "Cardiology",
    location: "Westside Heart Center",
    phone: "+1-555-0102",
  },
  {
    id: "prov_patel",
    name: "Dr. Anika Patel",
    specialty: "Endocrinology",
    location: "North Medical Plaza",
    phone: "+1-555-0103",
  },
  {
    id: "prov_nguyen",
    name: "Dr. Sarah Nguyen",
    specialty: "Dermatology",
    location: "East Skin & Wellness",
    phone: "+1-555-0104",
  },
];

function toProvider(id: string, data: DocumentData): Provider {
  return {
    id,
    name: String(data.name ?? ""),
    specialty: String(data.specialty ?? ""),
    location: String(data.location ?? ""),
    phone: data.phone ? String(data.phone) : undefined,
  };
}

/** Seeds default providers when empty. Requires signed-in user (create rules). Does not throw. */
export async function ensureProviderDirectorySeeded(): Promise<void> {
  try {
    const existing = await getDocs(collection(db, "providers"));
    if (!existing.empty) return;
    await Promise.all(
      DEFAULT_PROVIDERS.map((provider) => setDoc(doc(db, "providers", provider.id), provider))
    );
  } catch (error) {
    console.warn("[providers] ensureProviderDirectorySeeded skipped", {
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
  }
}

export function subscribeProviders(
  onChange: (providers: Provider[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, "providers"), orderBy("name", "asc"));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => toProvider(d.id, d.data()))),
    (err) => {
      console.error("[providers] subscribe failed", {
        error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
      });
      onError?.(err as Error);
    }
  );
}
