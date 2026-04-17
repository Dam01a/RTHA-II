import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";

admin.initializeApp();

type IncomingContact = {
  id: string;
  name: string;
  phone: string;
};

type IncomingPayload = {
  userId: string;
  userEmail: string | null;
  timestamp: string;
  locationShared: boolean;
  location?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    locationLink: string;
  };
  message: string;
};

export const triggerEmergencyAlert = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const payload = request.data?.payload as IncomingPayload | undefined;
  const contacts = (request.data?.contacts ?? []) as IncomingContact[];

  if (!payload || payload.userId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Invalid emergency payload.");
  }

  const contactsToUse = contacts.filter((contact) => Boolean(contact.phone));
  if (contactsToUse.length === 0) {
    throw new HttpsError("failed-precondition", "No emergency contacts configured.");
  }

  // Provider integration hook:
  // Replace this with your chosen Firebase SMS extension/provider invocation.
  // This stub logs events and marks all contacts as sent for development.
  logger.info("Emergency alert dispatch requested", {
    userId: payload.userId,
    contactCount: contactsToUse.length,
    locationShared: payload.locationShared,
  });

  await admin.firestore().collection("emergencyEvents").add({
    ...payload,
    provider: "firebase_extension_stub",
    contactedPhones: contactsToUse.map((contact) => contact.phone),
    failedPhones: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    status: "sent",
    contactedPhones: contactsToUse.map((contact) => contact.phone),
    failedPhones: [],
  };
});

/**
 * Polls reminder queue and marks items sent. Wire Twilio (or another SMS provider) using env vars in production.
 */
export const processAppointmentReminderSms = onSchedule("every 5 minutes", async () => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const snap = await db
    .collection("appointmentReminderQueue")
    .where("status", "==", "pending")
    .where("sendAt", "<=", now)
    .limit(50)
    .get();

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const phone = typeof data.phone === "string" ? data.phone : "";
    const message = typeof data.message === "string" ? data.message : "";
    const userId = typeof data.userId === "string" ? data.userId : "";
    const appointmentId = typeof data.appointmentId === "string" ? data.appointmentId : "";

    try {
      if (!phone) {
        throw new Error("Missing phone on reminder queue item");
      }
      // TODO: integrate Twilio / MessageBird / etc. using process.env
      logger.info("appointment SMS reminder (stub — replace with provider)", { phone, messagePreview: message.slice(0, 80) });

      await docSnap.ref.update({
        status: "sent",
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (userId && appointmentId) {
        await db.doc(`users/${userId}/appointments/${appointmentId}`).set(
          {
            reminderStatus: "sent",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      logger.error("appointment reminder failed", err);
      await docSnap.ref.update({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      if (userId && appointmentId) {
        await db.doc(`users/${userId}/appointments/${appointmentId}`).set(
          {
            reminderStatus: "failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  }
});
