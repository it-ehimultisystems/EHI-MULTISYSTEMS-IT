import { Wifi, WifiOff, LogOut } from 'lucide-react';
import { User } from '../lib/types';
import { useState } from 'react';

export const Header = ({ 
  user, 
  isOffline, 
  pendingCount, 
  onToggleWifi, 
  onLogout 
}: { 
  user: User; 
  isOffline: boolean; 
  pendingCount: number; 
  onToggleWifi: () => void; 
  onLogout: () => void;
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="flex flex-col w-full z-10 shrink-0 border-b border-[rgba(255,255,255,0.07)]">
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-obsidian)]">
        <div>
          <div className="text-[13px] font-bold font-mono text-white">EHI MULTISYSTEMS</div>
          <div className="text-[9px] font-mono text-[var(--color-muted)] tracking-wider">LOGISTICS INTELLIGENCE PLATFORM</div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[9px] font-mono text-[var(--color-accent-amber)]">{user.hub}</div>
            <div className="text-[9px] font-mono text-[var(--color-muted)]">{user.name}</div>
          </div>
          
          <button onClick={onToggleWifi} className="p-1.5 focus:outline-none">
            {isOffline ? <WifiOff size={16} className="text-[var(--color-error)]" /> : <Wifi size={16} className="text-[var(--color-light-muted)]" />}
          </button>
          
          {user.role !== 'admin' && (
            <div className="relative">
              <button onClick={() => setShowDropdown(!showDropdown)} className="w-7 h-7 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center border border-[rgba(255,255,255,0.07)] focus:outline-none">
                <span className="text-[10px] font-bold font-mono text-white">{user.name.charAt(0)}</span>
              </button>
              
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 top-10 w-48 bg-[var(--color-surface-1)] border border-[rgba(255,255,255,0.07)] rounded shadow-xl z-20 overflow-hidden flex flex-col">
                    <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.07)]">
                      <div className="text-[11px] font-bold font-sans text-white">{user.name}</div>
                      <div className="text-[9px] font-mono text-[var(--color-muted)]">{user.hub}</div>
                    </div>
                    <button 
                      onClick={() => { setShowDropdown(false); onLogout(); }}
                      className="px-3 py-3 w-full text-left flex items-center space-x-2 bg-transparent hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-error)] focus:outline-none"
                    >
                      <LogOut size={14} />
                      <span className="text-[11px] font-mono">Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isOffline && (
        <div className="w-full bg-[var(--color-error)] text-white text-[10px] font-mono text-center py-1">
          OFFLINE — {pendingCount} transaction{pendingCount !== 1 ? 's' : ''} queued
        </div>
      )}
    </div>
  );
};
