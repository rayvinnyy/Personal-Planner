
import { AppData, SpecialEvent } from '../types';

const STORAGE_KEY = 'rilakkuma_life_v1';
const API_KEY_STORAGE_KEY = 'gemini_api_key';

const HOLIDAYS_2026: SpecialEvent[] = [
  { id: 'h-2026-01-01', title: 'New Year', date: '2026-01-01', type: 'holiday' },
  { id: 'h-2026-02-16', title: 'Chinese New Year Eve', date: '2026-02-16', type: 'holiday' },
  { id: 'h-2026-02-17', title: 'Chinese New Year', date: '2026-02-17', type: 'holiday' },
  { id: 'h-2026-02-18', title: 'Chinese New Year', date: '2026-02-18', type: 'holiday' },
  { id: 'h-2026-03-21', title: 'Hari Raya Puasa', date: '2026-03-21', type: 'holiday' },
  { id: 'h-2026-03-22', title: 'Hari Raya Puasa', date: '2026-03-22', type: 'holiday' },
  { id: 'h-2026-05-01', title: 'Labour Day', date: '2026-05-01', type: 'holiday' },
  { id: 'h-2026-05-27', title: 'Hari Raya Haji', date: '2026-05-27', type: 'holiday' },
  { id: 'h-2026-06-01', title: "Agong's Birthday", date: '2026-06-01', type: 'holiday' },
  { id: 'h-2026-06-17', title: 'Awal Muharram', date: '2026-06-17', type: 'holiday' },
  { id: 'h-2026-07-07', title: 'Elcomp Day', date: '2026-07-07', type: 'holiday' },
  { id: 'h-2026-08-31', title: 'National Day', date: '2026-08-31', type: 'holiday' },
  { id: 'h-2026-09-16', title: 'Malaysia Day', date: '2026-09-16', type: 'holiday' },
  { id: 'h-2026-11-08', title: 'Deepavali', date: '2026-11-08', type: 'holiday' },
  { id: 'h-2026-12-25', title: 'Christmas', date: '2026-12-25', type: 'holiday' },
];

export const DEFAULT_DATA: AppData = {
  tasks: [],
  weightHistory: [],
  waterLogs: [],
  stepLogs: [],
  bpLogs: [],
  oxygenLogs: [],
  heartRateLogs: [], // Initialized
  sleepLogs: [],
  healthAnalysis: undefined,
  bills: [],
  coupons: [],
  checklists: [], 
  restaurants: [],
  trips: [],
  specialEvents: HOLIDAYS_2026,
  notes: [],
  backgroundImage: undefined,
  theme: 'original'
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to local storage', error);
  }
};

export const loadData = (): AppData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_DATA;
    
    const parsed = JSON.parse(saved);
    
    // Merge Strategy:
    // 1. Combine DEFAULT_DATA and parsed data for top-level keys.
    // 2. For specialEvents, ensure default holidays are present if missing.
    
    let mergedEvents = parsed.specialEvents || [];
    if (Array.isArray(mergedEvents)) {
      const existingIds = new Set(mergedEvents.map((e: any) => e.id));
      const missingHolidays = HOLIDAYS_2026.filter(h => !existingIds.has(h.id));
      mergedEvents = [...mergedEvents, ...missingHolidays];
    } else {
        mergedEvents = HOLIDAYS_2026;
    }

    return { 
        ...DEFAULT_DATA, 
        ...parsed,
        specialEvents: mergedEvents
    };
  } catch (error) {
    console.error('Failed to load data from local storage', error);
    return DEFAULT_DATA;
  }
};

export const getStoredApiKey = (): string => {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const saveStoredApiKey = (key: string): void => {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  } catch (error) {
    console.error('Failed to save API key', error);
  }
};
