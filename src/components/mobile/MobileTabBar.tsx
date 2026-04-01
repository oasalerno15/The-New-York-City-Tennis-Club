'use client';

import { Home, MapPin, Map, MoreHorizontal } from 'lucide-react';

export type MobileTab = 'home' | 'courts' | 'map' | 'more';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'courts', label: 'Courts', icon: MapPin },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-2 transition-colors ${
              activeTab === id ? 'text-[#1B3A2E]' : 'text-gray-500'
            }`}
            aria-label={label}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon className="w-6 h-6" strokeWidth={2} />
            <span className="text-xs font-medium mt-0.5">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
