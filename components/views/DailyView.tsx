
import React, { useState, useMemo } from 'react';
import { CheckCircle2, Droplets, Sun, Plus, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { Task, Priority, WaterLog, PlanType, SpecialEvent } from '../../types';
import TaskItem from '../TaskItem';
// @ts-ignore
import { Solar } from 'lunar-javascript';

interface DailyViewProps {
  tasks: Task[];
  waterLog: WaterLog | undefined;
  specialEvents: SpecialEvent[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onAddWater: () => void;
  onOpenPlanModal: () => void;
  onOpenAddTask: (type: PlanType, date: string) => void;
}

const MOTIVATIONAL_QUOTES = [
  "今天也要轻松度过哦。",
  "休息一下也没关系。",
  "按照自己的节奏来就好。",
  "你是最棒的！",
  "记得多喝水，照顾好自己。",
  "今天会有好运气的 ✨",
  "深呼吸，放松心情。",
  "偶尔发呆也是正经事。",
  "慢慢来，比较快。",
  "给生活加一点甜。",
  "又是元气满满的一天！",
  "所有的努力都会有回报。",
  "保持微笑，好运自然来。",
  "只要开始了，就很了不起。",
  "像懒熊一样悠闲地生活吧。",
  "不管发生什么，都要爱自己。"
];

const DailyView: React.FC<DailyViewProps> = ({
  tasks,
  waterLog,
  specialEvents,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onAddWater,
  onOpenPlanModal,
  onOpenAddTask
}) => {
  const [viewMode, setViewMode] = useState<PlanType>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Date Helpers ---
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(date.setDate(diff));
  };

  const getStartOfMonth = (d: Date) => {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };

  const toDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = () => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    if (viewMode === 'daily') {
      return currentDate.toLocaleDateString('zh-CN', { ...options, weekday: 'long' });
    } else if (viewMode === 'weekly') {
      const start = getStartOfWeek(currentDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'daily') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'weekly') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToday = () => setCurrentDate(new Date());

  // --- Filtering Helpers ---
  const sortTasks = (taskList: Task[]) => {
    return taskList.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.priority !== b.priority) {
        const map = { [Priority.HIGH]: 1, [Priority.MEDIUM]: 2, [Priority.LOW]: 3 };
        return map[a.priority] - map[b.priority];
      }
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return 0;
    });
  };

  const cups = waterLog?.cups || 0;
  const isToday = (d: Date) => toDateString(d) === toDateString(new Date());

  const dailyQuote = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const index = (dayOfYear + today.getFullYear()) % MOTIVATIONAL_QUOTES.length;
    return MOTIVATIONAL_QUOTES[index];
  }, []);

  const getLunarDate = (date: Date) => {
    try {
        const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
        const lunar = solar.getLunar();
        return lunar.getDayInChinese();
    } catch (e) {
        return '';
    }
  };

  const getEventIcon = (date: Date) => {
    const dateStr = toDateString(date);
    const monthDay = dateStr.slice(5);
    
    // Strict match for holidays (YYYY-MM-DD), loose match (MM-DD) for others
    const events = specialEvents.filter(e => {
        if (e.type === 'holiday') return e.date === dateStr;
        return e.date.slice(5) === monthDay;
    });
    
    if (events.length === 0) return null;
    const hasBirthday = events.find(e => e.type === 'birthday');
    if (hasBirthday) return '🎂';
    const hasHoliday = events.find(e => e.type === 'holiday');
    if (hasHoliday) {
       const title = hasHoliday.title.toLowerCase();
       if (title.includes('圣诞') || title.includes('christmas')) return '🎅';
       if (title.includes('万圣') || title.includes('halloween')) return '🎃';
       if (title.includes('情人') || title.includes('valentine')) return '🌹';
       if (title.includes('年') || title.includes('new year')) return '🧧';
       return '🎉';
    }
    const hasAnniversary = events.find(e => e.type === 'anniversary');
    if (hasAnniversary) return '❤️';
    return '✨';
  };
  
  // --- Render Functions ---

  const renderDailyContent = () => {
    const targetDateStr = toDateString(currentDate);
    const dayTasks = sortTasks(tasks.filter(t => t.date === targetDateStr && (!t.planType || t.planType === 'daily')));
    const isCurrentDay = isToday(currentDate);

    return (
      <>
        {isCurrentDay && (
          <div className="bear-card bg-r-light p-4 relative overflow-hidden flex items-center justify-between mb-4">
            <div className="relative z-10">
              <h2 className="font-bold text-r-main text-lg">{dailyQuote}</h2>
              <div className="mt-2 flex gap-3">
                 <button onClick={onOpenPlanModal} className="bg-r-main text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:opacity-90 transition-colors flex items-center gap-1">
                   <Sun size={14} /> AI 计划
                 </button>
              </div>
            </div>
            <div className="opacity-10 text-r-main">
                <Sun size={60} />
            </div>
          </div>
        )}

        {isCurrentDay && (
          <div className="bear-card p-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-500">
                <Droplets size={20} />
              </div>
              <div>
                <h3 className="font-bold text-r-main text-sm">饮水记录</h3>
                <p className="text-[10px] text-r-sub">{cups} / 8 杯</p>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                 <button 
                   key={i} 
                   onClick={onAddWater}
                   disabled={i < cups}
                   className={`w-4 h-6 rounded-full border border-blue-200 transition-all ${i < cups ? 'bg-blue-400 scale-110' : 'bg-white hover:bg-blue-50'}`}
                 />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="font-bold text-lg text-r-main">日程清单</h3>
            <button 
              onClick={() => onOpenAddTask('daily', targetDateStr)} 
              className="bg-r-card text-r-main px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-r-primary transition-colors flex items-center gap-1"
            >
               <Plus size={14} /> 添加
            </button>
          </div>

          {dayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-60">
               <div className="w-12 h-12 bg-r-card rounded-full flex items-center justify-center mb-3">
                 <CalendarDays size={20} className="text-r-sub" />
               </div>
               <p className="text-sm text-r-sub font-bold">暂无任务，添加一个吧！</p>
               <button 
                  onClick={() => onOpenAddTask('daily', targetDateStr)}
                  className="mt-3 text-xs bg-white border border-r-border px-4 py-1.5 rounded-full text-r-main shadow-sm hover:bg-r-primary hover:border-r-primary hover:text-white transition-all"
               >
                 + 立即添加
               </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dayTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                  onUpdate={onUpdateTask}
                />
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderWeeklyContent = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div className="space-y-6">
        {weekDays.map((dayDate) => {
          const dateStr = toDateString(dayDate);
          const isTodayDate = isToday(dayDate);
          const dayTasks = sortTasks(tasks.filter(t => t.date === dateStr)); 
          const lunarStr = getLunarDate(dayDate);
          const eventIcon = getEventIcon(dayDate);

          return (
            <div key={dateStr} className={`rounded-2xl border-2 overflow-hidden transition-all ${isTodayDate ? 'border-r-primary bg-white shadow-md' : 'border-transparent bg-r-card/50'}`}>
              <div className={`p-3 flex items-center justify-between ${isTodayDate ? 'bg-r-light' : 'bg-r-card'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isTodayDate ? 'bg-r-main text-white' : 'bg-white text-r-sub'}`}>
                    {dayDate.getDate()}
                  </div>
                  <div>
                    <span className={`text-sm font-bold ${isTodayDate ? 'text-r-main' : 'text-r-sub'}`}>
                      {dayDate.toLocaleDateString('zh-CN', { weekday: 'long' })}
                    </span>
                    <span className="text-xs text-r-sub ml-2 opacity-75">{lunarStr}</span>
                    {isTodayDate && <span className="text-[10px] ml-2 text-r-primary-hover font-bold">今天</span>}
                    {eventIcon && <span className="text-lg ml-2">{eventIcon}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => onOpenAddTask('daily', dateStr)}
                  className="w-8 h-8 rounded-full bg-white text-r-main flex items-center justify-center shadow-sm hover:bg-r-main hover:text-white transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="p-3 min-h-[60px]">
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-r-muted italic ml-1">今天暂无安排...</p>
                ) : (
                  <div className="space-y-2">
                     {dayTasks.map(task => (
                       <TaskItem
                         key={task.id}
                         task={task}
                         onToggle={onToggleTask}
                         onDelete={onDeleteTask}
                         onUpdate={onUpdateTask}
                       />
                     ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthlyContent = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    const gridCells = [];
    for(let i = 0; i < startOffset; i++) gridCells.push(null);
    for(let i = 1; i <= daysInMonth; i++) gridCells.push(new Date(year, month, i));
    const weekDaysLabel = ['一', '二', '三', '四', '五', '六', '日'];

    return (
      <div className="bg-white rounded-2xl border-2 border-r-border p-2 shadow-sm">
        <div className="grid grid-cols-7 mb-2">
           {weekDaysLabel.map(d => (
             <div key={d} className="text-center text-xs font-bold text-r-sub py-2">{d}</div>
           ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
           {gridCells.map((date, idx) => {
             if (!date) return <div key={`empty-${idx}`} className="aspect-square bg-[#FAFAFA] rounded-xl" />;
             const dateStr = toDateString(date);
             const isTodayDate = isToday(date);
             const dayTasks = tasks.filter(t => t.date === dateStr);
             const lunarStr = getLunarDate(date);
             const eventIcon = getEventIcon(date);

             const daysEvents = specialEvents.filter(e => {
                 if (e.type === 'holiday') return e.date === dateStr;
                 return e.date.endsWith(dateStr.slice(5));
             });

             return (
               <div 
                 key={dateStr} 
                 className={`aspect-[3/4] sm:aspect-square rounded-xl border flex flex-col relative group transition-all cursor-pointer
                   ${isTodayDate ? 'border-r-primary bg-r-card' : 'border-slate-100 bg-white hover:border-r-border'}
                 `}
                 onClick={() => onOpenAddTask('daily', dateStr)}
               >
                 {eventIcon && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl opacity-20 pointer-events-none">
                       {eventIcon}
                    </div>
                 )}

                 {daysEvents.length > 0 && (
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-max min-w-[100px] animate-in fade-in zoom-in-95 duration-200">
                      <div className="bg-white/90 backdrop-blur-md text-r-main text-xs rounded-xl p-2 shadow-xl border border-r-border/50 text-left">
                          {daysEvents.map((ev, i) => (
                              <div key={ev.id} className={`flex items-start gap-2 ${i > 0 ? 'mt-2 pt-2 border-t border-r-border/30' : ''}`}>
                                  <span className="text-lg leading-none">{getEventIcon(date)}</span>
                                  <div>
                                     <div className="font-bold">{ev.title}</div>
                                     <div className="text-[10px] text-r-sub opacity-80 border border-r-primary/30 rounded px-1 inline-block mt-0.5">
                                       {ev.type === 'birthday' ? '生日' : ev.type === 'holiday' ? '节日' : ev.type === 'anniversary' ? '纪念日' : '其他'}
                                     </div>
                                  </div>
                              </div>
                          ))}
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white/90 drop-shadow-sm"></div>
                      </div>
                   </div>
                 )}

                 <div className="flex justify-between items-start p-1.5 leading-none relative z-10">
                    <span className={`text-sm font-bold ${isTodayDate ? 'text-r-main' : 'text-slate-600'}`}>{date.getDate()}</span>
                    <span className="text-[9px] text-r-sub opacity-80 scale-90 origin-top-right">{lunarStr}</span>
                 </div>
                 <div className="flex-1 overflow-hidden px-1 pb-1 flex flex-col gap-0.5 relative z-10">
                    {dayTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="text-[8px] truncate bg-white/60 rounded px-0.5 text-r-main border border-transparent hover:border-r-border">
                         <span className={`w-1.5 h-1.5 inline-block rounded-full mr-0.5 ${task.completed ? 'bg-green-400' : 'bg-r-primary'}`}></span>
                         {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[8px] text-center text-r-sub">+{dayTasks.length - 3}</div>
                    )}
                 </div>
                 {eventIcon && dayTasks.length === 0 && (
                     <div className="absolute bottom-1 right-1 text-sm z-10">{eventIcon}</div>
                 )}
               </div>
             )
           })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-r-border">
           <div className="flex justify-between items-center mb-2 px-1">
             <h4 className="font-bold text-r-main text-sm">本月重点目标</h4>
             <button onClick={(e) => { e.stopPropagation(); onOpenAddTask('monthly', toDateString(firstDay)); }} className="text-xs bg-r-card text-r-main px-2 py-1 rounded-lg">
               + 添加
             </button>
           </div>
           <div className="space-y-2">
             {tasks.filter(t => t.planType === 'monthly' && t.date === toDateString(firstDay)).map(task => (
                <TaskItem key={task.id} task={task} onToggle={onToggleTask} onDelete={onDeleteTask} onUpdate={onUpdateTask} />
             ))}
             {tasks.filter(t => t.planType === 'monthly' && t.date === toDateString(firstDay)).length === 0 && (
                <p className="text-xs text-r-muted italic text-center py-2">没有设定的月度大目标</p>
             )}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex bg-r-light p-1 rounded-2xl mx-1 shadow-inner">
        {(['daily', 'weekly', 'monthly'] as PlanType[]).map((mode) => {
           let Label = '日计划';
           let Icon = CalendarDays;
           if (mode === 'weekly') { Label = '周计划'; Icon = CalendarRange; }
           if (mode === 'monthly') { Label = '月计划'; Icon = Calendar; }
           const isActive = viewMode === mode;
           return (
             <button
               key={mode}
               onClick={() => setViewMode(mode)}
               className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-bold transition-all ${
                 isActive ? 'bg-r-main text-white shadow-md' : 'text-r-sub hover:bg-r-primary/20'
               }`}
             >
               <Icon size={16} />
               {Label}
             </button>
           )
        })}
      </div>

      <div className="flex items-center justify-between px-2">
        <button onClick={() => navigateDate('prev')} className="p-2 rounded-full bg-white shadow-sm text-r-main hover:bg-r-card active:scale-95 transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center cursor-pointer" onClick={goToday}>
           <span className="font-bold text-r-main text-lg">{formatDateDisplay()}</span>
           {!isToday(currentDate) && <span className="text-xs text-r-primary-hover font-medium">回到今天</span>}
        </div>
        <button onClick={() => navigateDate('next')} className="p-2 rounded-full bg-white shadow-sm text-r-main hover:bg-r-card active:scale-95 transition-all">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="min-h-[300px]">
        {viewMode === 'daily' && renderDailyContent()}
        {viewMode === 'weekly' && renderWeeklyContent()}
        {viewMode === 'monthly' && renderMonthlyContent()}
      </div>
    </div>
  );
};

export default DailyView;
