
import React, { useState } from 'react';
import { Receipt, Ticket, Plus, Trash2, CheckCircle, Edit2, ListChecks, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Bill, Coupon, Checklist, ChecklistItem } from '../../types';

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
        onAddChecklist({ title, items: [] });
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
                 <h4 className={`font-bold ${bill.paid ? 'line-through text-gray-400' : 'text-r-main'}`}>{bill.title}</h4>
                 <p className="text-xs text-r-sub">截止: {new Date(bill.dueDate).toLocaleDateString()}</p>
               </div>
             </div>
             <div className="text-right">
                <div className="font-bold text-r-main">${bill.amount.toFixed(2)}</div>
                <div className="flex gap-2 justify-end mt-1">
                  {!bill.paid && <button onClick={() => onPayBill(bill.id)} className="text-xs bg-green-500 text-white px-2 py-1 rounded">支付</button>}
                  <button onClick={() => openEditBill(bill)} className="text-gray-400 hover:text-r-main p-1 ml-1"><Edit2 size={16}/></button>
                  <button onClick={() => onDeleteBill(bill.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                </div>
             </div>
          </div>
        ))}

        {activeTab === 'coupons' && coupons.map(coupon => (
          <div key={coupon.id} className={`bear-card p-4 flex items-center justify-between border-dashed border-2 ${coupon.used ? 'opacity-60 bg-gray-50' : 'bg-[#FFFDE7]'}`}>
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-full bg-r-primary text-white">
                 <Ticket size={20} />
               </div>
               <div>
                 <h4 className={`font-bold ${coupon.used ? 'line-through text-gray-400' : 'text-r-main'}`}>{coupon.title}</h4>
                 <p className="text-xs text-r-sub">有效期: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                 {coupon.code && <p className="text-xs font-mono bg-white inline-block px-1 rounded mt-1">{coupon.code}</p>}
               </div>
             </div>
             <div className="flex gap-2 items-center">
                {!coupon.used && <button onClick={() => onUseCoupon(coupon.id)} className="text-r-main hover:bg-r-border p-1 rounded"><CheckCircle size={20}/></button>}
                <button onClick={() => openEditCoupon(coupon)} className="text-gray-400 hover:text-r-main p-1"><Edit2 size={18}/></button>
                <button onClick={() => onDeleteCoupon(coupon.id)} className="text-gray-400 hover:text-red-500 p-1 rounded"><Trash2 size={20}/></button>
             </div>
          </div>
        ))}

        {activeTab === 'checklists' && (
           <div className="grid grid-cols-1 gap-4">
              {checklists.length === 0 && (
                <div className="text-center py-10 opacity-50 bg-r-card/50 rounded-2xl border-2 border-dashed border-r-border">
                  <ListChecks size={40} className="mx-auto mb-2 text-r-muted" />
                  <p className="text-sm">暂无清单，添加一个购物列表吧！</p>
                </div>
              )}
              {checklists.map((list, index) => (
                <div key={list.id} className="bear-card p-4 bg-[#FFF9C4] relative shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2 border-b border-black/5 pb-2">
                       <div className="flex items-center gap-2 flex-1">
                          <h3 className="font-bold text-r-main text-lg">{list.title}</h3>
                          <button onClick={() => openEditChecklist(list)} className="text-r-sub/50 hover:text-r-main p-1 transition-colors">
                             <Edit2 size={14} />
                          </button>
                       </div>
                       <div className="flex gap-1 items-center">
                         <div className="flex flex-col mr-1">
                           <button 
                              onClick={() => moveChecklist(index, 'up')} 
                              disabled={index === 0}
                              className={`text-r-sub hover:text-r-main disabled:opacity-20 ${index === 0 ? 'cursor-not-allowed' : ''}`}
                           >
                             <ArrowUp size={14} />
                           </button>
                           <button 
                              onClick={() => moveChecklist(index, 'down')} 
                              disabled={index === checklists.length - 1}
                              className={`text-r-sub hover:text-r-main disabled:opacity-20 ${index === checklists.length - 1 ? 'cursor-not-allowed' : ''}`}
                           >
                             <ArrowDown size={14} />
                           </button>
                         </div>
                         <button onClick={() => onDeleteChecklist(list.id)} className="text-gray-400 hover:text-red-500 ml-1"><Trash2 size={16}/></button>
                       </div>
                    </div>
                    
                    <div className="space-y-1.5 mb-3 min-h-[50px]">
                      {list.items.length === 0 && <p className="text-xs text-r-sub/50 italic">空空如也...</p>}
                      {list.items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 group min-h-[28px]">
                          {editingItem?.listId === list.id && editingItem?.itemId === item.id ? (
                            <input 
                              className="flex-1 bg-white border border-r-primary rounded px-2 py-1 text-sm outline-none text-r-main shadow-sm"
                              value={editingText}
                              onChange={e => setEditingText(e.target.value)}
                              onBlur={handleSaveItemEdit}
                              onKeyDown={e => e.key === 'Enter' && handleSaveItemEdit()}
                              autoFocus
                            />
                          ) : (
                            <>
                              <button onClick={() => handleToggleItem(list.id, item.id)} className="shrink-0 text-r-sub hover:text-r-main">
                                {item.completed ? <CheckCircle size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-r-sub/50"></div>}
                              </button>
                              <span 
                                onClick={() => handleStartEditItem(list.id, item.id, item.text)}
                                className={`text-sm flex-1 break-all cursor-text ${item.completed ? 'line-through text-gray-400' : 'text-r-main'}`}
                              >
                                {item.text}
                              </span>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                <button onClick={() => handleStartEditItem(list.id, item.id, item.text)} className="text-gray-400 hover:text-r-primary">
                                   <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDeleteItem(list.id, item.id)} className="text-gray-300 hover:text-red-500">
                                   <X size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                       <input 
                         className="flex-1 bg-white/50 border border-transparent focus:border-r-border rounded px-2 py-1 text-sm outline-none placeholder:text-gray-400"
                         placeholder="添加项目..."
                         value={newItemTexts[list.id] || ''}
                         onChange={(e) => setNewItemTexts(prev => ({ ...prev, [list.id]: e.target.value }))}
                         onKeyDown={(e) => { if(e.key === 'Enter') handleAddItem(list.id); }}
                       />
                       <button onClick={() => handleAddItem(list.id)} className="bg-r-main text-white rounded p-1 hover:opacity-80">
                         <Plus size={16} />
                       </button>
                    </div>
                </div>
              ))}
           </div>
        )}
      </div>

      {showForm ? (
        <div className="bear-card p-4 animate-in slide-in-from-bottom-5 bg-r-card">
           <h3 className="font-bold text-r-main mb-3">{editId ? '编辑' : '添加'} {activeTab === 'bills' ? '账单' : activeTab === 'coupons' ? '优惠券' : '清单'}</h3>
           <input className="w-full mb-2 p-2 rounded-xl border border-r-border bg-white outline-none focus:border-r-primary text-r-main" placeholder="名称 / 标题" value={title} onChange={e => setTitle(e.target.value)} />
           
           {activeTab !== 'checklists' && (
             <div className="flex gap-2 mb-2">
               <input className="flex-1 p-2 rounded-xl border border-r-border bg-white outline-none focus:border-r-primary text-r-main" placeholder={activeTab === 'bills' ? "金额 ($)" : "核销码 (选填)"} value={amountOrCode} onChange={e => setAmountOrCode(e.target.value)} />
               <input type="date" className="flex-1 p-2 rounded-xl border border-r-border bg-white outline-none focus:border-r-primary text-r-main" value={date} onChange={e => setDate(e.target.value)} />
             </div>
           )}
           
           <div className="flex gap-2 justify-end">
             <button onClick={resetForm} className="text-r-sub text-sm px-3">取消</button>
             <button onClick={handleSave} className="bg-r-primary text-r-main px-4 py-2 rounded-lg font-bold shadow-sm hover:opacity-80">保存</button>
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

export default WalletView;
