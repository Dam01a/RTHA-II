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
  type: 'blood_pressure' | 'heart_rate' | 'blood_sugar' | 'weight' | 'temperature';
  value: string;
  unit: string;
  date: string;
  time: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  dateOfBirth?: string;
  emergencyContacts: EmergencyContact[];
}
