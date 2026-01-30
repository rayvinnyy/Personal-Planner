
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Utensils, Plane, Plus, Trash2, Edit2, Image as ImageIcon, X, MapPin, FileSpreadsheet, Download, CalendarHeart, Gift, Cake, PartyPopper, StickyNote, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Restaurant, Trip, SpecialEvent, EventType, Note } from '../../types';
// @ts-ignore
import * as XLSX from 'xlsx';
import VoiceInputButton from '../ui/VoiceInputButton';

interface LifestyleViewProps {
  restaurants: Restaurant[];
  trips: Trip[];
  specialEvents: SpecialEvent[];
  notes: Note[];
  onAddRestaurant: (rest: Omit<Restaurant, 'id'>) => void;
  onUpdateRestaurant: (id: string, updates: Partial<Restaurant>) => void;
  onDeleteRestaurant: (id: string) => void;
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
  onUpdateTrip: (id: string, updates: Partial<Trip>) => void;
  onDeleteTrip: (id: string) => void;
  onAddEvent: (event: Omit<SpecialEvent, 'id'>) => void;
  onUpdateEvent: (id: string, updates: Partial<SpecialEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onAddNote: (note: Omit<Note, 'id'>) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
}

const DEFAULT_CUISINES = ['日本餐', '韩国餐', '西餐', '中餐', 'Cafe', '甜品屋', '泰国餐', '街边小食', '美食广场'];
const DEFAULT_AREAS = ['槟岛', '大山脚', '北海'];

// Expanded Mood List
const MOODS = [
  '🧸', '😊', '🥰', '🤣', '😇', '🙂', 
  '😐', '😢', '😭', '😡', '🤯', '😱', 
  '😴', '🤔', '🥳', '😎', '😷', '🤕', 
  '🌸', '🌧️', '☀️', '⭐', '🎵', '☕', 
  '💪', '🏃', '📚', '💰', '🍦', '🚗'
];

// Sub-component for displaying Excel content
const ItineraryPreview: React.FC<{ fileData: string }> = ({ fileData }) => {
  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Remove data URL prefix if present to handle pure base64
      const base64 = fileData.split(',')[1] || fileData;
      const workbook = XLSX.read(base64, { type: 'base64' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // header: 1 gives array of arrays
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      setData(jsonData);
    } catch (e) {
      console.error("Failed to parse excel", e);
    } finally {
      setLoading(false);
    }
  }, [fileData]);

  if (loading) return <div className="text-center p-4 text-xs text-r-sub flex items-center justify-center gap-2"><div className="animate-spin w-3 h-3 border-2 border-r-primary border-t-transparent rounded-full"></div> 解析行程表中...</div>;
  if (!data || data.length === 0) return <div className="text-center p-4 text-xs text-r-sub">暂无内容解析</div>;

  return (
    <div className="mt-3 bg-white/50 rounded-xl overflow-hidden border border-r-border/50 animate-in slide-in-from-top-2">
       <div className="overflow-x-auto custom-scrollbar pb-2">
         <table className="w-full text-xs text-left min-w-[300px]">
           <tbody>
             {data.slice(0, 100).map((row, rowIndex) => ( // Limit rows for performance
               <tr key={rowIndex} className={rowIndex === 0 ? "bg-r-primary/20 font-bold text-r-main" : "border-t border-r-border/30 hover:bg-white/50 transition-colors"}>
                 {row.map((cell: any, cellIndex: number) => (
                   <td key={cellIndex} className="p-2 whitespace-nowrap text-r-main/80 first:pl-3 last:pr-3">
                     {cell !== null && cell !== undefined ? String(cell) : ''}
                   </td>
                 ))}
               </tr>
             ))}
           </tbody>
         </table>
         {data.length > 100 && (
            <div className="text-center text-[10px] text-r-muted py-2 italic">仅显示前 100 行...</div>
         )}
       </div>
    </div>
  );
};

const LifestyleView: React.FC<LifestyleViewProps> = ({
  restaurants, trips, specialEvents, notes,
  onAddRestaurant, onUpdateRestaurant, onDeleteRestaurant, 
  onAddTrip, onUpdateTrip, onDeleteTrip,
  onAddEvent, onUpdateEvent, onDeleteEvent,
  onAddNote, onUpdateNote, onDeleteNote
}) => {
  const [activeTab, setActiveTab] = useState<'food' | 'travel' | 'events' | 'notes'>('food');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  // Shared Form State
  const [name, setName] = useState(''); // Used for Note Title too
  const [typeOrDest, setTypeOrDest] = useState(''); // Used for Note Content
  const [area, setArea] = useState(''); // Note Mood
  const [dateStart, setDateStart] = useState(''); // Note Date
  const [dateEnd, setDateEnd] = useState('');
  const [eventType, setEventType] = useState<EventType>('birthday');
  
  const [image, setImage] = useState<string | undefined>(undefined);
  const [excelFile, setExcelFile] = useState<string | undefined>(undefined);
  const [excelName, setExcelName] = useState<string | undefined>(undefined);

  const availableCuisines = useMemo(() => Array.from(new Set([...DEFAULT_CUISINES, ...restaurants.map(r => r.type).filter(Boolean)])), [restaurants]);
  const availableAreas = useMemo(() => Array.from(new Set([...DEFAULT_AREAS, ...restaurants.map(r => r.area).filter(Boolean) as string[]])), [restaurants]);

  const resetForm = () => {
    setName(''); setTypeOrDest(''); setArea(''); setDateStart(new Date().toISOString().split('T')[0]); setDateEnd(''); setEventType('birthday');
    setImage(undefined); setExcelFile(undefined); setExcelName(undefined); setEditId(null); setShowForm(false);
  };
  
  const handleTabChange = (tab: 'food' | 'travel' | 'events' | 'notes') => {
    setActiveTab(tab);
    resetForm();
    setExpandedTripId(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };
  
  const openEditRestaurant = (r: Restaurant) => { setActiveTab('food'); setName(r.name); setTypeOrDest(r.type); setArea(r.area || ''); setImage(r.image); setEditId(r.id); setShowForm(true); };
  const openEditTrip = (t: Trip) => { setActiveTab('travel'); setName(t.destination); setTypeOrDest(t.notes || ''); setDateStart(t.startDate); setDateEnd(t.endDate); setImage(t.image); setExcelFile(t.excelItinerary); setExcelName(t.excelName); setEditId(t.id); setShowForm(true); };
  const openEditEvent = (e: SpecialEvent) => { setActiveTab('events'); setName(e.title); setDateStart(e.date); setEventType(e.type); setEditId(e.id); setShowForm(true); };
  const openEditNote = (n: Note) => { setActiveTab('notes'); setName(n.title); setTypeOrDest(n.content); setDateStart(n.date); setArea(n.mood || ''); setEditId(n.id); setShowForm(true); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setImage(reader.result as string); reader.readAsDataURL(file); }
  };
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => { setExcelFile(reader.result as string); setExcelName(file.name); }; reader.readAsDataURL(file); }
  };

  const handleSave = () => {
    if (!name) return;
    if (activeTab === 'food') {
      const restData = { name, type: typeOrDest || '其他', area: area || '', rating: 5, image };
      editId ? onUpdateRestaurant(editId, restData) : onAddRestaurant({ ...restData, notes: '' });
    } else if (activeTab === 'travel') {
      if (!dateStart || !dateEnd) return;
      const tripData = { destination: name, startDate: dateStart, endDate: dateEnd, notes: typeOrDest, image, excelItinerary: excelFile, excelName };
      editId ? onUpdateTrip(editId, tripData) : onAddTrip(tripData);
    } else if (activeTab === 'events') {
      if (!dateStart) return;
      const eventData = { title: name, date: dateStart, type: eventType };
      editId ? onUpdateEvent(editId, eventData) : onAddEvent(eventData);
    } else if (activeTab === 'notes') {
      const noteData = { title: name, content: typeOrDest, date: dateStart, mood: area };
      editId ? onUpdateNote(editId, noteData) : onAddNote(noteData);
    }
    resetForm();
  };

  const getEventIcon = (type: EventType) => {
    switch(type) {
      case 'birthday': return <Cake size={20} className="text-pink-500" />;
      case 'holiday': return <Gift size={20} className="text-red-500" />;
      case 'anniversary': return <CalendarHeart size={20} className="text-purple-500" />;
      default: return <PartyPopper size={20} className="text-orange-500" />;
    }
  };
  const getEventLabel = (type: EventType) => {
    switch(type) {
      case 'birthday': return '生日'; case 'holiday': return '节日'; case 'anniversary': return '纪念日'; default: return '其他';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2">
        <button onClick={() => handleTabChange('food')} className={`flex-1 min-w-[70px] py-2 rounded-xl font-bold transition-colors text-sm ${activeTab === 'food' ? 'bg-r-main text-white shadow-md' : 'bg-white text-r-sub'}`}>探店</button>
        <button onClick={() => handleTabChange('travel')} className={`flex-1 min-w-[70px] py-2 rounded-xl font-bold transition-colors text-sm ${activeTab === 'travel' ? 'bg-r-main text-white shadow-md' : 'bg-white text-r-sub'}`}>旅行</button>
        <button onClick={() => handleTabChange('events')} className={`flex-1 min-w-[70px] py-2 rounded-xl font-bold transition-colors text-sm ${activeTab === 'events' ? 'bg-r-main text-white shadow-md' : 'bg-white text-r-sub'}`}>节日</button>
        <button onClick={() => handleTabChange('notes')} className={`flex-1 min-w-[70px] py-2 rounded-xl font-bold transition-colors text-sm ${activeTab === 'notes' ? 'bg-r-main text-white shadow-md' : 'bg-white text-r-sub'}`}>日记</button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {activeTab === 'food' && restaurants.map(rest => (
          <div key={rest.id} className="bear-card p-4 bg-r-card/90 relative overflow-hidden group">
            {rest.image && <img src={rest.image} alt="food" className="w-full h-32 object-cover rounded-xl mb-3 opacity-90" />}
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-r-border p-2 rounded-full text-r-main"><Utensils size={20}/></div>
                <div>
                  <h4 className="font-bold text-r-main">{rest.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-r-sub bg-white px-1.5 py-0.5 rounded">{rest.type}</span>
                    {rest.area && <span className="text-xs text-r-sub flex items-center gap-0.5"><MapPin size={10} /> {rest.area}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditRestaurant(rest)} className="text-gray-400 hover:text-r-main p-1"><Edit2 size={18}/></button>
                <button onClick={() => onDeleteRestaurant(rest.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={18}/></button>
              </div>
            </div>
          </div>
        ))}

        {activeTab === 'travel' && trips.map(trip => (
          <div key={trip.id} className="bear-card p-4 bg-r-card/90 relative overflow-hidden transition-all duration-300">
            {trip.image && <img src={trip.image} alt="trip" className="w-full h-32 object-cover rounded-xl mb-3 opacity-90" />}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 p-2 rounded-full text-blue-400"><Plane size={20}/></div>
                <h4 className="font-bold text-r-main text-lg">{trip.destination}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditTrip(trip)} className="text-gray-400 hover:text-r-main p-1"><Edit2 size={18}/></button>
                <button onClick={() => onDeleteTrip(trip.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={18}/></button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-r-sub ml-1">
                <span className="bg-r-light px-2 py-1 rounded font-mono">{trip.startDate}</span>
                <span className="text-r-primary">➜</span>
                <span className="bg-r-light px-2 py-1 rounded font-mono">{trip.endDate}</span>
              </div>
              
              {trip.notes && <p className="text-xs text-gray-500 mt-1 ml-1 italic line-clamp-2">{trip.notes}</p>}

              {trip.excelItinerary ? (
                <div className="mt-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setExpandedTripId(expandedTripId === trip.id ? null : trip.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                         expandedTripId === trip.id 
                           ? 'bg-r-primary text-white shadow-inner' 
                           : 'bg-white border border-r-border text-r-main hover:bg-r-light'
                      }`}
                    >
                      {expandedTripId === trip.id ? <ChevronUp size={14} /> : <FileText size={14} />}
                      {expandedTripId === trip.id ? '收起行程' : '查看行程详情'}
                    </button>
                    
                    <a 
                      href={trip.excelItinerary} 
                      download={trip.excelName || '行程表.xlsx'} 
                      className="flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded-lg text-xs border border-green-100 transition-colors"
                      title="下载原始文件"
                    >
                      <Download size={14}/>
                    </a>
                  </div>
                  
                  {expandedTripId === trip.id && (
                    <ItineraryPreview fileData={trip.excelItinerary} />
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-r-muted mt-1 ml-1">暂无行程表</div>
              )}
            </div>
          </div>
        ))}

        {activeTab === 'events' && specialEvents.sort((a,b) => a.date.slice(5).localeCompare(b.date.slice(5))).map(event => (
            <div key={event.id} className="bear-card p-4 bg-r-card/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2.5 rounded-full shadow-sm">{getEventIcon(event.type)}</div>
                <div>
                  <h4 className="font-bold text-r-main">{event.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono bg-r-border text-r-main px-2 py-0.5 rounded">{event.date.slice(5)}</span>
                    <span className="text-xs text-r-sub">{getEventLabel(event.type)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditEvent(event)} className="text-gray-400 hover:text-r-main p-1"><Edit2 size={18}/></button>
                <button onClick={() => onDeleteEvent(event.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={18}/></button>
              </div>
            </div>
          ))
        }

        {activeTab === 'notes' && notes.sort((a, b) => b.date.localeCompare(a.date)).map(note => (
           <div key={note.id} className="bear-card p-4 bg-r-light/90 relative group">
              <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2">
                    {note.mood && <span className="text-xl">{note.mood}</span>}
                    <h4 className="font-bold text-r-main">{note.title}</h4>
                 </div>
                 <div className="flex gap-1">
                    <button onClick={() => openEditNote(note)} className="text-r-sub hover:text-r-main p-1"><Edit2 size={16}/></button>
                    <button onClick={() => onDeleteNote(note.id)} className="text-r-sub hover:text-red-500 p-1"><Trash2 size={16}/></button>
                 </div>
              </div>
              <p className="text-sm text-r-main whitespace-pre-wrap leading-relaxed">{note.content}</p>
              <div className="mt-3 text-[10px] text-r-sub text-right">{new Date(note.date).toLocaleDateString()}</div>
              
              {/* Sticker Decor */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-black/5 rotate-12 pointer-events-none"></div>
           </div>
        ))}
      </div>

      {showForm ? (
        <div className="bear-card p-4 animate-in slide-in-from-bottom-5 bg-r-card/95 backdrop-blur-sm border-2 border-r-border shadow-xl">
           <h3 className="font-bold text-r-main mb-3">{editId ? '编辑' : '添加'} {activeTab === 'food' ? '探店' : activeTab === 'travel' ? '旅行' : activeTab === 'events' ? '节日' : '日记'}</h3>
           
           {(activeTab === 'food' || activeTab === 'travel') && (
             <div className="mb-3">
               {image ? (
                 <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-r-border">
                   <img src={image} className="w-full h-full object-cover" />
                   <button onClick={() => setImage(undefined)} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md text-red-500"><X size={16}/></button>
                 </div>
               ) : (
                 <div onClick={() => fileInputRef.current?.click()} className="w-full h-20 border-2 border-dashed border-r-border rounded-lg flex flex-col items-center justify-center text-r-sub cursor-pointer hover:bg-white transition-colors">
                   <ImageIcon size={20} /><span className="text-xs mt-1">添加封面图片</span>
                 </div>
               )}
               <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
             </div>
           )}

           <div className="mb-2 flex items-center gap-2">
              <input 
                className="flex-1 p-2 rounded-xl border border-r-border bg-white outline-none focus:border-r-primary text-r-main font-bold" 
                placeholder={activeTab === 'food' ? "餐厅名称" : activeTab === 'travel' ? "目的地" : activeTab === 'events' ? "节日/生日名称" : "标题 (如: 今天的心情)"} 
                value={name} onChange={e => setName(e.target.value)} 
              />
              <VoiceInputButton onTranscript={setName} simple />
           </div>

           {activeTab === 'food' && (
             <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <input list="cuisine-options" className="w-full p-2 rounded-xl border border-r-border bg-white outline-none focus:border-r-primary text-r-main pr-8" placeholder="菜系" value={typeOrDest} onChange={e => setTypeOrDest(e.target.value)} />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <VoiceInputButton onTranscript={setTypeOrDest} simple />
                  </div>
                  <datalist id="cuisine-options">{availableCuisines.map(type => <option key={type} value={type} />)}</datalist>
                </div>
                <div className="flex-1 relative">
                  <input list="area-options" className="w-full p-2 rounded-xl border border-r-border bg-white outline-none focus:border-r-primary text-r-main pr-8" placeholder="区域" value={area} onChange={e => setArea(e.target.value)} />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <VoiceInputButton onTranscript={setArea} simple />
                  </div>
                  <datalist id="area-options">{availableAreas.map(a => <option key={a} value={a} />)}</datalist>
                </div>
             </div>
           )}

           {activeTab === 'travel' && (
             <>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div><label className="text-xs font-bold text-r-sub mb-1 block pl-1">开始日期</label><input type="date" className="w-full p-2 rounded-xl border border-r-border bg-white outline-none text-r-main" value={dateStart} onChange={e => setDateStart(e.target.value)} /></div>
                  <div><label className="text-xs font-bold text-r-sub mb-1 block pl-1">结束日期</label><input type="date" className="w-full p-2 rounded-xl border border-r-border bg-white outline-none text-r-main" value={dateEnd} onChange={e => setDateEnd(e.target.value)} /></div>
                </div>
                <div className="mb-2">
                   <div onClick={() => excelInputRef.current?.click()} className={`w-full p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${excelName ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-r-border text-r-sub hover:bg-r-light'}`}>
                     <FileSpreadsheet size={18} /><span className="text-xs truncate">{excelName || "上传 Excel 行程表 (可选)"}</span>
                     {excelName && <X size={14} className="ml-auto" onClick={(e) => { e.stopPropagation(); setExcelFile(undefined); setExcelName(undefined); if (excelInputRef.current) excelInputRef.current.value = ''; }} />}
                   </div>
                   <input ref={excelInputRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleExcelUpload} />
                </div>
                <div className="relative">
                    <textarea className="w-full mb-2 p-2 rounded-xl border border-r-border text-sm bg-white outline-none pr-8" placeholder="备注..." value={typeOrDest} onChange={e => setTypeOrDest(e.target.value)} />
                    <div className="absolute right-2 bottom-4">
                        <VoiceInputButton onTranscript={(txt) => setTypeOrDest(prev => prev ? prev + ' ' + txt : txt)} simple />
                    </div>
                </div>
             </>
           )}

           {activeTab === 'events' && (
             <div className="flex gap-2 mb-2">
                <div className="flex-1">
                   <label className="text-xs font-bold text-r-sub mb-1 block pl-1">日期</label>
                   <input type="date" className="w-full p-2 rounded-xl border border-r-border bg-white outline-none text-r-main" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                </div>
                <div className="flex-1">
                   <label className="text-xs font-bold text-r-sub mb-1 block pl-1">类型</label>
                   <select className="w-full p-2 rounded-xl border border-r-border bg-white outline-none text-r-main" value={eventType} onChange={e => setEventType(e.target.value as EventType)}>
                      <option value="birthday">生日</option><option value="holiday">节日</option><option value="anniversary">纪念日</option><option value="other">其他</option>
                   </select>
                </div>
             </div>
           )}

           {activeTab === 'notes' && (
              <>
                 <div className="flex gap-2 mb-2">
                     <div className="flex-1">
                        <label className="text-xs font-bold text-r-sub mb-1 block pl-1">日期</label>
                        <input type="date" className="w-full p-2 rounded-xl border border-r-border bg-white outline-none text-r-main" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                     </div>
                     <div className="flex-1">
                        <label className="text-xs font-bold text-r-sub mb-1 block pl-1">今日心情</label>
                        <select className="w-full p-2 rounded-xl border border-r-border bg-white outline-none text-xl" value={area} onChange={e => setArea(e.target.value)}>
                            <option value="">--</option>
                            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                     </div>
                 </div>
                 <div className="relative">
                    <textarea 
                        className="w-full mb-2 p-2 rounded-xl border border-r-border text-sm bg-white outline-none min-h-[100px] pr-8" 
                        placeholder="写点什么..." 
                        value={typeOrDest} 
                        onChange={e => setTypeOrDest(e.target.value)} 
                    />
                    <div className="absolute right-2 bottom-4">
                         <VoiceInputButton onTranscript={(txt) => setTypeOrDest(prev => prev ? prev + '\n' + txt : txt)} simple />
                    </div>
                 </div>
              </>
           )}

           <div className="flex gap-2 justify-end">
             <button onClick={resetForm} className="text-r-sub text-sm px-3">取消</button>
             <button onClick={handleSave} className="bg-r-main text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:opacity-80">保存</button>
           </div>
        </div>
      ) : (
        <button onClick={openAdd} className="w-full py-3 bg-white/50 backdrop-blur-sm border-2 border-r-primary/50 text-r-main rounded-2xl flex items-center justify-center gap-2 font-bold shadow-sm hover:bg-r-primary hover:text-r-main transition-all duration-300 group">
          <div className="bg-r-primary text-r-main p-1 rounded-full group-hover:bg-white group-hover:text-r-primary transition-colors">
            <Plus size={16} strokeWidth={3} />
          </div>
          添加
        </button>
      )}
    </div>
  );
};

export default LifestyleView;
