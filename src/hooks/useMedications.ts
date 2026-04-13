import { useCallback, useEffect, useState } from "react";
import {
  addMedication,
  deleteMedication,
  subscribeMedications,
  updateMedication,
  type MedicationInput,
} from "../lib/medications";
import type { Medication } from "../types/health";

export function useMedications(uid: string | undefined) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setMedications([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeMedications(
      uid,
      (list) => {
        setMedications(list);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  const add = useCallback(
    async (input: MedicationInput) => {
      if (!uid) {
        return;
      }
      await addMedication(uid, input);
    },
    [uid]
  );

  const update = useCallback(
    async (medicationId: string, patch: Partial<MedicationInput>) => {
      if (!uid) {
        return;
      }
      await updateMedication(uid, medicationId, patch);
    },
    [uid]
  );

  const remove = useCallback(
    async (medicationId: string) => {
      if (!uid) {
        return;
      }
      await deleteMedication(uid, medicationId);
    },
    [uid]
  );

  return {
    medications,
    loading,
    error,
    addMedication: add,
    updateMedication: update,
    deleteMedication: remove,
  };
}
