export interface MedicineSchedule {
  days: string[];
  times: string[];
  customTimes?: boolean; // Flag to indicate if times are custom or predefined
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  schedule: MedicineSchedule;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderMinutesBefore: number;
} 