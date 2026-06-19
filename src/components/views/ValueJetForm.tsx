import { useState } from 'react';
import { PaymentMode, Transaction } from '../../lib/types';
import { fmt, uid, tnow } from '../../lib/helpers';
import { CheckCircle } from 'lucide-react';
import { QRCode } from '../QRCode';

export const ValueJetForm = ({ onAddTx }: { onAddTx: (tx: Transaction) => void }) => {
  const [name, setName] = useState('');
  const [flight, setFlight] = useState('');
  const [dest, setDest] = useState('');
  const [kg, setKg] = useState('');
  const [rate, setRate] = useState('5000');
  const [mode, setMode] = useState<PaymentMode>('POS');

  const [successTx, setSuccessTx] = useState<{ tx: Transaction, kgs: number, exc: number } | null>(null);

  const kgVal = parseFloat(kg) || 0;
  const rateVal = parseFloat(rate) || 0;
  const excessKg = Math.max(0, kgVal - 20.0);
  const totalAmount = excessKg * rateVal;

  const isValid = name.trim().length > 0 && flight.trim().length > 0 && kgVal > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    const tx: Transaction = {
      id: uid('VJ'),
      name: name.trim(),
      detail: `${flight.toUpperCase()} · +${excessKg.toFixed(1)}kg excess`,
      amount: totalAmount,
      mode,
      time: tnow(),
      type: 'baggage',
      status: 'Delivered'
    };

    onAddTx(tx);
    setSuccessTx({ tx, kgs: kgVal, exc: excessKg });
  };

  const handleReset = () => {
    setName('');
    setFlight('');
    setDest('');
    setKg('');
    setRate('5000');
    setSuccessTx(null);
  };

  if (successTx) {
    const s = successTx;
    return (
      <div className="p-4 space-y-4">
        <div className="bg-[rgba(59,130,246,0.1)] border border-[var(--color-accent-cobalt)] rounded text-center p-6 flex flex-col items-center">
          <CheckCircle size={32} className="text-[var(--color-accent-cobalt)] mb-3" />
          <div className="text-[10px] font-mono text-[var(--color-accent-cobalt)] uppercase tracking-widest mb-4">COMMIT SUCCESS</div>
          
          <div className="bg-white p-2 rounded max-w-max mb-4">
            <QRCode id={s.tx.id} size={150} />
          </div>

          <div className="text-[16px] font-bold font-mono text-white mb-1">{s.tx.id}</div>
          <div className="text-[12px] font-sans text-[var(--color-light-muted)] mb-3">{s.tx.name}</div>
          
          <div className="w-full bg-[var(--color-obsidian)] rounded p-3 mb-4 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-[var(--color-muted)]">Total Weight</span>
              <span className="text-[12px] font-mono text-white">{s.kgs.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-[var(--color-muted)]">Free Allowance</span>
              <span className="text-[12px] font-mono text-[var(--color-success)]">– 20.0 kg</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[rgba(255,255,255,0.07)]">
              <span className="text-[10px] font-mono text-[var(--color-accent-cobalt)]">Excess Baggage</span>
              <span className="text-[12px] font-bold font-mono text-[var(--color-accent-cobalt)]">{s.exc.toFixed(1)} kg</span>
            </div>
            
            <div className="flex justify-between items-end mt-3">
              <div>
                <div className="text-[20px] font-bold font-mono text-[var(--color-accent-cobalt)]">{fmt(s.tx.amount)}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-mono text-[var(--color-muted)]">{s.tx.mode}</div>
                <div className="text-[9px] font-mono text-[var(--color-muted)]">{s.tx.time}</div>
              </div>
            </div>
          </div>

          <div className="flex w-full space-x-2">
            <button onClick={handleReset} className="flex-1 py-3 bg-[var(--color-surface-1)] text-white text-[11px] font-mono rounded">
              Next Passenger
            </button>
            <button className="flex-1 py-3 bg-[var(--color-accent-cobalt)] text-white text-[11px] font-bold font-mono rounded">
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="text-[9px] font-mono text-[var(--color-accent-cobalt)] tracking-[0.1em] uppercase">▸ VALUEJET EXCESS BAGGAGE POS</div>
      
      <div className="space-y-3">
        <input 
          placeholder="Passenger Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-11 px-3 text-sm rounded font-sans"
        />
        
        <div className="flex space-x-3">
          <input 
            placeholder="Flight Number"
            value={flight}
            onChange={(e) => setFlight(e.target.value)}
            className="flex-1 h-11 px-3 text-sm rounded font-sans min-w-0"
          />
          <input 
            placeholder="Destination"
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            className="flex-1 h-11 px-3 text-sm rounded font-sans min-w-0"
          />
        </div>

        <div className="flex space-x-3">
          <input 
            type="number"
            step="0.1"
            placeholder="Total Weight KG"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            className="flex-1 h-11 px-3 text-sm rounded font-sans min-w-0"
          />
          <div className="flex-1 relative min-w-0">
            <div className="absolute left-3 top-0 bottom-0 flex items-center text-[10px] font-mono text-[var(--color-muted)]">₦</div>
            <input 
              type="number"
              placeholder="Rate per KG"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full h-11 pl-6 pr-3 text-sm rounded font-sans"
            />
            <div className="absolute right-3 top-0 bottom-0 flex items-center text-[10px] font-mono text-[var(--color-muted)]">/kg</div>
          </div>
        </div>
        
        <select 
          value={mode}
          onChange={(e) => setMode(e.target.value as PaymentMode)}
          className="w-full h-11 px-3 text-sm flex-1 rounded font-sans"
        >
          <option value="Cash">Cash</option>
          <option value="POS">POS</option>
          <option value="Transfer">Transfer</option>
        </select>
      </div>

      {kgVal > 0 && (
        <div className={`rounded p-4 transition-colors duration-300 ${excessKg > 0 ? 'bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)]' : 'bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-[var(--color-muted)]">Total Weight</span>
            <span className="text-[11px] font-mono text-white">{kgVal.toFixed(1)} kg</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-[var(--color-muted)]">Free Allowance</span>
            <span className="text-[11px] font-mono text-[var(--color-success)]">– 20.0 kg</span>
          </div>
          <div className="flex justify-between items-center border-t border-[rgba(255,255,255,0.07)] mt-2 pt-2 mb-3">
            <span className="text-[10px] font-mono font-bold text-white">Excess KG</span>
            <span className={`text-[12px] font-bold font-mono ${excessKg > 0 ? 'text-[var(--color-accent-cobalt)]' : 'text-white'}`}>{excessKg.toFixed(1)} kg</span>
          </div>
          
          {excessKg > 0 ? (
            <>
              <div className="text-[28px] font-bold font-mono text-[var(--color-accent-cobalt)] leading-none mt-1">{fmt(totalAmount)}</div>
              <div className="text-[10px] font-mono text-[var(--color-light-muted)] mt-2">{excessKg.toFixed(1)} kg × ₦{rateVal}/kg</div>
            </>
          ) : (
            <div className="text-[14px] font-bold font-mono text-[var(--color-success)] mt-2">₦0 — Within Limit ✓</div>
          )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || !!(kgVal > 0 && totalAmount === 0 && excessKg > 0)}
        className={`w-full py-[14px] rounded font-bold font-mono text-[13px] transition-colors ${isValid ? 'bg-[var(--color-accent-cobalt)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] cursor-not-allowed'}`}
      >
        COMMIT TRANSACTION
      </button>

    </div>
  );
};
