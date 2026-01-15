import React, { useState } from 'react';
import { Check, Clock, ChevronDown, ChevronUp, Trash2, Plus, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { Task, Priority, SubTask } from '../types';
import { suggestSubtasks } from '../services/geminiService';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const priorityColor = {
    [Priority.HIGH]: 'bg-red-100 text-red-700 border-red-200',
    [Priority.MEDIUM]: 'bg-amber-100 text-amber-700 border-amber-200',
    [Priority.LOW]: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const priorityLabel = {
    [Priority.HIGH]: '高',
    [Priority.MEDIUM]: '中',
    [Priority.LOW]: '低',
  };

  const handleAiBreakdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.subtasks.length > 0) {
      setIsExpanded(true);
      return;
    }

    setIsSuggesting(true);
    setIsExpanded(true);
    try {
      const suggestions = await suggestSubtasks(task.title);
      const newSubtasks: SubTask[] = suggestions.map(title => ({
        id: Math.random().toString(36).substr(2, 9),
        title,
        completed: false
      }));
      onUpdate({ ...task, subtasks: newSubtasks });
    } catch (err) {
      console.error("Failed to suggest subtasks", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  return (
    <div className={`group rounded-xl border-2 transition-all duration-200 hover:shadow-md ${task.completed ? 'border-slate-100 bg-slate-50' : 'border-r-border bg-r-card'}`}>
      <div className="p-4 flex items-start gap-3">
        <button
          onClick={() => onToggle(task.id)}
          className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5 ${
            task.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-r-primary hover:border-r-main text-transparent'
          }`}
        >
          <Check size={14} strokeWidth={3} />
        </button>

        <div className="flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex justify-between items-start gap-2">
            <h3 className={`font-medium text-base truncate pr-2 ${task.completed ? 'text-slate-400 line-through' : 'text-r-main'}`}>
              {task.title}
            </h3>
            {task.time && (
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md shrink-0 ${task.completed ? 'text-slate-400 bg-slate-100' : 'text-r-main bg-r-light'}`}>
                <Clock size={12} />
                {task.time}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${priorityColor[task.priority]} ${task.completed ? 'opacity-50' : ''}`}>
              {priorityLabel[task.priority]}
            </span>
            
            {task.category && (
              <span className="text-xs text-r-sub bg-white/50 px-1.5 py-0.5 rounded">
                {task.category}
              </span>
            )}
            
            {(task.description || task.subtasks.length > 0) && (
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                 className="text-r-sub hover:text-r-main transition-colors"
               >
                 {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
               </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
           <button 
             onClick={() => onDelete(task.id)}
             className="text-r-sub hover:text-red-500 p-1 rounded hover:bg-red-50"
             title="删除任务"
           >
             <Trash2 size={16} />
           </button>
           {!task.completed && (
             <button 
                onClick={handleAiBreakdown}
                className="text-r-sub hover:text-indigo-500 p-1 rounded hover:bg-indigo-50"
                title="AI 拆解"
             >
               <Zap size={16} />
             </button>
           )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 pl-12 animate-in slide-in-from-top-2 duration-200">
          {task.description && (
            <p className="text-sm text-r-sub mb-3">{task.description}</p>
          )}

          <div className="space-y-2">
            {task.subtasks.map(st => (
              <div key={st.id} className="flex items-center gap-2 text-sm text-r-main">
                <button 
                  onClick={() => toggleSubtask(st.id)}
                  className={`w-4 h-4 rounded border flex items-center justify-center ${st.completed ? 'bg-r-main border-r-main text-white' : 'border-r-primary'}`}
                >
                  {st.completed && <Check size={10} />}
                </button>
                <span className={st.completed ? 'line-through text-slate-400' : ''}>{st.title}</span>
              </div>
            ))}
            
            {isSuggesting && (
              <div className="flex items-center gap-2 text-sm text-r-sub animate-pulse">
                <Loader2 size={14} className="animate-spin" />
                <span>生成步骤中...</span>
              </div>
            )}
            
            {!isSuggesting && !task.completed && (
                <button 
                  onClick={handleAiBreakdown}
                  className="text-xs text-r-sub font-medium hover:underline flex items-center gap-1 mt-2"
                >
                  <Plus size={12} />
                  {task.subtasks.length === 0 ? "使用 AI 拆解任务" : "添加更多"}
                </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;