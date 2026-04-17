import { deleteDoc, doc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { AppointmentInput } from "./appointments";

function queueDocId(uid: string, appointmentId: string) {
  return `${uid}_${appointmentId}`.replace(/[^\w-]/g, "_");
}

/** 24 hours before appointment; if that is in the past, schedule soon for dev/testing. */
export function computeReminderSendAt(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map((n) => Number(n));
  const [hh, mmRaw] = time.split(":");
  const hhNum = Number(hh);
  const mmNum = Number(mmRaw ?? "0");
  const at = new Date(y, m - 1, d, hhNum, mmNum, 0, 0);
  const reminder = new Date(at.getTime() - 24 * 60 * 60 * 1000);
  if (reminder.getTime() <= Date.now()) {
    return new Date(Date.now() + 2 * 60 * 1000);
  }
  return reminder;
}

function buildReminderMessage(input: AppointmentInput): string {
  const who = input.providerName ?? input.doctorName ?? "your provider";
  return `RTHA reminder: ${input.title} with ${who} on ${input.date} at ${input.time}. Location: ${input.location}.`;
}

export async function syncAppointmentReminderQueue(
  uid: string,
  appointmentId: string,
  input: AppointmentInput,
  profilePhone: string
): Promise<void> {
  const qid = queueDocId(uid, appointmentId);
  const ref = doc(db, "appointmentReminderQueue", qid);

  if (!input.reminderSmsEnabled) {
    try {
      await deleteDoc(ref);
    } catch {
      // ignore if missing
    }
    return;
  }

  const sendAt = computeReminderSendAt(input.date, input.time);
  await setDoc(
    ref,
    {
      userId: uid,
      appointmentId,
      phone: profilePhone,
      message: buildReminderMessage(input),
      sendAt: Timestamp.fromDate(sendAt),
      status: "pending",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteAppointmentReminderQueue(uid: string, appointmentId: string): Promise<void> {
  const qid = queueDocId(uid, appointmentId);
  try {
    await deleteDoc(doc(db, "appointmentReminderQueue", qid));
  } catch {
    // ignore
  }
}
