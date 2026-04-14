import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { mockEmergencyContacts } from "@/src/data/mockData";
import type { EmergencyContact } from "@/src/types/health";

function contactsCollection(uid: string) {
  if (!db) {
    throw new Error("Firestore disabled");
  }
  return collection(db, "users", uid, "emergencyContacts");
}

export function subscribeEmergencyContacts(
  uid: string,
  onChange: (contacts: EmergencyContact[]) => void,
  onError?: (error: Error) => void
) {
  if (!db) {
    onChange(mockEmergencyContacts);
    return () => undefined;
  }
  const q = query(contactsCollection(uid), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const contacts = snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          name: String(data.name ?? ""),
          phone: String(data.phone ?? ""),
          email: data.email ? String(data.email) : undefined,
          relationship: String(data.relationship ?? "Contact"),
        } satisfies EmergencyContact;
      });
      onChange(contacts);
    },
    (err) => {
      onChange(mockEmergencyContacts);
      onError?.(err as Error);
    }
  );
}

export async function listEmergencyContacts(uid: string): Promise<EmergencyContact[]> {
  if (!db) {
    return mockEmergencyContacts;
  }
  try {
    const snapshot = await getDocs(query(contactsCollection(uid), orderBy("createdAt", "asc")));
    return snapshot.docs.map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        name: String(data.name ?? ""),
        phone: String(data.phone ?? ""),
        email: data.email ? String(data.email) : undefined,
        relationship: String(data.relationship ?? "Contact"),
      };
    });
  } catch {
    return mockEmergencyContacts;
  }
}

export async function ensureEmergencyContactsSeeded(uid: string) {
  if (!db) {
    return;
  }
  let existing;
  try {
    existing = await getDocs(contactsCollection(uid));
    if (!existing.empty) {
      return;
    }
  } catch {
    return;
  }

  await Promise.all(
    mockEmergencyContacts.map((contact) =>
      addDoc(contactsCollection(uid), {
        name: contact.name,
        phone: contact.phone,
        email: contact.email ?? null,
        relationship: contact.relationship,
        createdAt: serverTimestamp(),
      })
    )
  );
}

export async function addEmergencyContact(
  uid: string,
  contact: Omit<EmergencyContact, "id">
) {
  if (!db) {
    throw new Error("Firestore disabled");
  }
  await addDoc(contactsCollection(uid), {
    ...contact,
    email: contact.email ?? null,
    createdAt: serverTimestamp(),
  });
}

export async function updateEmergencyContact(
  uid: string,
  contactId: string,
  contact: Omit<EmergencyContact, "id">
) {
  if (!db) {
    throw new Error("Firestore disabled");
  }
  await updateDoc(doc(db, "users", uid, "emergencyContacts", contactId), {
    ...contact,
    email: contact.email ?? null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEmergencyContact(uid: string, contactId: string) {
  if (!db) {
    throw new Error("Firestore disabled");
  }
  await deleteDoc(doc(db, "users", uid, "emergencyContacts", contactId));
}

export async function logEmergencyEvent(uid: string, payload: Record<string, unknown>) {
  if (!db) {
    return;
  }
  try {
    const eventRef = doc(collection(db, "emergencyEvents"));
    await setDoc(eventRef, {
      userId: uid,
      createdAt: serverTimestamp(),
      ...payload,
    });
  } catch {
    // Firestore may be unavailable for this project.
  }
}
