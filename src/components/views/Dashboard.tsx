import { Package, Plane, Briefcase } from 'lucide-react';
import { User, Transaction } from '../../lib/types';
import { fmt } from '../../lib/helpers';

export const Dashboard = ({ user, transactions }: { user: User; transactions: Transaction[] }) => {
  const cargoTx = transactions.filter(t => t.type === 'cargo' || t.type === 'marketing');
  const vjTx = transactions.filter(t => t.type === 'baggage');
  const airTx = transactions.filter(t => t.type === 'air_cargo');

  const cargoTotal = cargoTx.reduce((sum, t) => sum + t.amount, 0);
  const vjTotal = vjTx.reduce((sum, t) => sum + t.amount, 0);
  const airTotal = airTx.reduce((sum, t) => sum + t.amount, 0);

  const cashTotal = transactions.reduce((sum, t) => sum + (t.mode === 'Cash' ? t.amount : 0), 0);
  const posTotal = transactions.reduce((sum, t) => sum + (t.mode === 'POS' ? t.amount : 0), 0);
  const transferTotal = transactions.reduce((sum, t) => sum + (t.mode === 'Transfer' ? t.amount : 0), 0);

  const showCargo = user.role === 'admin' || user.role === 'super_admin' || user.role === 'cargo_agent' || user.role === 'marketing_agent';
  const showVJ = user.role === 'admin' || user.role === 'super_admin' || user.role === 'vj_agent';
  const showAir = user.role === 'admin' || user.role === 'super_admin';

  return (
    <div className="flex flex-col p-4 space-y-4">
      {/* Score Cards */}
      <div className="flex w-full space-x-3 overflow-x-auto pb-2 snap-x">
        {showCargo && (
          <div className="min-w-[140px] flex-1 bg-[var(--color-surface-1)] rounded border border-[rgba(255,255,255,0.07)] p-3 relative overflow-hidden flex flex-col justify-between snap-start">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--color-accent-amber)]" />
            <div className="text-[8px] font-mono text-[var(--color-muted)] uppercase tracking-wider pl-1">CARGO DESK</div>
            <div className="text-[20px] font-bold font-mono text-[var(--color-accent-amber)] mt-1 pl-1">{fmt(cargoTotal)}</div>
            <div className="text-[9px] font-mono text-[var(--color-muted)] mt-1 pl-1">{cargoTx.length} Shipments</div>
          </div>
        )}
        
        {showAir && (
          <div className="min-w-[140px] flex-1 bg-[var(--color-surface-1)] rounded border border-[rgba(255,255,255,0.07)] p-3 relative overflow-hidden flex flex-col justify-between snap-start">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--color-error)]" />
            <div className="text-[8px] font-mono text-[var(--color-muted)] uppercase tracking-wider pl-1">AIR CARGO</div>
            <div className="text-[20px] font-bold font-mono text-[var(--color-error)] mt-1 pl-1">{fmt(airTotal)}</div>
            <div className="text-[9px] font-mono text-[var(--color-muted)] mt-1 pl-1">{airTx.length} Consignments</div>
          </div>
        )}

        {showVJ && (
          <div className="min-w-[140px] flex-1 bg-[var(--color-surface-1)] rounded border border-[rgba(255,255,255,0.07)] p-3 relative overflow-hidden flex flex-col justify-between snap-start">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--color-accent-cobalt)]" />
            <div className="text-[8px] font-mono text-[var(--color-muted)] uppercase tracking-wider pl-1">VALUEJET POS</div>
            <div className="text-[20px] font-bold font-mono text-[var(--color-accent-cobalt)] mt-1 pl-1">{fmt(vjTotal)}</div>
            <div className="text-[9px] font-mono text-[var(--color-muted)] mt-1 pl-1">{vjTx.length} Passengers</div>
          </div>
        )}
      </div>

      {(user.role === 'admin' || user.role === 'super_admin') && (
        <div className="w-full bg-[rgba(16,185,129,0.05)] border border-[var(--color-success)] rounded p-3">
          <div className="text-[9px] font-mono text-[var(--color-success)] uppercase tracking-wider">● TODAY'S REVENUE</div>
          <div className="text-[28px] font-bold font-mono text-white mt-1">{fmt(cargoTotal + vjTotal + airTotal)}</div>
          
          <div className="mt-2 flex space-x-4 text-[9px] font-mono text-[var(--color-light-muted)]">
            <div>Cash: <span className="text-white">{fmt(cashTotal)}</span></div>
            <div>POS: <span className="text-white">{fmt(posTotal)}</span></div>
            <div>Transfer: <span className="text-white">{fmt(transferTotal)}</span></div>
          </div>
        </div>
      )}

      {/* Live Feed */}
      <div className="w-full mt-2">
        <div className="flex items-center space-x-2 mb-3">
          <div className="text-[9px] font-mono uppercase text-[var(--color-muted)] tracking-[0.1em]">Live Feed</div>
          <div className="bg-[rgba(16,185,129,0.15)] text-[line-height:1] rounded-full px-2 py-[2px] border border-[rgba(16,185,129,0.3)]">
            <span className="text-[8px] font-mono text-[var(--color-success)]">● LIVE</span>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          {transactions.filter(t => (showCargo && (t.type === 'cargo' || t.type === 'marketing')) || (showVJ && t.type === 'baggage') || (showAir && t.type === 'air_cargo')).map((t, idx) => (
            <div key={t.id + t.time} className={`bg-[var(--color-surface-1)] border border-[rgba(255,255,255,0.07)] rounded p-3 flex items-center space-x-3 transition-colors ${idx === 0 ? 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)]' : ''}`}>
              <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${
                t.type === 'cargo' || t.type === 'marketing' ? 'bg-[rgba(245,158,11,0.15)] text-[var(--color-accent-amber)]' : 
                t.type === 'air_cargo' ? 'bg-[rgba(239,68,68,0.15)] text-[var(--color-error)]' :
                'bg-[rgba(59,130,246,0.15)] text-[var(--color-accent-cobalt)]'
              }`}>
                {t.type === 'cargo' || t.type === 'marketing' ? <Package size={14} /> : 
                 t.type === 'air_cargo' ? <Briefcase size={14} /> :
                 <Plane size={14} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-sans font-bold text-white truncate">{t.name}</div>
                <div className="text-[10px] font-mono text-[var(--color-light-muted)] truncate flex space-x-2">
                  <span>{t.id}</span>
                  <span className="text-[rgba(255,255,255,0.2)]">|</span>
                  <span className="truncate">{t.detail}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className={`text-[12px] font-bold font-mono ${
                  t.type === 'cargo' || t.type === 'marketing' ? 'text-[var(--color-accent-amber)]' : 
                  t.type === 'air_cargo' ? 'text-[var(--color-error)]' :
                  'text-[var(--color-accent-cobalt)]'
                }`}>
                  {fmt(t.amount)}
                </div>
                <div className="text-[9px] font-mono text-[var(--color-muted)]">
                  {t.mode} &middot; {t.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
