import { useCallback, useEffect, useState } from "react";
import {
  addAppointment,
  deleteAppointment,
  subscribeAppointments,
  updateAppointment,
  type AppointmentInput,
} from "../lib/appointments";
import type { Appointment } from "../types/health";

export function useAppointments(uid: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setAppointments([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeAppointments(
      uid,
      (items) => {
        setAppointments(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  const add = useCallback(async (input: AppointmentInput) => {
    if (!uid) return;
    await addAppointment(uid, input);
  }, [uid]);

  const update = useCallback(async (appointmentId: string, patch: Partial<AppointmentInput>) => {
    if (!uid) return;
    await updateAppointment(uid, appointmentId, patch);
  }, [uid]);

  const remove = useCallback(async (appointmentId: string) => {
    if (!uid) return;
    await deleteAppointment(uid, appointmentId);
  }, [uid]);

  return {
    appointments,
    loading,
    error,
    addAppointment: add,
    updateAppointment: update,
    deleteAppointment: remove,
  };
}
