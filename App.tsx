
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Priority, AppData, PlanType, ThemeType, Checklist } from './types';
import { saveData, loadData, DEFAULT_DATA, saveStoredApiKey } from './services/storageService';
import { analyzeHealthData } from './services/geminiService';
import Modal from './components/ui/Modal';
import PlanGenerator from './components/PlanGenerator';
import NavBar from './components/NavBar';
import DailyView from './components/views/DailyView';
import HealthView from './components/views/HealthView';
import WalletView from './components/views/WalletView';
import LifestyleView from './components/views/LifestyleView';
import SettingsView from './components/views/SettingsView';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState('daily');
  
  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  
  // New Task State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskPlanType, setNewTaskPlanType] = useState<PlanType>('daily');
  const [newTaskDate, setNewTaskDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Apply Theme to Body
  useEffect(() => {
    const themeClass = `theme-${data.theme || 'original'}`;
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
    document.body.classList.add(themeClass);
    // Add default tailwind classes that rely on vars
    document.body.classList.add('bg-r-base', 'text-r-main');
  }, [data.theme]);

  // Persistence
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // Don't auto-request, let user do it in settings to avoid annoyance
    }
  }, []);

  // Reminder Logic
  const lastCheckedMinute = useRef<string>("");

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentMinute = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      
      // Prevent multiple notifications in the same minute
      if (currentMinute === lastCheckedMinute.current) return;
      lastCheckedMinute.current = currentMinute;

      const currentMonthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const currentDate = now.toISOString().split('T')[0];

      // 1. Task Reminders
      data.tasks.forEach(task => {
        const isDaily = !task.planType || task.planType === 'daily';
        if (isDaily && !task.completed && task.date === currentDate && task.time === currentMinute) {
          if (Notification.permission === "granted") {
             new Notification(`懒熊提醒: ${task.title}`, {
               body: task.description || "该放松一下，做这个任务啦！",
               icon: '/vite.svg'
             });
          }
        }
      });

      // 2. Event Reminders (Check at 09:00 AM)
      if (currentMinute === '09:00') {
         data.specialEvents.forEach(event => {
            const eventMonthDay = event.date.slice(5); 
            if (eventMonthDay === currentMonthDay) {
               let bodyText = "今天是特殊的日子哦！";
               if (event.type === 'birthday') bodyText = "祝生日快乐！记得吃蛋糕！🎂";
               if (event.type === 'holiday') bodyText = "节日快乐！好好庆祝一下吧！🎉";
               
               if (Notification.permission === "granted") {
                 new Notification(`✨ ${event.title}`, {
                   body: bodyText,
                   icon: '/vite.svg'
                 });
               }
            }
         });
      }
    };

    // Check every 5 seconds to ensure we hit the minute change promptly
    const interval = setInterval(checkReminders, 5000); 
    
    // Initial check
    checkReminders();

    return () => clearInterval(interval);
  }, [data.tasks, data.specialEvents]);

  // --- Handlers ---
  const updateData = (updates: Partial<AppData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateData({ backgroundImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };
  const resetBackground = () => updateData({ backgroundImage: undefined });

  // Data Import / Export
  const handleExportData = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `rilakkuma_life_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          // Basic validation to check if it looks like AppData
          if (importedData && Array.isArray(importedData.tasks)) {
             if (window.confirm("确定要导入此备份吗？当前数据将被覆盖。")) {
                setData({ ...loadData(), ...importedData }); // Merge to ensure new fields are present
                alert("数据恢复成功！");
             }
          } else {
             alert("无效的备份文件。");
          }
        } catch (error) {
          console.error("Import error", error);
          alert("导入失败，文件格式错误。");
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  const handleResetData = () => {
    if (window.confirm("确定要重置所有数据吗？此操作将清空所有记录且无法撤销！")) {
      if (window.confirm("再次确认：真的要删除所有任务、健康记录和设置吗？")) {
        setData(DEFAULT_DATA);
        localStorage.removeItem('rilakkuma_life_v1');
        alert("数据已重置为初始状态。");
      }
    }
  };

  // Notification Handlers for Settings
  const handleRequestNotification = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("通知已开启", { body: "懒熊会准时提醒你哦！", icon: '/vite.svg' });
        }
      });
    } else {
      alert("你的浏览器不支持通知功能。");
    }
  };

  const handleTestNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("测试提醒", { body: "这是一个测试通知！", icon: '/vite.svg' });
    } else {
      alert("请先开启通知权限。");
    }
  };

  const handleSaveApiKey = (key: string) => {
    saveStoredApiKey(key);
  };

  // Task Handlers
  const handleTaskToggle = (id: string) => updateData({ tasks: data.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) });
  const handleTaskDelete = (id: string) => updateData({ tasks: data.tasks.filter(t => t.id !== id) });
  const handleTaskUpdate = (updatedTask: Task) => updateData({ tasks: data.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) });
  const handlePlanGenerated = (newTasks: Task[]) => {
    const tasksWithType = newTasks.map(t => ({ ...t, planType: 'daily' as PlanType }));
    updateData({ tasks: [...data.tasks, ...tasksWithType] });
  };
  
  const openAddTaskModal = (type: PlanType, date: string) => {
    setNewTaskPlanType(type);
    setNewTaskDate(date);
    setNewTaskTitle('');
    setNewTaskTime('');
    setNewTaskPriority(Priority.MEDIUM);
    setIsAddTaskModalOpen(true);
  };

  const handleManualAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      date: newTaskDate,
      time: newTaskTime || undefined,
      priority: newTaskPriority,
      completed: false,
      subtasks: [],
      planType: newTaskPlanType
    };
    updateData({ tasks: [...data.tasks, task] });
    setNewTaskTitle('');
    setNewTaskTime('');
    setIsAddTaskModalOpen(false);
  };

  // Metric Handlers
  const handleAddWater = () => {
    const today = new Date().toISOString().split('T')[0];
    const existingLog = data.waterLogs.find(l => l.date === today);
    const newLogs = existingLog ? data.waterLogs.map(l => l.date === today ? { ...l, cups: Math.min(l.cups + 1, 8) } : l) : [...data.waterLogs, { date: today, cups: 1 }];
    updateData({ waterLogs: newLogs });
  };
  const handleAddWeight = (weight: number) => updateData({ weightHistory: [{ id: Date.now().toString(), date: new Date().toISOString(), weight }, ...data.weightHistory] });
  const handleAddSteps = (steps: number) => {
    const today = new Date().toISOString().split('T')[0];
    const existingLog = data.stepLogs.find(l => l.date === today);
    const newLogs = existingLog ? data.stepLogs.map(l => l.date === today ? { ...l, steps } : l) : [...data.stepLogs, { date: today, steps }];
    updateData({ stepLogs: newLogs });
  };
  const handleAddSleep = (hours: number) => {
    const today = new Date().toISOString().split('T')[0];
    const existingLog = data.sleepLogs.find(l => l.date === today);
    const newLogs = existingLog ? data.sleepLogs.map(l => l.date === today ? { ...l, hours } : l) : [...(data.sleepLogs || []), { id: Date.now().toString(), date: today, hours }];
    updateData({ sleepLogs: newLogs });
  };
  const handleAddBP = (systolic: number, diastolic: number) => updateData({ bpLogs: [{ id: Date.now().toString(), date: new Date().toISOString().split('T')[0], systolic, diastolic }, ...(data.bpLogs || [])] });
  const handleAddOxygen = (percentage: number) => updateData({ oxygenLogs: [{ id: Date.now().toString(), date: new Date().toISOString().split('T')[0], percentage }, ...(data.oxygenLogs || [])] });
  const handleAddHeartRate = (bpm: number) => updateData({ heartRateLogs: [{ id: Date.now().toString(), date: new Date().toISOString(), bpm }, ...(data.heartRateLogs || [])] });

  const handleAnalyzeHealth = async () => {
    const analysis = await analyzeHealthData(data);
    updateData({ healthAnalysis: analysis });
  };

  // Wallet/Life Handlers
  const handleAddBill = (bill: any) => updateData({ bills: [...data.bills, { ...bill, id: Date.now().toString(), paid: false }] });
  const handleUpdateBill = (id: string, updates: any) => updateData({ bills: data.bills.map(b => b.id === id ? { ...b, ...updates } : b) });
  const handlePayBill = (id: string) => updateData({ bills: data.bills.map(b => b.id === id ? { ...b, paid: true } : b) });
  const handleDeleteBill = (id: string) => updateData({ bills: data.bills.filter(b => b.id !== id) });
  const handleAddCoupon = (coupon: any) => updateData({ coupons: [...data.coupons, { ...coupon, id: Date.now().toString(), used: false }] });
  const handleUpdateCoupon = (id: string, updates: any) => updateData({ coupons: data.coupons.map(c => c.id === id ? { ...c, ...updates } : c) });
  const handleUseCoupon = (id: string) => updateData({ coupons: data.coupons.map(c => c.id === id ? { ...c, used: true } : c) });
  const handleDeleteCoupon = (id: string) => updateData({ coupons: data.coupons.filter(c => c.id !== id) });
  
  // Checklist Handlers
  const handleAddChecklist = (checklist: any) => updateData({ checklists: [...(data.checklists || []), { ...checklist, id: Date.now().toString(), items: [] }] });
  const handleUpdateChecklist = (id: string, updates: any) => updateData({ checklists: (data.checklists || []).map(c => c.id === id ? { ...c, ...updates } : c) });
  const handleDeleteChecklist = (id: string) => updateData({ checklists: (data.checklists || []).filter(c => c.id !== id) });

  const handleAddRestaurant = (restaurant: any) => updateData({ restaurants: [...data.restaurants, { ...restaurant, id: Date.now().toString() }] });
  const handleUpdateRestaurant = (id: string, updates: any) => updateData({ restaurants: data.restaurants.map(r => r.id === id ? { ...r, ...updates } : r) });
  const handleDeleteRestaurant = (id: string) => updateData({ restaurants: data.restaurants.filter(r => r.id !== id) });
  const handleAddTrip = (trip: any) => updateData({ trips: [...data.trips, { ...trip, id: Date.now().toString() }] });
  const handleUpdateTrip = (id: string, updates: any) => updateData({ trips: data.trips.map(t => t.id === id ? { ...t, ...updates } : t) });
  const handleDeleteTrip = (id: string) => updateData({ trips: data.trips.filter(t => t.id !== id) });
  const handleAddEvent = (event: any) => updateData({ specialEvents: [...(data.specialEvents || []), { ...event, id: Date.now().toString() }] });
  const handleUpdateEvent = (id: string, updates: any) => updateData({ specialEvents: (data.specialEvents || []).map(e => e.id === id ? { ...e, ...updates } : e) });
  const handleDeleteEvent = (id: string) => updateData({ specialEvents: (data.specialEvents || []).filter(e => e.id !== id) });

  // Notes Handler
  const handleAddNote = (note: any) => updateData({ notes: [...(data.notes || []), { ...note, id: Date.now().toString() }] });
  const handleUpdateNote = (id: string, updates: any) => updateData({ notes: (data.notes || []).map(n => n.id === id ? { ...n, ...updates } : n) });
  const handleDeleteNote = (id: string) => updateData({ notes: (data.notes || []).filter(n => n.id !== id) });

  const TIME_SLOTS = useMemo(() => Array.from({ length: 48 }, (_, i) => `${Math.floor(i / 2).toString().padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`), []);

  // Theme Colors for SVG generation
  // Defined to match Rilakkuma's real look better while supporting themes
  const getThemePalette = (theme: ThemeType) => {
    switch (theme) {
      case 'pink': return { stroke: '#F48FB1', fill: '#FCE4EC', ear: '#F8BBD0', feature: '#880E4F' };
      case 'purple': return { stroke: '#CE93D8', fill: '#F3E5F5', ear: '#E1BEE7', feature: '#4A148C' };
      case 'blue': return { stroke: '#90CAF9', fill: '#E3F2FD', ear: '#BBDEFB', feature: '#0D47A1' };
      case 'green': return { stroke: '#A5D6A7', fill: '#E8F5E9', ear: '#C8E6C9', feature: '#1B5E20' };
      case 'yellow': return { stroke: '#FFE082', fill: '#FFFDE7', ear: '#FFF59D', feature: '#F57F17' };
      case 'original':
      default: 
        // More realistic Rilakkuma colors (Brown/Yellow)
        return { stroke: '#8D6E63', fill: '#D7CCC8', ear: '#FDD835', feature: '#3E2723' };
    }
  };

  const palette = getThemePalette(data.theme || 'original');

  // Encoded SVG with dynamic color
  // Improved Rilakkuma face with hands on cheeks based on user image
  const bgSvg = encodeURIComponent(`
    <svg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'>
       <g opacity="0.12"> <!-- Low opacity for background pattern -->
         
         <!-- Left Ear -->
         <circle cx="40" cy="45" r="15" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="4" />
         <circle cx="40" cy="45" r="10" fill="${palette.ear}" /> <!-- Yellow Inner -->

         <!-- Right Ear -->
         <circle cx="120" cy="45" r="15" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="4" />
         <circle cx="120" cy="45" r="10" fill="${palette.ear}" /> <!-- Yellow Inner -->

         <!-- Head Shape (Squircle-ish) -->
         <path d="M 45 60 H 115 C 135 60 140 80 140 100 C 140 125 120 135 80 135 C 40 135 20 125 20 100 C 20 80 25 60 45 60 Z" 
               fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="4" />

         <!-- Hands on Cheeks (Cute pose) -->
         <ellipse cx="25" cy="115" rx="12" ry="14" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="3" transform="rotate(-20 25 115)" />
         <ellipse cx="135" cy="115" rx="12" ry="14" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="3" transform="rotate(20 135 115)" />

         <!-- Snout (White Oval) -->
         <ellipse cx="80" cy="105" rx="22" ry="16" fill="white" />

         <!-- Eyes (Black dots, wide set) -->
         <circle cx="60" cy="92" r="4.5" fill="${palette.feature}" />
         <circle cx="100" cy="92" r="4.5" fill="${palette.feature}" />

         <!-- Nose (Black rounded triangle/oval) -->
         <path d="M 77 99 L 83 99 L 80 104 Z" fill="${palette.feature}" stroke="${palette.feature}" stroke-width="2" stroke-linejoin="round" />

         <!-- Mouth (Inverted Y / Human char) -->
         <path d="M 80 104 L 76 114 M 80 104 L 84 114" stroke="${palette.feature}" stroke-width="2.5" stroke-linecap="round" fill="none" />
         
       </g>
    </svg>
  `.replace(/\s+/g, ' ').trim());

  const bgStyle = data.backgroundImage 
    ? { backgroundImage: `url(${data.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundImage: `url("data:image/svg+xml,${bgSvg}")`, backgroundRepeat: 'repeat', backgroundSize: '160px 160px' };

  return (
    <div className="flex flex-col h-full relative max-w-lg mx-auto w-full shadow-2xl transition-all duration-500 bg-r-base" style={bgStyle}>
      {data.backgroundImage && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-0"></div>}

      <main className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide z-10 relative">
        {activeTab === 'daily' && (
          <DailyView 
            tasks={data.tasks}
            specialEvents={data.specialEvents || []}
            waterLog={data.waterLogs.find(l => l.date === new Date().toISOString().split('T')[0])}
            onToggleTask={handleTaskToggle}
            onDeleteTask={handleTaskDelete}
            onUpdateTask={handleTaskUpdate}
            onAddWater={handleAddWater}
            onOpenPlanModal={() => setIsPlanModalOpen(true)}
            onOpenAddTask={openAddTaskModal}
          />
        )}
        {activeTab === 'health' && (
          <HealthView 
            weightHistory={data.weightHistory}
            stepLogs={data.stepLogs}
            bpLogs={data.bpLogs || []}
            oxygenLogs={data.oxygenLogs || []}
            heartRateLogs={data.heartRateLogs || []}
            sleepLogs={data.sleepLogs || []}
            healthAnalysis={data.healthAnalysis}
            onAddWeight={handleAddWeight}
            onAddSteps={handleAddSteps}
            onAddBP={handleAddBP}
            onAddOxygen={handleAddOxygen}
            onAddHeartRate={handleAddHeartRate}
            onAddSleep={handleAddSleep}
            onAnalyzeHealth={handleAnalyzeHealth}
          />
        )}
        {activeTab === 'wallet' && (
          <WalletView 
            bills={data.bills}
            coupons={data.coupons}
            checklists={data.checklists || []}
            onAddBill={handleAddBill}
            onUpdateBill={handleUpdateBill}
            onPayBill={handlePayBill}
            onDeleteBill={handleDeleteBill}
            onAddCoupon={handleAddCoupon}
            onUpdateCoupon={handleUpdateCoupon}
            onUseCoupon={handleUseCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            onAddChecklist={handleAddChecklist}
            onUpdateChecklist={handleUpdateChecklist}
            onDeleteChecklist={handleDeleteChecklist}
          />
        )}
        {activeTab === 'life' && (
          <LifestyleView 
            restaurants={data.restaurants}
            trips={data.trips}
            specialEvents={data.specialEvents || []}
            notes={data.notes || []}
            onAddRestaurant={handleAddRestaurant}
            onUpdateRestaurant={handleUpdateRestaurant}
            onDeleteRestaurant={handleDeleteRestaurant}
            onAddTrip={handleAddTrip}
            onUpdateTrip={handleUpdateTrip}
            onDeleteTrip={handleDeleteTrip}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsView
            currentTheme={data.theme || 'original'}
            onThemeChange={(theme) => updateData({ theme })}
            hasBackgroundImage={!!data.backgroundImage}
            onBackgroundUpload={handleBackgroundUpload}
            onResetBackground={resetBackground}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
            onRequestNotification={handleRequestNotification}
            onTestNotification={handleTestNotification}
            onSaveApiKey={handleSaveApiKey}
          />
        )}
      </main>

      <div className="z-20 relative">
        <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title="懒熊计划助手">
        <PlanGenerator currentDate={newTaskDate} onPlanGenerated={handlePlanGenerated} onClose={() => setIsPlanModalOpen(false)} />
      </Modal>

      <Modal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} title={newTaskPlanType === 'weekly' ? '新建周目标' : newTaskPlanType === 'monthly' ? '新建月目标' : '新建任务'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-r-main mb-1">
               {newTaskPlanType === 'daily' ? '任务名称' : '目标内容'}
            </label>
            <input 
              type="text" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full p-3 rounded-xl border border-r-border focus:border-r-primary outline-none bg-r-card text-r-main"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {newTaskPlanType === 'daily' && (
              <div>
                 <label className="block text-sm font-bold text-r-main mb-1">时间</label>
                 <select 
                   value={newTaskTime} 
                   onChange={(e) => setNewTaskTime(e.target.value)} 
                   className="w-full p-3 rounded-xl border border-r-border focus:border-r-primary outline-none bg-r-card text-r-main appearance-none"
                 >
                   <option value="">-- 全天 --</option>
                   {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
              </div>
            )}
            <div className={newTaskPlanType !== 'daily' ? 'col-span-2' : ''}>
               <label className="block text-sm font-bold text-r-main mb-1">优先级</label>
               <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as Priority)} className="w-full p-3 rounded-xl border border-r-border focus:border-r-primary outline-none bg-r-card text-r-main">
                 <option value={Priority.HIGH}>高</option>
                 <option value={Priority.MEDIUM}>中</option>
                 <option value={Priority.LOW}>低</option>
               </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
             <button onClick={() => setIsAddTaskModalOpen(false)} className="px-4 py-2 text-r-sub font-bold">取消</button>
             <button onClick={handleManualAddTask} disabled={!newTaskTitle.trim()} className="px-6 py-2 bg-r-primary text-r-main font-bold rounded-xl shadow-md hover:opacity-80">添加</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
