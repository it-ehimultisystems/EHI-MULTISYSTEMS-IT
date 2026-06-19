import { useState } from 'react';
import { Transaction } from '../../lib/types';
import { ALL_STATUSES } from '../../lib/constants';
import { fmt } from '../../lib/helpers';
import { QrCode, RefreshCw, Search } from 'lucide-react';

export const Scanner = ({ transactions }: { transactions: Transaction[] }) => {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<Transaction | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleScan = () => {
    setIsScanning(true);
    setResult(null);
    setErrorMsg('');
    setTimeout(() => {
      setIsScanning(false);
      const randTx = transactions[Math.floor(Math.random() * transactions.length)];
      if (randTx) {
        setResult(randTx);
      }
    }, 1800);
  };

  const handleSearch = () => {
    if (!search.trim()) return;
    const q = search.trim().toLowerCase();
    const found = transactions.find(t => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
    if (found) {
      setResult(found);
      setErrorMsg('');
    } else {
      setResult(null);
      setErrorMsg('No waybill found for this query.');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-[9px] font-mono text-[var(--color-success)] tracking-[0.1em] uppercase">▸ QR SCAN & TRACKING</div>

      <div 
        onClick={isScanning ? undefined : handleScan}
        className={`w-full h-[180px] rounded flex flex-col items-center justify-center cursor-pointer transition-colors ${isScanning ? 'border-2 border-solid border-[var(--color-accent-cobalt)] bg-[rgba(59,130,246,0.05)]' : 'border-2 border-dashed border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,255,255,0.4)] bg-[var(--color-surface-1)]'}`}
      >
        {isScanning ? (
          <>
            <RefreshCw size={32} className="text-[var(--color-accent-cobalt)] animate-spin mb-3" />
            <div className="text-[12px] font-bold font-mono text-[var(--color-accent-cobalt)]">SCANNING…</div>
          </>
        ) : (
          <>
            <QrCode size={32} className="text-[var(--color-muted)] mb-3" />
            <div className="text-[12px] font-bold font-mono text-white pointer-events-none">TAP TO SIMULATE QR SCAN</div>
            <div className="text-[9px] font-mono text-[var(--color-muted)] mt-1">(uses device camera in production)</div>
          </>
        )}
      </div>

      <div className="flex space-x-2">
        <input 
          placeholder="Search waybill ID or customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-11 px-3 text-sm rounded font-sans"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch}
          className="h-11 px-4 bg-[var(--color-surface-2)] text-white rounded flex items-center justify-center focus:outline-none"
        >
          <Search size={18} />
        </button>
      </div>
      
      {errorMsg && (
        <div className="text-[11px] font-mono text-[var(--color-error)] text-center py-2">{errorMsg}</div>
      )}

      {result && (
        <div className="bg-[var(--color-surface-1)] border border-[rgba(255,255,255,0.07)] rounded p-4 mt-2 mb-8 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className={`text-[16px] font-bold font-mono ${result.type === 'cargo' ? 'text-[var(--color-accent-amber)]' : 'text-[var(--color-accent-cobalt)]'}`}>
                {result.id}
              </div>
              <div className="text-[13px] font-sans text-white mt-1">{result.name}</div>
              <div className="text-[11px] font-mono text-[var(--color-light-muted)] mt-1">{result.detail}</div>
            </div>
            <div className="px-2 py-1 bg-[rgba(255,255,255,0.05)] rounded text-[9px] font-mono text-white border border-[rgba(255,255,255,0.1)]">
              {result.type.toUpperCase()}
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-6 mb-6 pl-2 relative border-l border-[rgba(255,255,255,0.1)] space-y-5">
            {ALL_STATUSES.map((status, idx) => {
              const currentIdx = ALL_STATUSES.indexOf(result.status as any);
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isFuture = idx > currentIdx;

              return (
                <div key={status} className="relative pl-5">
                  <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border border-white bg-white ${isPast || isCurrent ? 'bg-white' : 'bg-[var(--color-surface-1)] border-[rgba(255,255,255,0.2)]'}`} />
                  <div className="flex items-center space-x-2">
                    <span className={`text-[12px] font-mono ${isCurrent ? 'font-bold text-white' : isPast ? 'text-[var(--color-light-muted)]' : 'text-[var(--color-muted)]'}`}>
                      {status}
                    </span>
                    {isCurrent && (
                      <span className="text-[8px] font-mono bg-[var(--color-success)] text-[var(--color-obsidian)] px-1 py-0.5 rounded uppercase font-bold tracking-wider">Current</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[rgba(255,255,255,0.07)] pt-3 flex justify-between items-center">
            <div className={`text-[18px] font-bold font-mono ${result.type === 'cargo' ? 'text-[var(--color-accent-amber)]' : 'text-[var(--color-accent-cobalt)]'}`}>
              {fmt(result.amount)}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-muted)]">{result.mode} &middot; {result.time}</div>
          </div>
        </div>
      )}

    </div>
  );
};
