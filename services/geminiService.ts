import { GoogleGenAI, Type } from "@google/genai";
import { Task, Priority, AppData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to generate a unique ID (simple implementation for generated content)
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateDailyPlan = async (rawText: string, dateStr: string): Promise<Task[]> => {
  const prompt = `
    You are an expert productivity assistant. 
    The user has provided a raw brain dump of their plans for the day (${dateStr}).
    Please parse this text and convert it into a structured list of tasks.
    
    Rules:
    1. Infer specific times if mentioned (format HH:MM 24-hour). If morning/afternoon is vague, estimate reasonable times.
    2. Assign a priority (HIGH, MEDIUM, LOW) based on urgency or importance implied.
    3. Keep descriptions concise.
    4. If no time is specified, leave the time field empty or null.
    5. **Output language: Simplified Chinese (简体中文).** Ensure titles and descriptions are in Chinese.
    
    User Input: "${rawText}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "The main task title (Chinese)" },
              description: { type: Type.STRING, description: "Short details about the task (Chinese)" },
              time: { type: Type.STRING, description: "Time in HH:MM format (24h) or null if not specific" },
              priority: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
              category: { type: Type.STRING, description: "One word category e.g., Work, Health, Chores (in Chinese)" },
            },
            required: ["title", "priority"],
          },
        },
      },
    });

    const rawTasks = JSON.parse(response.text || "[]");

    // Hydrate with client-side only properties (IDs, dates)
    const newTasks: Task[] = rawTasks.map((t: any) => ({
      id: generateId(),
      title: t.title,
      description: t.description || "",
      time: t.time || undefined,
      date: dateStr,
      completed: false,
      priority: t.priority as Priority,
      subtasks: [],
      category: t.category,
    }));

    return newTasks;

  } catch (error) {
    console.error("Gemini Plan Generation Error:", error);
    throw error;
  }
};

export const suggestSubtasks = async (taskTitle: string): Promise<string[]> => {
  const prompt = `Break down the task "${taskTitle}" into 3-5 actionable subtasks. Return only the subtask titles as a JSON array of strings. **The Output must be in Simplified Chinese (简体中文).**`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Subtask Error:", error);
    return [];
  }
};

export const analyzeHealthData = async (data: AppData): Promise<string> => {
  // Extract last 14 days of data to keep payload reasonable
  const recentSteps = data.stepLogs.slice(-14);
  const recentWeight = data.weightHistory.slice(-14);
  const recentBP = data.bpLogs.slice(-14);
  const recentSleep = data.sleepLogs.slice(-14);
  const recentOxygen = data.oxygenLogs.slice(-14);
  const recentHeartRate = (data.heartRateLogs || []).slice(-14);

  const context = JSON.stringify({
    steps: recentSteps,
    weight: recentWeight,
    bloodPressure: recentBP,
    sleep: recentSleep,
    bloodOxygen: recentOxygen,
    heartRate: recentHeartRate
  });

  const prompt = `
    You are a caring, friendly health assistant named "Dr. Bear". 
    Analyze the following recent health data for the user.
    
    Data: ${context}
    
    Please provide a response in **Simplified Chinese** that includes:
    1. A gentle summary of their recent activity and health stats.
    2. Encouragement for any positive trends (e.g., walking more, good sleep, stable weight, normal heart rate).
    3. Gentle advice if anything looks concerning (e.g., low sleep, high BP, irregular heart rate). If data is missing, encourage them to track it.
    4. Keep the tone warm, cute, and supportive (like a Rilakkuma style friend).
    5. Keep it under 200 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Dr. Bear 正在休息，暂时无法分析数据哦。";
  } catch (error) {
    console.error("Gemini Health Analysis Error:", error);
    return "分析服务暂时不可用，请稍后再试。";
  }
};
