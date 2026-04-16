'use client';

import { Home, MapPin, Map, MoreHorizontal, ClipboardList } from 'lucide-react';

export type MobileTab = 'home' | 'courts' | 'map' | 'sheets' | 'more';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'sheets', label: 'Sheets', icon: ClipboardList },
  { id: 'courts', label: 'Courts', icon: MapPin },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[80] bg-white/95 backdrop-blur-sm border-t border-[#2D5A27]/20 shadow-[0_-6px_20px_rgba(0,0,0,0.12)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-[3.75rem] items-center justify-around px-0.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center py-1.5 transition-colors ${
              activeTab === id ? 'text-[#2D5A27]' : 'text-[#1A1A1A]/60'
            }`}
            aria-label={label}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon className="h-[1.35rem] w-[1.35rem] shrink-0" strokeWidth={2} />
            <span className="mt-0.5 max-w-full truncate px-0.5 text-[10px] font-medium sm:text-xs">
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
