import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
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
