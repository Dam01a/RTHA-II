import * as Location from "expo-location";
import * as SMS from "expo-sms";
import type { EmergencyContact } from "@/src/types/health";
import type { EmergencyAlertPayload, EmergencyDispatchResult, EmergencyLocation } from "@/src/types/emergency";
import { auth } from "@/src/lib/firebase";
import { listEmergencyContacts, logEmergencyEvent } from "@/src/lib/emergencyContacts";

type TriggerArgs = {
  uid: string;
  email: string | null;
};

function formatLocationSummary(location?: EmergencyLocation, locationShared?: boolean): string {
  if (!locationShared || !location) {
    return "Location not shared";
  }
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (${location.locationLink})`;
}

function sanitizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

async function captureLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    return { locationShared: false as const };
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const location: EmergencyLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracyMeters: position.coords.accuracy ?? undefined,
      locationLink: `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`,
    };
    return { locationShared: true as const, location };
  } catch {
    return { locationShared: false as const };
  }
}

function buildMessage(timestamp: string, locationInfo: ReturnType<typeof formatLocationSummary>) {
  return `RTHA Emergency Alert at ${timestamp}. ${locationInfo}`;
}

async function tryProviderSms(payload: EmergencyAlertPayload, contacts: EmergencyContact[]) {
  const endpoint = process.env.EXPO_PUBLIC_EMERGENCY_FUNCTION_URL;
  if (!endpoint) {
    throw new Error("Missing emergency function endpoint.");
  }

  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({
    payload,
      contacts: contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        phone: sanitizePhone(contact.phone),
      })),
    }),
  });

  if (!response.ok) {
    throw new Error("Provider request failed.");
  }

  const data = (await response.json()) as {
    status?: "sent" | "partial_failure" | "failed";
    contactedPhones?: string[];
    failedPhones?: string[];
  };

  return {
    status: data.status ?? "failed",
    contactedPhones: data.contactedPhones ?? [],
    failedPhones: data.failedPhones ?? [],
  };
}

async function fallbackToDeviceSms(phones: string[], message: string) {
  const available = await SMS.isAvailableAsync();
  if (!available || phones.length === 0) {
    return { sent: false, sentPhones: [] as string[] };
  }

  await SMS.sendSMSAsync(phones, message);
  return { sent: true, sentPhones: phones };
}

export async function triggerEmergencyAlert({ uid, email }: TriggerArgs): Promise<EmergencyDispatchResult> {
  const contacts = await listEmergencyContacts(uid);
  const allPhones = contacts.map((contact) => sanitizePhone(contact.phone)).filter(Boolean);
  const timestamp = new Date().toISOString();
  const locationResult = await captureLocation();
  const locationSummary = formatLocationSummary(locationResult.location, locationResult.locationShared);
  const message = buildMessage(timestamp, locationSummary);
  const payload: EmergencyAlertPayload = {
    userId: uid,
    userEmail: email,
    timestamp,
    locationShared: locationResult.locationShared,
    location: locationResult.location,
    message,
  };

  let status: EmergencyDispatchResult["status"] = "failed";
  let contactedPhones: string[] = [];
  let failedPhones: string[] = [...allPhones];

  try {
    const providerResult = await tryProviderSms(payload, contacts);
    status = providerResult.status;
    contactedPhones = providerResult.contactedPhones.map(sanitizePhone).filter(Boolean);
    failedPhones = providerResult.failedPhones.map(sanitizePhone).filter(Boolean);

    if (failedPhones.length > 0) {
      const fallback = await fallbackToDeviceSms(failedPhones, message);
      if (fallback.sent) {
        contactedPhones = Array.from(new Set([...contactedPhones, ...fallback.sentPhones]));
        failedPhones = failedPhones.filter((phone) => !fallback.sentPhones.includes(phone));
        status = failedPhones.length === 0 ? "sent" : "partial_failure";
      }
    }
  } catch {
    const fallback = await fallbackToDeviceSms(allPhones, message);
    if (fallback.sent) {
      status = "sent";
      contactedPhones = Array.from(new Set(fallback.sentPhones));
      failedPhones = allPhones.filter((phone) => !fallback.sentPhones.includes(phone));
    } else {
      status = "failed";
    }
  }

  const result: EmergencyDispatchResult = {
    status,
    contactedPhones,
    failedPhones,
    locationShared: payload.locationShared,
    timestamp,
    locationSummary,
  };

  await logEmergencyEvent(uid, {
    ...payload,
    dispatchResult: result,
  });

  return result;
}
