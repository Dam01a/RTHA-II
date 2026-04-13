import { useEffect, useState } from "react";
import type { EmergencyContact } from "../types/health";
import { ensureEmergencyContactsSeeded, subscribeEmergencyContacts } from "../lib/emergencyContacts";

export function useEmergencyContactsSubscription(uid: string | undefined) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    if (!uid) {
      setContacts([]);
      return;
    }

    ensureEmergencyContactsSeeded(uid).catch(() => {
      // Non-blocking seed attempt for first-run accounts.
    });

    const unsubscribe = subscribeEmergencyContacts(uid, setContacts);
    return unsubscribe;
  }, [uid]);

  return { contacts };
}
