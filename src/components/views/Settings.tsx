import { useState, useEffect } from 'react';
import { User } from '../../lib/types';
import { 
  Settings as SettingsIcon, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  MapPin, 
  Plane, 
  Check, 
  ArrowLeft,
  DollarSign
} from 'lucide-react';

export const Settings = ({ 
  user, 
  onBack 
}: { 
  user: User; 
  onBack: () => void;
}) => {
  // Option Toggles (persisted locally)
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(() => {
    return localStorage.getItem('ehi_setting_notify_whatsapp') !== 'false';
  });
  const [driveSync, setDriveSync] = useState(() => {
    return localStorage.getItem('ehi_setting_drive_sync') !== 'false';
  });

  // PRICING MATRIX STATE (BB/MB/SB pricing)
  const [pricing, setPricing] = useState(() => {
    const saved = localStorage.getItem('ehi_setting_pricing');
    return saved ? JSON.parse(saved) : [
      { id: '1', route: 'Lagos - Abuja', bb: 18000, mb: 12000, sb: 7500 },
      { id: '2', route: 'Lagos - Port Harcourt', bb: 22000, mb: 15000, sb: 9500 },
      { id: '3', route: 'Abuja - Lagos', bb: 18000, mb: 12000, sb: 7500 },
      { id: '4', route: 'Port Harcourt - Lagos', bb: 22000, mb: 15000, sb: 9500 },
      { id: '5', route: 'Lagos - Enugu', bb: 19500, mb: 13000, sb: 8000 }
    ];
  });

  // Multi-Hub and Aviation Settings
  const [hubs, setHubs] = useState(() => {
    const saved = localStorage.getItem('ehi_setting_hubs');
    return saved ? JSON.parse(saved) : [
      { id: 'hub-lagos', name: 'Lagos HQ', code: 'LOS', type: 'Head Office', active: true },
      { id: 'hub-abuja', name: 'Abuja Station', code: 'ABV', type: 'Cargo Station', active: true },
      { id: 'hub-ph', name: 'Port Harcourt Station', code: 'PHC', type: 'Cargo Station', active: true }
    ];
  });

  const [carriers, setCarriers] = useState(() => {
    const saved = localStorage.getItem('ehi_setting_carriers');
    return saved ? JSON.parse(saved) : [
      { code: 'AK', name: 'Arik Air', active: true },
      { code: 'GA', name: 'Green Africa', active: true },
      { code: 'UN', name: 'United Nigeria', active: true }
    ];
  });

  // Persist edits
  useEffect(() => {
    localStorage.setItem('ehi_setting_notify_whatsapp', String(notifyWhatsApp));
  }, [notifyWhatsApp]);

  useEffect(() => {
    localStorage.setItem('ehi_setting_drive_sync', String(driveSync));
  }, [driveSync]);

  useEffect(() => {
    localStorage.setItem('ehi_setting_pricing', JSON.stringify(pricing));
  }, [pricing]);

  useEffect(() => {
    localStorage.setItem('ehi_setting_hubs', JSON.stringify(hubs));
  }, [hubs]);

  useEffect(() => {
    localStorage.setItem('ehi_setting_carriers', JSON.stringify(carriers));
  }, [carriers]);

  const handlePriceUpdate = (id: string, field: 'bb' | 'mb' | 'sb', value: string) => {
    const num = parseInt(value) || 0;
    setPricing((prev: any) => prev.map((p: any) => p.id === id ? { ...p, [field]: num } : p));
  };

  const handleToggleHub = (id: string) => {
    setHubs((prev: any) => prev.map((h: any) => h.id === id ? { ...h, active: !h.active } : h));
  };

  const handleToggleCarrier = (code: string) => {
    setCarriers((prev: any) => prev.map((c: any) => c.code === code ? { ...c, active: !c.active } : c));
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-obsidian)] text-[var(--color-foreground)] p-4 space-y-6 pb-[100px] overflow-y-auto select-none font-sans">
      
      {/* Header back navigation */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] pb-2">
        <button onClick={onBack} className="flex items-center space-x-1 text-[var(--color-muted)] hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-[11px] font-mono">Back</span>
        </button>
        <span className="text-[10px] font-mono text-[var(--color-accent-amber)] tracking-widest font-bold">● SYSTEM ADMIN CONSOLE</span>
      </div>

      {/* Global Automation Switches Card */}
      <div className="bg-[var(--color-surface-1)] rounded border border-[rgba(255,255,255,0.05)] p-4 space-y-4">
        <div className="text-[9px] font-mono text-white tracking-widest uppercase">AUTOMATION SERVICES</div>
        
        {/* Toggle WhatsApp Notifications */}
        <div className="flex justify-between items-center py-1">
          <div className="space-y-0.5">
            <span className="text-[12px] font-bold text-white block">WhatsApp Business Integrations</span>
            <span className="text-[9px] text-[var(--color-muted)] font-mono block">SMS auto triggers on customer creation / delivery</span>
          </div>
          <button 
            onClick={() => setNotifyWhatsApp(!notifyWhatsApp)}
            className="text-[var(--color-success)] ml-3 cursor-pointer"
          >
            {notifyWhatsApp ? <ToggleRight size={38} className="text-[var(--color-success)]" /> : <ToggleLeft size={38} className="text-gray-600" />}
          </button>
        </div>

        {/* Toggle Google Drive Sync */}
        <div className="flex justify-between items-center py-1 border-t border-[rgba(255,255,255,0.05)] pt-3">
          <div className="space-y-0.5">
            <span className="text-[12px] font-bold text-white block">Google Drive EOD dispatch</span>
            <span className="text-[9px] text-[var(--color-muted)] font-mono block font-mono">Archive daily PDF reports to cloud folder automatically</span>
          </div>
          <button 
            onClick={() => setDriveSync(!driveSync)}
            className="text-[var(--color-success)] ml-3 cursor-pointer"
          >
            {driveSync ? <ToggleRight size={38} className="text-[var(--color-success)]" /> : <ToggleLeft size={38} className="text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Routing Matrix Pricing Configuration List */}
      <div className="bg-[var(--color-surface-1)] rounded border border-[rgba(255,255,255,0.05)] p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-[9px] font-mono text-white tracking-widest uppercase flex items-center space-x-1.5">
            <DollarSign size={12} className="text-[var(--color-accent-amber)]" />
            <span>ROUTE PRICING MATRIX (STREAM 1)</span>
          </div>
          <span className="text-[8px] font-mono text-[var(--color-muted)] bg-black/40 px-1.5 py-0.5 rounded uppercase">BB/MB/SB ONLY</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pricing.map((r: any) => (
            <div key={r.id} className="p-3 bg-black/30 rounded border border-[rgba(255,255,255,0.04)] space-y-2">
              <span className="text-[11px] font-bold text-white uppercase tracking-wide block">{r.route}</span>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[8px] font-mono text-[var(--color-muted)] block mb-1">BB BAG (₦)</label>
                  <input 
                    type="number"
                    value={r.bb}
                    onChange={(e) => handlePriceUpdate(r.id, 'bb', e.target.value)}
                    className="w-full bg-[var(--color-surface-1)] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-[11px] font-mono text-white text-center focus:outline-none focus:border-[var(--color-accent-amber)]"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-[var(--color-muted)] block mb-1">MB BAG (₦)</label>
                  <input 
                    type="number"
                    value={r.mb}
                    onChange={(e) => handlePriceUpdate(r.id, 'mb', e.target.value)}
                    className="w-full bg-[var(--color-surface-1)] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-[11px] font-mono text-white text-center focus:outline-none focus:border-[var(--color-accent-amber)]"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-[var(--color-muted)] block mb-1">SB BAG (₦)</label>
                  <input 
                    type="number"
                    value={r.sb}
                    onChange={(e) => handlePriceUpdate(r.id, 'sb', e.target.value)}
                    className="w-full bg-[var(--color-surface-1)] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-[11px] font-mono text-white text-center focus:outline-none focus:border-[var(--color-accent-amber)]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* regional and aviation grid container */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* regional station hubs management */}
        <div className="bg-[var(--color-surface-1)] rounded border border-[rgba(255,255,255,0.05)] p-4 space-y-3">
        <div className="text-[9px] font-mono text-white tracking-widest uppercase flex items-center space-x-1.5">
          <MapPin size={11} className="text-purple-400" />
          <span>MULTI-HUB OUTPOSTS</span>
        </div>

        <div className="space-y-2">
          {hubs.map((hub: any) => (
            <div key={hub.id} className="p-2.5 bg-black/40 rounded border border-[rgba(255,255,255,0.04)] flex justify-between items-center text-[11px]">
              <div>
                <span className="font-bold text-white block">{hub.name}</span>
                <span className="text-[8px] font-mono text-[var(--color-muted)] uppercase block">{hub.type} · ID: {hub.code}</span>
              </div>
              
              <button 
                onClick={() => handleToggleHub(hub.id)}
                className={`text-[9px] font-mono px-2 py-0.5 rounded border border-solid font-bold uppercase cursor-pointer ${
                  hub.active ? 'bg-[rgba(16,185,129,0.15)] text-[var(--color-success)] border-[rgba(16,185,129,0.3)]' :
                  'bg-neutral-800 text-gray-400 border-none'
                }`}
              >
                {hub.active ? 'Active' : 'Offline'}
              </button>
            </div>
          ))}
        </div>
        
        {/* aviation air cargo carriers configuration list */}
        <div className="bg-[var(--color-surface-1)] rounded border border-[rgba(255,255,255,0.05)] p-4 space-y-3">
        <div className="text-[9px] font-mono text-white tracking-widest uppercase flex items-center space-x-1.5">
          <Plane size={11} className="text-[var(--color-accent-cobalt)]" />
          <span>AVIATION AIRLINE SUPPORTS</span>
        </div>

        <div className="space-y-2">
          {carriers.map((c: any) => (
            <div key={c.code} className="p-2.5 bg-black/40 rounded border border-[rgba(255,255,255,0.04)] flex justify-between items-center text-[11px]">
              <div>
                <span className="font-bold text-white block">{c.name}</span>
                <span className="text-[8.5px] font-mono text-[var(--color-muted)] block">Carrier Code: {c.code}</span>
              </div>
              
              <button 
                onClick={() => handleToggleCarrier(c.code)}
                className={`text-[9px] font-mono px-2 py-0.5 rounded border border-solid font-bold uppercase cursor-pointer ${
                  c.active ? 'bg-[rgba(59,130,246,0.15)] text-[var(--color-accent-cobalt)] border-[rgba(59,130,246,0.3)]' :
                  'bg-neutral-800 text-gray-400 border-none'
                }`}
              >
                {c.active ? 'Active' : 'Muted'}
              </button>
            </div>
          ))}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};
