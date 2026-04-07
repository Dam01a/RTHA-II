export type EmergencyLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  locationLink: string;
};

export type EmergencyAlertPayload = {
  userId: string;
  userEmail: string | null;
  timestamp: string;
  locationShared: boolean;
  location?: EmergencyLocation;
  message: string;
};

export type EmergencyDispatchStatus = "sent" | "partial_failure" | "failed";

export type EmergencyDispatchResult = {
  status: EmergencyDispatchStatus;
  contactedPhones: string[];
  failedPhones: string[];
  locationShared: boolean;
  timestamp: string;
  locationSummary: string;
};
