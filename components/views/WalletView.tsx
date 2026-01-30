import React, { useState } from 'react';
import { Receipt, Ticket, Plus, Trash2, CheckCircle, Edit2, ListChecks, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Bill, Coupon, Checklist, ChecklistItem } from '../../types';
import VoiceInputButton from '../ui/VoiceInputButton';

interface WalletViewProps {
  bills: Bill[];
  coupons: Coupon[];
  checklists: Checklist[];
  onAddBill: (bill: Omit<Bill, 'id' | 'paid'>) => void;
  onUpdateBill: (id: string, updates: Partial<Bill>) => void;
  onPayBill: (id: string) => void;
  onDeleteBill: (id: string) => void;
  onAddCoupon: (coupon: Omit<Coupon, 'id' | 'used'>) => void;
  onUpdateCoupon: (id: string, updates: Partial<Coupon>) => void;
  onUseCoupon: (id: string) => void;
  onDeleteCoupon: (id: string) => void;
  onAddChecklist: (checklist: Omit<Checklist, 'id' | 'items'>) => void;
  onUpdateChecklist: (id: string, updates: Partial<Checklist>) => void;
  onDeleteChecklist: (id: string) => void;
  onReorderChecklists: (checklists: Checklist[]) => void;
}

const WalletView: React.FC<WalletViewProps> = ({ 
  bills, coupons, checklists,
  onAddBill, onUpdateBill, onPayBill, onDeleteBill, 
  onAddCoupon, onUpdateCoupon, onUseCoupon, onDeleteCoupon,
  onAddChecklist, onUpdateChecklist, onDeleteChecklist,
  onReorderChecklists
}) => {
  const [activeTab, setActiveTab] = useState<'bills' | 'coupons' | 'checklists'>('bills');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [amountOrCode, setAmountOrCode] = useState('');
  const [date, setDate] = useState('');
  
  // Checklist internal state for new items
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  
  // Checklist Item Editing State
  const [editingItem, setEditingItem] = useState<{ listId: string, itemId: string } | null>(null);
  const [editingText, setEditingText] = useState('');

  const resetForm = () => {
    setTitle(''); setAmountOrCode(''); setDate(''); setEditId(null); setShowForm(false);
  };
  const openAdd = () => { resetForm(); setShowForm(true); };
  const openEditBill = (b: Bill) => { setActiveTab('bills'); setTitle(b.title); setAmountOrCode(b.amount.toString()); setDate(b.dueDate); setEditId(b.id); setShowForm(true); };
  const openEditCoupon = (c: Coupon) => { setActiveTab('coupons'); setTitle(c.title); setAmountOrCode(c.code || ''); setDate(c.expiryDate); setEditId(c.id); setShowForm(true); };
  const openEditChecklist = (l: Checklist) => { setActiveTab('checklists'); setTitle(l.title); setEditId(l.id); setShowForm(true); };

  const handleSave = () => {
    if (!title) return;

    if (activeTab === 'bills') {
      const billData = { title, amount: parseFloat(amountOrCode) || 0, dueDate: date };
      editId ? onUpdateBill(editId, billData) : onAddBill(billData);
    } else if (activeTab === 'coupons') {
      const couponData = { title, expiryDate: date, code: amountOrCode };
      editId ? onUpdateCoupon(editId, couponData) : onAddCoupon(couponData);
    } else if (activeTab === 'checklists') {
      if (editId) {
        onUpdateChecklist(editId, { title });
      } else {
        onAddChecklist({ title });
      }
    }
    resetForm();
  };

  // --- Checklist Logic ---
  const handleAddItem = (listId: string) => {
    const text = newItemTexts[listId];
    if (!text || !text.trim()) return;
    
    const list = checklists.find(c => c.id === listId);
    if (!list) return;

    const newItem: ChecklistItem = { id: Date.now().toString(), text: text.trim(), completed: false };
    onUpdateChecklist(listId, { items: [...list.items, newItem] });
    setNewItemTexts(prev => ({ ...prev, [listId]: '' }));
  };

  const handleToggleItem = (listId: string, itemId: string) => {
    const list = checklists.find(c => c.id === listId);
    if (!list) return;
    const updatedItems = list.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item);
    onUpdateChecklist(listId, { items: updatedItems });
  };

  const handleDeleteItem = (listId: string, itemId: string) => {
    const list = checklists.find(c => c.id === listId);
    if (!list) return;
    const updatedItems = list.items.filter(item => item.id !== itemId);
    onUpdateChecklist(listId, { items: updatedItems });
  };

  const handleStartEditItem = (listId: string, itemId: string, text: string) => {
    setEditingItem({ listId, itemId });
    setEditingText(text);
  };

  const handleSaveItemEdit = () => {
    if (!editingItem) return;
    const { listId, itemId } = editingItem;
    
    // If empty, we can choose to delete or just cancel edit. Let's keep it if not empty, otherwise cancel.
    if (editingText.trim()) {
      const list = checklists.find(c => c.id === listId);
      if (list) {
        const updatedItems = list.items.map(item => item.id === itemId ? { ...item, text: editingText.trim() } : item);
        onUpdateChecklist(listId, { items: updatedItems });
      }
    }
    
    setEditingItem(null);
    setEditingText('');
  };

  const moveChecklist = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === checklists.length - 1) return;
    
    const newList = [...checklists];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    
    onReorderChecklists(newList);
  };

  const moveChecklistItem = (listId: string, itemIndex: number, direction: 'up' | 'down') => {
    const list = checklists.find(c => c.id === listId);
    if (!list) return;

    if (direction === 'up' && itemIndex === 0) return;
    if (direction === 'down' && itemIndex === list.items.length - 1) return;

    const newItems = [...list.items];
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;

    [newItems[itemIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[itemIndex]];

    onUpdateChecklist(listId, { items: newItems });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('bills')} className={`flex-1 py-2 rounded-xl font-bold transition-colors ${activeTab === 'bills' ? 'bg-r-main text-white shadow-md' : 'bg-white text-r-sub'}`}>账单</button>
        <button onClick={() => setActiveTab('coupons')} className={`flex-1 py-2 rounded-xl font-bold transition-colors ${activeTab === 'coupons' ? 'bg-r-main text-white shadow-md' : 'bg-white text-r-sub'}`}>优惠券</button>
        <button onClick={() => setActiveTab('checklists')} className={`flex-1 py-2 rounded-xl font-bold transition-colors ${activeTab === 'checklists' ? 'bg-r-main text-white shadow-md' : 'bg-white text-r-sub'}`}>清单</button>
      </div>

      <div className="space-y-3">
        {activeTab === 'bills' && bills.map(bill => (
          <div key={bill.id} className={`bear-card p-4 flex items-center justify-between ${bill.paid ? 'opacity-60 bg-gray-50' : 'bg-r-card'}`}>
             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-full ${bill.paid ? 'bg-green-100 text-green-600' : 'bg-r-border text-r-main'}`}>
                 <Receipt size={20} />
               </div>
               <div>
                 <h4 className={`font-bold ${bill.paid ? 'line-through text-slate-500' : 'text-r-main'}`}>{bill.title}</h4>
                 <div className="flex items-center gap-2 text-xs text-r-sub">
                   <span>RM {bill.amount.toFixed(2)}</span>
                   <span>•</span>
                   <span>{bill.dueDate}</span>
                 </div>
               </div>
             </div>
             <div className="flex gap-2">
                <button onClick={() => onPayBill(bill.id)} className={`p-1.5 rounded-lg ${bill.paid ? 'text-gray-400' : 'text-green-500 hover:bg-green-50'}`}>
                  <CheckCircle size={18} />
                </button>
                <button onClick={() => openEditBill(bill)} className="p-1.5 rounded-lg text-gray-400 hover:text-r-main hover:bg-r-light">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => onDeleteBill(bill.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                  <Trash2 size={18} />
                </button>
             </div>
          </div>
        ))}

        {activeTab === 'coupons' && coupons.map(coupon => (
          <div key={coupon.id} className={`bear-card p-4 relative overflow-hidden ${coupon.used ? 'opacity-60 bg-gray-50' : 'bg-r-card'}`}>
             <div className="absolute left-0 top-0 bottom-0 w-2 bg-r-primary"></div>
             <div className="flex justify-between items-center pl-3">
                <div className="flex items-center gap-3">
                   <div className="bg-r-light p-2 rounded-full text-r-primary">
                     <Ticket size={20} />
                   </div>
                   <div>
                     <h4 className={`font-bold ${coupon.used ? 'line-through text-slate-500' : 'text-r-main'}`}>{coupon.title}</h4>
                     <div className="flex items-center gap-2 text-xs text-r-sub">
                       {coupon.code && <span className="font-mono bg-white px-1 rounded border">{coupon.code}</span>}
                       <span>有效期: {coupon.expiryDate}</span>
                     </div>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onUseCoupon(coupon.id)} className={`p-1.5 rounded-lg ${coupon.used ? 'text-gray-400' : 'text-green-500 hover:bg-green-50'}`}>
                    <CheckCircle size={18} />
                  </button>
                  <button onClick={() => openEditCoupon(coupon)} className="p-1.5 rounded-lg text-gray-400 hover:text-r-main hover:bg-r-light">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => onDeleteCoupon(coupon.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 size={18} />
                  </button>
                </div>
             </div>
          </div>
        ))}

        {activeTab === 'checklists' && checklists.map((checklist, index) => (
          <div key={checklist.id} className="bear-card bg-r-card p-4">
             <div className="flex justify-between items-center mb-3">
               <div className="flex items-center gap-2">
                 <div className="flex flex-col gap-0.5">
                   <button onClick={() => moveChecklist(index, 'up')} disabled={index === 0} className="text-gray-300 hover:text-r-main disabled:opacity-0"><ArrowUp size={12} /></button>
                   <button onClick={() => moveChecklist(index, 'down')} disabled={index === checklists.length - 1} className="text-gray-300 hover:text-r-main disabled:opacity-0"><ArrowDown size={12} /></button>
                 </div>
                 <h4 className="font-bold text-r-main flex items-center gap-2">
                   <ListChecks size={18} className="text-r-primary"/>
                   {checklist.title}
                 </h4>
               </div>
               <div className="flex gap-1">
                 <button onClick={() => openEditChecklist(checklist)} className="p-1.5 text-gray-400 hover:text-r-main"><Edit2 size={16} /></button>
                 <button onClick={() => onDeleteChecklist(checklist.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
               </div>
             </div>

             <div className="space-y-2 mb-3">
               {checklist.items.map((item, idx) => (
                 <div key={item.id} className="group flex items-center gap-2 text-sm bg-white/50 p-2 rounded-lg hover:bg-white transition-colors">
                   <button 
                     onClick={() => handleToggleItem(checklist.id, item.id)}
                     className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-r-primary'}`}
                   >
                     {item.completed && <Check size={12} />}
                   </button>
                   
                   {editingItem?.itemId === item.id ? (
                      <div className="flex-1 flex gap-1">
                        <input 
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1 bg-white border border-r-primary rounded px-1 outline-none text-r-main"
                          autoFocus
                          onKeyDown={(e) => { if(e.key === 'Enter') handleSaveItemEdit(); }}
                        />
                        <button onClick={handleSaveItemEdit} className="text-green-500"><Check size={16} /></button>
                      </div>
                   ) : (
                      <span className={`flex-1 ${item.completed ? 'line-through text-slate-400' : 'text-r-main'}`} onClick={() => handleStartEditItem(checklist.id, item.id, item.text)}>
                        {item.text}
                      </span>
                   )}
                   
                   <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <div className="flex flex-col gap-0.5 mr-1">
                        <button onClick={() => moveChecklistItem(checklist.id, idx, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-r-main disabled:opacity-0"><ArrowUp size={10} /></button>
                        <button onClick={() => moveChecklistItem(checklist.id, idx, 'down')} disabled={idx === checklist.items.length - 1} className="text-gray-300 hover:text-r-main disabled:opacity-0"><ArrowDown size={10} /></button>
                      </div>
                      <button onClick={() => handleDeleteItem(checklist.id, item.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                   </div>
                 </div>
               ))}
             </div>

             <div className="flex gap-2">
               <div className="relative flex-1">
                 <input 
                   placeholder="添加新项目..."
                   value={newItemTexts[checklist.id] || ''}
                   onChange={(e) => setNewItemTexts(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                   onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(checklist.id); }}
                   className="w-full p-2 text-sm rounded-lg border border-r-border outline-none focus:border-r-primary pr-8"
                 />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <VoiceInputButton onTranscript={(txt) => setNewItemTexts(prev => ({ ...prev, [checklist.id]: txt }))} simple />
                  </div>
               </div>
               <button onClick={() => handleAddItem(checklist.id)} className="bg-r-primary text-white p-2 rounded-lg hover:opacity-90">
                 <Plus size={16} />
               </button>
             </div>
          </div>
        ))}
        
        {/* Empty States */}
        {activeTab === 'bills' && bills.length === 0 && <p className="text-center text-r-muted text-sm py-4">暂无账单</p>}
        {activeTab === 'coupons' && coupons.length === 0 && <p className="text-center text-r-muted text-sm py-4">暂无优惠券</p>}
        {activeTab === 'checklists' && checklists.length === 0 && <p className="text-center text-r-muted text-sm py-4">暂无清单</p>}

      </div>

      {showForm ? (
        <div className="bear-card p-4 animate-in slide-in-from-bottom-5 bg-r-card/95 backdrop-blur-sm border-2 border-r-border shadow-xl">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-r-main">
               {editId ? '编辑' : '添加'} {activeTab === 'bills' ? '账单' : activeTab === 'coupons' ? '优惠券' : '清单'}
             </h3>
             <button onClick={resetForm}><X size={20} className="text-r-sub hover:text-r-main"/></button>
           </div>
           
           <div className="space-y-3">
             <div>
               <label className="block text-xs font-bold text-r-sub mb-1">名称</label>
               <div className="flex gap-2">
                 <input className="flex-1 p-2 rounded-xl border border-r-border outline-none focus:border-r-primary" value={title} onChange={e => setTitle(e.target.value)} placeholder="例如: 电费, 超市购物..." />
                 <VoiceInputButton onTranscript={setTitle} />
               </div>
             </div>
             
             {activeTab !== 'checklists' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-r-sub mb-1">{activeTab === 'bills' ? '金额' : '优惠码 (可选)'}</label>
                    <input className="w-full p-2 rounded-xl border border-r-border outline-none focus:border-r-primary" value={amountOrCode} onChange={e => setAmountOrCode(e.target.value)} placeholder={activeTab === 'bills' ? '0.00' : 'CODE123'} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-r-sub mb-1">{activeTab === 'bills' ? '截止日期' : '有效期'}</label>
                    <input type="date" className="w-full p-2 rounded-xl border border-r-border outline-none focus:border-r-primary" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>
             )}
             
             <div className="flex justify-end pt-2">
               <button onClick={handleSave} className="bg-r-main text-white px-6 py-2 rounded-xl font-bold shadow-md hover:opacity-90 transition-all">保存</button>
             </div>
           </div>
        </div>
      ) : (
        <button onClick={openAdd} className="w-full py-3 bg-white/50 backdrop-blur-sm border-2 border-r-primary/50 text-r-main rounded-2xl flex items-center justify-center gap-2 font-bold shadow-sm hover:bg-r-primary hover:text-r-main transition-all duration-300 group">
          <div className="bg-r-primary text-r-main p-1 rounded-full group-hover:bg-white group-hover:text-r-primary transition-colors">
            <Plus size={16} strokeWidth={3} />
          </div>
          添加新{activeTab === 'bills' ? '账单' : activeTab === 'coupons' ? '优惠券' : '清单'}
        </button>
      )}
    </div>
  );
};

export default WalletView;