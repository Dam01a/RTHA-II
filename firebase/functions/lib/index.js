"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAppointmentReminderSms = exports.triggerEmergencyAlert = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_functions_1 = require("firebase-functions");
admin.initializeApp();
exports.triggerEmergencyAlert = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError("unauthenticated", "Authentication is required.");
    }
    const payload = request.data?.payload;
    const contacts = (request.data?.contacts ?? []);
    if (!payload || payload.userId !== request.auth.uid) {
        throw new https_1.HttpsError("permission-denied", "Invalid emergency payload.");
    }
    const contactsToUse = contacts.filter((contact) => Boolean(contact.phone));
    if (contactsToUse.length === 0) {
        throw new https_1.HttpsError("failed-precondition", "No emergency contacts configured.");
    }
    // Provider integration hook:
    // Replace this with your chosen Firebase SMS extension/provider invocation.
    // This stub logs events and marks all contacts as sent for development.
    firebase_functions_1.logger.info("Emergency alert dispatch requested", {
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
exports.processAppointmentReminderSms = (0, scheduler_1.onSchedule)("every 5 minutes", async () => {
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
            firebase_functions_1.logger.info("appointment SMS reminder (stub — replace with provider)", { phone, messagePreview: message.slice(0, 80) });
            await docSnap.ref.update({
                status: "sent",
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            if (userId && appointmentId) {
                await db.doc(`users/${userId}/appointments/${appointmentId}`).set({
                    reminderStatus: "sent",
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
        }
        catch (err) {
            firebase_functions_1.logger.error("appointment reminder failed", err);
            await docSnap.ref.update({
                status: "failed",
                error: err instanceof Error ? err.message : String(err),
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            if (userId && appointmentId) {
                await db.doc(`users/${userId}/appointments/${appointmentId}`).set({
                    reminderStatus: "failed",
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
        }
    }
});
//# sourceMappingURL=index.js.map