
import React, { useRef, useState, useEffect } from 'react';
import { Check, Image as ImageIcon, RotateCcw, Palette, Upload, Download, FileJson, Trash2, Bell, Key, Eye, EyeOff } from 'lucide-react';
import { ThemeType } from '../../types';
import { getStoredApiKey } from '../../services/storageService';

interface SettingsViewProps {
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  hasBackgroundImage: boolean;
  onBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetBackground: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
  onRequestNotification: () => void;
  onTestNotification: () => void;
  onSaveApiKey: (key: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  currentTheme,
  onThemeChange,
  hasBackgroundImage,
  onBackgroundUpload,
  onResetBackground,
  onExportData,
  onImportData,
  onResetData,
  onRequestNotification,
  onTestNotification,
  onSaveApiKey
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isKeySaved, setIsKeySaved] = useState(false);

  useEffect(() => {
    // Load existing key for placeholder state (don't show actual key for security if we want, but showing it masked is fine)
    const stored = getStoredApiKey();
    if (stored) {
      setApiKeyInput(stored);
      setIsKeySaved(true);
    }
  }, []);

  const handleSaveKey = () => {
    onSaveApiKey(apiKeyInput.trim());
    setIsKeySaved(true);
    alert("API Key 已保存！");
  };

  const themes: { id: ThemeType; name: string; color: string }[] = [
    { id: 'original', name: '经典懒熊', color: '#F5CBA7' },
    { id: 'pink', name: '樱花粉', color: '#F48FB1' },
    { id: 'purple', name: '香芋紫', color: '#CE93D8' },
    { id: 'blue', name: '天空蓝', color: '#90CAF9' },
    { id: 'green', name: '抹茶绿', color: '#A5D6A7' },
    { id: 'yellow', name: '柠檬黄', color: '#FFE082' },
  ];

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-r-main mb-4">设置</h2>

      {/* API Key Section */}
      <div className="bear-card p-5 bg-white border-2 border-r-primary/30">
        <div className="flex items-center gap-2 mb-4 text-r-main">
          <Key size={20} className="text-r-primary" />
          <h3 className="font-bold text-lg">AI 设置 (API Key)</h3>
        </div>
        <div className="space-y-3">
           <p className="text-xs text-r-sub">
             请输入 Google Gemini API Key 以启用 AI 计划生成和健康分析功能。
             <br/>
             <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline text-r-primary hover:text-r-primary-hover">
               点击这里获取免费 Key
             </a>
           </p>
           <div className="flex items-center gap-2">
             <div className="relative flex-1">
               <input 
                 type={showApiKey ? "text" : "password"} 
                 value={apiKeyInput}
                 onChange={(e) => { setApiKeyInput(e.target.value); setIsKeySaved(false); }}
                 className="w-full p-3 pr-10 rounded-xl border border-r-border bg-gray-50 focus:border-r-primary outline-none text-r-main text-sm font-mono"
                 placeholder="粘贴 API Key..."
               />
               <button 
                 onClick={() => setShowApiKey(!showApiKey)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-r-sub"
               >
                 {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
               </button>
             </div>
             <button 
               onClick={handleSaveKey}
               className={`px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                 isKeySaved 
                   ? 'bg-green-100 text-green-600 border border-green-200' 
                   : 'bg-r-primary text-r-main hover:opacity-90 shadow-sm'
               }`}
             >
               {isKeySaved ? '已保存' : '保存'}
             </button>
           </div>
        </div>
      </div>

      {/* Notification Section */}
      <div className="bear-card p-5 bg-white">
        <div className="flex items-center gap-2 mb-4 text-r-main">
          <Bell size={20} className="text-r-primary" />
          <h3 className="font-bold text-lg">通知提醒</h3>
        </div>
        <div className="flex gap-3">
           <button onClick={onRequestNotification} className="flex-1 py-3 bg-r-light text-r-main font-bold rounded-xl hover:bg-r-card transition-colors">
             开启通知权限
           </button>
           <button onClick={onTestNotification} className="flex-1 py-3 bg-white border border-r-border text-r-sub font-bold rounded-xl hover:bg-gray-50 transition-colors">
             测试提醒
           </button>
        </div>
        <p className="text-[10px] text-r-muted mt-2 ml-1">
          * 任务提醒将在设定时间触发，节日提醒将在当天早上 9:00 触发。
        </p>
      </div>

      {/* Theme Section */}
      <div className="bear-card p-5 bg-white">
        <div className="flex items-center gap-2 mb-4 text-r-main">
          <Palette size={20} className="text-r-primary" />
          <h3 className="font-bold text-lg">主题色调</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 ${
                currentTheme === theme.id
                  ? 'border-r-primary bg-r-light shadow-md scale-[1.02]'
                  : 'border-transparent bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0"
                style={{ backgroundColor: theme.color }}
              ></div>
              <span className={`font-bold text-sm ${currentTheme === theme.id ? 'text-r-main' : 'text-gray-500'}`}>
                {theme.name}
              </span>
              {currentTheme === theme.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-r-primary">
                  <Check size={18} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Background Section */}
      <div className="bear-card p-5 bg-white">
        <div className="flex items-center gap-2 mb-4 text-r-main">
          <ImageIcon size={20} className="text-r-primary" />
          <h3 className="font-bold text-lg">背景图片</h3>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 border-2 border-dashed border-r-border rounded-xl flex flex-col items-center justify-center gap-2 text-r-sub hover:bg-r-light hover:border-r-primary transition-colors bg-gray-50"
          >
            <Upload size={24} />
            <span className="font-bold text-sm">上传新背景</span>
            <span className="text-xs opacity-70">支持 JPG, PNG</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onBackgroundUpload}
          />

          {hasBackgroundImage && (
            <button
              onClick={onResetBackground}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-r-main font-bold bg-r-card border border-r-border hover:bg-white transition-colors shadow-sm"
            >
              <RotateCcw size={18} />
              恢复默认背景
            </button>
          )}
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bear-card p-5 bg-white">
        <div className="flex items-center gap-2 mb-4 text-r-main">
          <FileJson size={20} className="text-r-primary" />
          <h3 className="font-bold text-lg">数据备份与恢复</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onExportData}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-r-border bg-r-light text-r-main hover:bg-r-card hover:border-r-primary transition-all"
          >
            <Download size={24} />
            <span className="font-bold text-sm">导出备份</span>
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-r-border bg-gray-50 text-r-sub hover:bg-white hover:border-r-primary transition-all"
          >
            <Upload size={24} />
            <span className="font-bold text-sm">导入恢复</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={onImportData}
          />
          
          <button
            onClick={onResetData}
            className="col-span-2 mt-2 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-200 transition-all"
          >
            <Trash2 size={24} />
            <span className="font-bold text-sm">重置所有数据</span>
          </button>
        </div>
        <p className="text-[10px] text-r-muted mt-3 text-center">
          提示：导入数据会覆盖当前的记录，请谨慎操作。
        </p>
      </div>

      {/* Info Section */}
      <div className="text-center mt-8 opacity-50">
        <p className="text-xs text-r-sub">Rilakkuma Life Planner v1.2</p>
        <p className="text-[10px] text-r-muted mt-1">Make every day relaxed & productive.</p>
      </div>
    </div>
  );
};

export default SettingsView;
