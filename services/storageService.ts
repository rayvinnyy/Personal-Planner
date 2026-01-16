
import { AppData } from '../types';

const STORAGE_KEY = 'rilakkuma_life_v1';
const API_KEY_STORAGE_KEY = 'gemini_api_key';

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
  specialEvents: [],
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
    // Merge with default to ensure all keys exist if we upgrade schema
    return { ...DEFAULT_DATA, ...parsed };
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
