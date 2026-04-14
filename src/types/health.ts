export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  refillReminder: boolean;
  pillsRemaining?: number;
  totalPills?: number;
  notes?: string;
  taken?: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  doctorName?: string;
  type: 'checkup' | 'specialist' | 'lab' | 'therapy' | 'other';
  notes?: string;
  reminder: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

export interface HealthMetric {
  id: string;
  type: "blood_pressure" | "heart_rate" | "blood_sugar" | "weight" | "temperature";
  /** ISO-8601 timestamp when measurement was taken */
  recordedAt: string;
  /** Scalar value for non-blood-pressure metrics */
  value?: number;
  /** Unit associated with scalar value */
  unit?: string;
  /** Blood pressure-specific fields */
  systolic?: number;
  diastolic?: number;
  notes?: string;
}

export type HealthMetricInput = Omit<HealthMetric, "id">;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  dateOfBirth?: string;
  emergencyContacts: EmergencyContact[];
}
