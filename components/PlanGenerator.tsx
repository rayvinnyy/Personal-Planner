
import React, { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { generateDailyPlan } from '../services/geminiService';
import { Task } from '../types';
import VoiceInputButton from './ui/VoiceInputButton';

interface PlanGeneratorProps {
  currentDate: string;
  onPlanGenerated: (tasks: Task[]) => void;
  onClose: () => void;
}

const PlanGenerator: React.FC<PlanGeneratorProps> = ({ currentDate, onPlanGenerated, onClose }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const tasks = await generateDailyPlan(input, currentDate);
      onPlanGenerated(tasks);
      onClose();
    } catch (err) {
      setError("生成计划失败，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (text: string) => {
    setInput(prev => prev ? prev + '，' + text : text);
  };

  return (
    <div className="space-y-4">
      <div className="bg-r-card p-4 rounded-xl border border-r-border text-sm text-r-main">
        <p className="flex items-start gap-2">
          <Wand2 size={18} className="shrink-0 mt-0.5 text-r-primary" />
          <span>
            告诉我你今天的安排。我会为你整理时间、优先级并生成任务清单。
            <br/>
            <span className="opacity-75 italic text-xs mt-1 block text-r-sub">例如：“早上10点开会，下午6点去健身房，还要买牛奶。”</span>
          </span>
        </p>
      </div>

      <div className="relative">
        <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-32 p-3 rounded-xl border border-r-border focus:border-r-primary focus:ring-2 focus:ring-r-light outline-none resize-none text-r-main placeholder:text-r-muted bg-white pr-10"
            placeholder="今天有什么计划？"
            autoFocus
        />
        <div className="absolute bottom-3 right-3">
             <VoiceInputButton onTranscript={handleVoiceInput} simple />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button 
          onClick={onClose}
          className="px-4 py-2 text-r-sub font-medium hover:bg-r-light rounded-lg transition-colors"
        >
          取消
        </button>
        <button 
          onClick={handleGenerate}
          disabled={isLoading || !input.trim()}
          className="flex items-center gap-2 px-6 py-2 bg-r-primary text-r-main font-bold rounded-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-r-border"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>思考中...</span>
            </>
          ) : (
            <>
              <Wand2 size={18} />
              <span>生成计划</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlanGenerator;
