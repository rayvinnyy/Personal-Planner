import React from 'react';
import { Coffee, Heart, Wallet, Plane, Settings } from 'lucide-react';

interface NavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'daily', label: '日常', icon: Coffee },
    { id: 'health', label: '健康', icon: Heart },
    { id: 'wallet', label: '钱包', icon: Wallet },
    { id: 'life', label: '生活', icon: Plane },
    { id: 'settings', label: '设置', icon: Settings },
  ];

  return (
    <div className="bg-r-card border-t-4 border-r-primary px-4 py-2 pb-6 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 min-w-[50px] ${
              isActive ? '-translate-y-2' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-sm transition-colors ${
                isActive
                  ? 'bg-r-primary border-r-main text-r-main'
                  : 'bg-white border-r-border text-[#D4AC0D]'
              }`}
            >
              <tab.icon size={22} strokeWidth={2.5} />
            </div>
            <span
              className={`text-xs font-bold ${
                isActive ? 'text-r-main' : 'text-[#D4AC0D]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default NavBar;