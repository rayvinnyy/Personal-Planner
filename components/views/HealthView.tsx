
import React, { useState } from 'react';
import { Scale, Activity, Moon, Wind, Footprints, Sparkles, ChevronRight, Loader2, HeartPulse } from 'lucide-react';
import { WeightEntry, StepLog, BloodPressureLog, BloodOxygenLog, SleepLog, HeartRateLog } from '../../types';
import VoiceInputButton from '../ui/VoiceInputButton';

interface HealthViewProps {
  weightHistory: WeightEntry[];
  stepLogs: StepLog[];
  bpLogs: BloodPressureLog[];
  oxygenLogs: BloodOxygenLog[];
  heartRateLogs: HeartRateLog[];
  sleepLogs: SleepLog[];
  healthAnalysis?: string;
  onAddWeight: (weight: number) => void;
  onAddSteps: (steps: number) => void;
  onAddBP: (systolic: number, diastolic: number) => void;
  onAddOxygen: (percentage: number) => void;
  onAddHeartRate: (bpm: number) => void;
  onAddSleep: (hours: number) => void;
  onAnalyzeHealth: () => Promise<void>;
}

type MetricType = 'steps' | 'weight' | 'sleep' | 'bp' | 'oxygen' | 'heartRate';

const HealthView: React.FC<HealthViewProps> = ({ 
  weightHistory, stepLogs, bpLogs, oxygenLogs, sleepLogs, heartRateLogs, healthAnalysis,
  onAddWeight, onAddSteps, onAddBP, onAddOxygen, onAddSleep, onAddHeartRate, onAnalyzeHealth
}) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('steps');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputValue1, setInputValue1] = useState('');
  const [inputValue2, setInputValue2] = useState('');

  const todayDate = new Date().toISOString().split('T')[0];
  const todaySteps = stepLogs.find(l => l.date === todayDate)?.steps || 0;
  const todaySleep = sleepLogs.find(l => l.date === todayDate)?.hours || 0;
  const latestWeight = weightHistory.length > 0 ? weightHistory[0].weight : '--';
  const latestBP = bpLogs.length > 0 ? `${bpLogs[0].systolic}/${bpLogs[0].diastolic}` : '--';
  const latestOxygen = oxygenLogs.length > 0 ? `${oxygenLogs[0].percentage}%` : '--';
  const latestHeartRate = heartRateLogs.length > 0 ? `${heartRateLogs[0].bpm}` : '--';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue1) return;
    switch(activeMetric) {
      case 'steps': onAddSteps(parseInt(inputValue1)); break;
      case 'weight': onAddWeight(parseFloat(inputValue1)); break;
      case 'sleep': onAddSleep(parseFloat(inputValue1)); break;
      case 'oxygen': onAddOxygen(parseInt(inputValue1)); break;
      case 'heartRate': onAddHeartRate(parseInt(inputValue1)); break;
      case 'bp': if(inputValue2) onAddBP(parseInt(inputValue1), parseInt(inputValue2)); break;
    }
    setInputValue1('');
    setInputValue2('');
  };

  const handleAI = async () => {
    setIsAnalyzing(true);
    await onAnalyzeHealth();
    setIsAnalyzing(false);
  };

  const renderCard = (type: MetricType, title: string, value: string | number, unit: string, Icon: React.ElementType, colorClass: string) => (
    <div 
      onClick={() => { setActiveMetric(type); setInputValue1(''); setInputValue2(''); }}
      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-28 relative overflow-hidden ${
        activeMetric === type ? 'border-r-primary bg-r-card shadow-md scale-105 z-10' : 'border-transparent bg-white shadow-sm hover:bg-gray-50'
      }`}
    >
      <div className={`p-1.5 rounded-full w-fit mb-2 ${colorClass} bg-opacity-20`}>
        <Icon size={18} className={colorClass.replace('bg-', 'text-')} />
      </div>
      <div>
        <div className="text-2xl font-bold text-r-main">{value}</div>
        <div className="text-xs text-r-sub">{title} ({unit})</div>
      </div>
      {activeMetric === type && (
        <div className="absolute top-2 right-2 text-r-primary">
          <ChevronRight size={16} />
        </div>
      )}
    </div>
  );

  const getHistoryList = () => {
    switch(activeMetric) {
      case 'steps': return stepLogs.sort((a,b) => b.date.localeCompare(a.date)).map(l => ({ id: l.date, date: l.date, val: `${l.steps} 步` }));
      case 'weight': return weightHistory.sort((a,b) => b.date.localeCompare(a.date)).map(l => ({ id: l.id, date: l.date, val: `${l.weight} kg` }));
      case 'sleep': return sleepLogs.sort((a,b) => b.date.localeCompare(a.date)).map(l => ({ id: l.id, date: l.date, val: `${l.hours} 小时` }));
      case 'oxygen': return oxygenLogs.sort((a,b) => b.date.localeCompare(a.date)).map(l => ({ id: l.id, date: l.date, val: `${l.percentage}%` }));
      case 'heartRate': return heartRateLogs.sort((a,b) => b.date.localeCompare(a.date)).map(l => ({ id: l.id, date: l.date, val: `${l.bpm} bpm` }));
      case 'bp': return bpLogs.sort((a,b) => b.date.localeCompare(a.date)).map(l => ({ id: l.id, date: l.date, val: `${l.systolic}/${l.diastolic} mmHg` }));
      default: return [];
    }
  };

  const getInputConfig = () => {
    switch(activeMetric) {
      case 'steps': return { label: '今日步数', placeholder: '例如: 5000', type: 'number', step: '1' };
      case 'weight': return { label: '当前体重 (kg)', placeholder: '例如: 60.5', type: 'number', step: '0.1' };
      case 'sleep': return { label: '昨晚睡眠 (小时)', placeholder: '例如: 7.5', type: 'number', step: '0.5' };
      case 'oxygen': return { label: '血氧饱和度 (%)', placeholder: '例如: 98', type: 'number', step: '1' };
      case 'heartRate': return { label: '当前心率 (bpm)', placeholder: '例如: 75', type: 'number', step: '1' };
      case 'bp': return { label: '收缩压 (高压)', placeholder: '120', type: 'number', step: '1', label2: '舒张压 (低压)', placeholder2: '80' };
      default: return { label: '', placeholder: '', type: 'text' };
    }
  };

  const inputConfig = getInputConfig();

  return (
    <div className="space-y-6 pb-20">
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-r-main">健康管理</h2>
         <button onClick={handleAI} disabled={isAnalyzing} className="bg-r-light hover:bg-r-card text-r-main text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors disabled:opacity-50">
           {isAnalyzing ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
           {isAnalyzing ? '分析中...' : 'Dr. Bear 分析'}
         </button>
       </div>

       {healthAnalysis && (
         <div className="bear-card p-4 bg-[#E8F5E9] border-[#C8E6C9] animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-3">
               <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 text-xl border-2 border-[#A5D6A7]">🐻</div>
               <div className="text-sm text-[#388E3C] whitespace-pre-wrap leading-relaxed">{healthAnalysis}</div>
            </div>
         </div>
       )}

       <div className="grid grid-cols-2 gap-3">
          {renderCard('steps', '行走', todaySteps.toLocaleString(), '步', Footprints, 'bg-green-500 text-green-500')}
          {renderCard('weight', '体重', latestWeight, 'kg', Scale, 'bg-amber-500 text-amber-500')}
          {renderCard('sleep', '睡眠', todaySleep, 'h', Moon, 'bg-indigo-500 text-indigo-500')}
          {renderCard('heartRate', '心率', latestHeartRate, 'bpm', HeartPulse, 'bg-pink-500 text-pink-500')}
          {renderCard('bp', '血压', latestBP, '', Activity, 'bg-red-500 text-red-500')}
          {renderCard('oxygen', '血氧', latestOxygen, '', Wind, 'bg-blue-400 text-blue-400')}
       </div>

       <div className="bear-card p-5 bg-white transition-all duration-300">
          <h3 className="font-bold text-r-main mb-4 flex items-center gap-2">
            记录
            {activeMetric === 'steps' && '行走'}
            {activeMetric === 'weight' && '体重'}
            {activeMetric === 'sleep' && '睡眠'}
            {activeMetric === 'heartRate' && '心率'}
            {activeMetric === 'bp' && '血压'}
            {activeMetric === 'oxygen' && '血氧'}
          </h3>

          <form onSubmit={handleSubmit} className="flex gap-2 items-end mb-6">
            <div className="flex-1 relative">
              <label className="text-xs text-r-sub font-bold ml-1 mb-1 block">{inputConfig.label}</label>
              <div className="relative">
                <input 
                    type={inputConfig.type} step={inputConfig.step} value={inputValue1} onChange={e => setInputValue1(e.target.value)}
                    placeholder={inputConfig.placeholder}
                    className="w-full p-2.5 rounded-xl border border-r-border bg-[#FAFAFA] focus:border-r-primary outline-none pr-10"
                    autoFocus
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                   <VoiceInputButton onTranscript={(val) => setInputValue1(val.replace(/[^0-9.]/g, ''))} simple />
                </div>
              </div>
            </div>
            
            {activeMetric === 'bp' && (
              <div className="flex-1">
                <label className="text-xs text-r-sub font-bold ml-1 mb-1 block">{inputConfig.label2}</label>
                <div className="relative">
                    <input 
                    type="number" value={inputValue2} onChange={e => setInputValue2(e.target.value)}
                    placeholder={inputConfig.placeholder2}
                    className="w-full p-2.5 rounded-xl border border-r-border bg-[#FAFAFA] focus:border-r-primary outline-none pr-10"
                    />
                     <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <VoiceInputButton onTranscript={(val) => setInputValue2(val.replace(/[^0-9.]/g, ''))} simple />
                    </div>
                </div>
              </div>
            )}

            <button type="submit" className="bg-r-main text-white px-4 py-2.5 rounded-xl font-bold hover:opacity-80 transition-colors h-[42px]">保存</button>
          </form>

          <div className="border-t border-r-border pt-4">
             <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {getHistoryList().map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-r-card rounded-lg transition-colors">
                    <span className="text-r-sub">{new Date(item.date).toLocaleDateString()} {item.date.includes('T') ? new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                    <span className="font-bold text-r-main">{item.val}</span>
                  </div>
                ))}
                {getHistoryList().length === 0 && <p className="text-center text-gray-300 text-xs py-4">暂无记录</p>}
             </div>
          </div>
       </div>
    </div>
  );
};

export default HealthView;
