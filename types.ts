
export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export type PlanType = 'daily' | 'weekly' | 'monthly';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  time?: string; // Format "HH:mm" (24h)
  date: string; // ISO Date string YYYY-MM-DD
  completed: boolean;
  priority: Priority;
  subtasks: SubTask[];
  category?: string;
  planType?: PlanType;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

export interface WaterLog {
  date: string;
  cups: number;
}

export interface StepLog {
  date: string;
  steps: number;
}

export interface BloodPressureLog {
  id: string;
  date: string;
  systolic: number; // High
  diastolic: number; // Low
}

export interface BloodOxygenLog {
  id: string;
  date: string;
  percentage: number;
}

export interface HeartRateLog {
  id: string;
  date: string; // ISO String including time usually, or YYYY-MM-DD
  bpm: number;
}

export interface SleepLog {
  id: string;
  date: string;
  hours: number;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  image?: string;
}

export interface Coupon {
  id: string;
  title: string;
  expiryDate: string;
  code?: string;
  used: boolean;
  image?: string;
}

// New Checklist Types
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
  color?: string; // hex code for background or class name
}

export interface Restaurant {
  id: string;
  name: string;
  type: string;
  area?: string;
  rating: number; // 1-5
  notes?: string;
  image?: string;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes?: string;
  image?: string;
  excelItinerary?: string; // Base64 Data URL for the excel file
  excelName?: string; // Original file name
}

export type EventType = 'birthday' | 'holiday' | 'anniversary' | 'other';

export interface SpecialEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD (Year is used for calculation but recurrence ignores year)
  type: EventType;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: string; // Emoji char
}

export type ThemeType = 'original' | 'pink' | 'purple' | 'blue' | 'green' | 'yellow';

export interface AppData {
  tasks: Task[];
  weightHistory: WeightEntry[];
  waterLogs: WaterLog[];
  stepLogs: StepLog[];
  bpLogs: BloodPressureLog[];
  oxygenLogs: BloodOxygenLog[];
  heartRateLogs: HeartRateLog[]; // Added field
  sleepLogs: SleepLog[];
  healthAnalysis?: string;
  bills: Bill[];
  coupons: Coupon[];
  checklists: Checklist[]; 
  restaurants: Restaurant[];
  trips: Trip[];
  specialEvents: SpecialEvent[];
  notes: Note[];
  backgroundImage?: string;
  theme?: ThemeType;
}
