import { useState } from 'react';
import { User, Transaction, Expense } from '../../lib/types';
import { PRICING, BANKS, EXPENSE_TYPES } from '../../lib/constants';
import { fmt, uid, tnow } from '../../lib/helpers';
import { CheckCircle, Plus } from 'lucide-react';

export const MarketingWorkspace = ({ 
  user, 
  transactions, 
  expenses,
  onAddTx,
  onAddExpense
}: { 
  user: User; 
  transactions: Transaction[]; 
  expenses: Expense[];
  onAddTx: (tx: Transaction) => void;
  onAddExpense: (exp: Expense) => void;
}) => {
  // New Entry State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [route, setRoute] = useState(Object.keys(PRICING)[0]);
  const [mode, setMode] = useState('Transfer');
  const [bank, setBank] = useState(BANKS[0]);
  const [bb, setBb] = useState(0);
  const [mb, setMb] = useState(0);
  const [sb, setSb] = useState(0);

  // Expense State
  const [expType, setExpType] = useState(EXPENSE_TYPES[0]);
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const routePrices = PRICING[route];
  const totalAmount = (bb * routePrices.BB) + (mb * routePrices.MB) + (sb * routePrices.SB);
  
  const isValid = name.trim().length > 0 && phone.trim().length > 0 && totalAmount > 0;

  const marketingTxs = transactions.filter(t => t.type === 'marketing');
  const totalSales = marketingTxs.reduce((sum, t) => sum + t.amount, 0);
  const cashSales = marketingTxs.reduce((sum, t) => sum + (t.mode === 'Cash' ? t.amount : 0), 0);
  const transferSales = marketingTxs.reduce((sum, t) => sum + (t.mode === 'Transfer' ? t.amount : 0), 0);
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balanceToRemit = cashSales - totalExpenses; // Usually, expenses are taken from cash

  const handleAddEntry = () => {
    if (!isValid) return;

    let details = [];
    if (bb > 0) details.push(`${bb}BB`);
    if (mb > 0) details.push(`${mb}MB`);
    if (sb > 0) details.push(`${sb}SB`);

    const tx: Transaction = {
      id: uid('MK'),
      name: name.trim(),
      detail: `${route} · ${details.join(' ')}`,
      amount: totalAmount,
      mode,
      bank: mode === 'Transfer' ? bank : undefined,
      time: tnow(),
      type: 'marketing',
      status: 'Intake'
    };

    onAddTx(tx);
    
    // Reset
    setName('');
    setPhone('');
    setBb(0);
    setMb(0);
    setSb(0);
    setMode('Transfer');
  };

  const handleAddExpense = () => {
    const amt = parseFloat(expAmount);
    if (!amt || amt <= 0) return;

    onAddExpense({
      id: `EXP-${Date.now()}`,
      type: expType,
      amount: amt,
      description: expDesc.trim(),
      time: tnow()
    });

    setExpAmount('');
    setExpDesc('');
  };

  return (
    <div className="p-4 space-y-6 pb-8">
      {/* Workspace Header */}
      <div className="flex justify-between items-center text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-widest border-b border-[rgba(255,255,255,0.07)] pb-2">
        <div>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
        <div>Agent: {user.name.split(' ')[0]}</div>
      </div>

      {/* Scoreboard */}
      <div className="space-y-3">
        <div className="text-[10px] font-mono text-white tracking-[0.1em]">TODAY'S RECORD</div>
        <div className="flex w-full space-x-3">
          <div className="flex-1 bg-[rgba(245,158,11,0.05)] rounded border border-[rgba(245,158,11,0.2)] p-3 flex flex-col justify-between">
            <div className="text-[20px] font-bold font-mono text-[var(--color-accent-amber)]">{fmt(totalSales)}</div>
            <div className="text-[9px] font-mono text-[var(--color-muted)] uppercase mt-1">Total Sales</div>
          </div>
          <div className="flex-1 bg-[var(--color-surface-1)] rounded border border-[rgba(255,255,255,0.07)] p-3 flex flex-col justify-between">
            <div className="text-[20px] font-bold font-mono text-white">{marketingTxs.length}</div>
            <div className="text-[9px] font-mono text-[var(--color-muted)] uppercase mt-1">Customers</div>
          </div>
        </div>

        <div className="bg-[var(--color-surface-1)] p-3 rounded flex space-x-6">
          <div>
            <div className="text-[9px] font-mono text-[var(--color-muted)] uppercase">Cash</div>
            <div className="text-[13px] font-mono text-white mt-1">{fmt(cashSales)}</div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-[var(--color-muted)] uppercase">Transfer</div>
            <div className="text-[13px] font-mono text-white mt-1">{fmt(transferSales)}</div>
          </div>
        </div>
      </div>

      {/* New Customer Entry */}
      <div className="space-y-4 bg-[rgba(255,255,255,0.02)] -mx-4 px-4 py-4 border-y border-[rgba(255,255,255,0.05)]">
        <div className="text-[11px] font-bold font-mono text-[var(--color-accent-amber)] uppercase flex items-center">
          <Plus size={14} className="mr-2" /> NEW CUSTOMER ENTRY
        </div>
        
        <div className="space-y-3">
          <input 
            placeholder="Customer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3 text-sm rounded font-sans"
          />
          <input 
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-11 px-3 text-sm rounded font-sans"
          />
          
          <div className="flex space-x-3">
            <select 
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="flex-1 h-11 px-3 text-sm rounded font-sans min-w-0"
            >
              <option value="" disabled>Route</option>
              {Object.keys(PRICING).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select 
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="flex-1 h-11 px-3 text-sm rounded font-sans min-w-0"
            >
              <option value="Transfer">Transfer</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {mode === 'Transfer' && (
            <select 
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full h-11 px-3 text-sm rounded font-sans"
            >
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}

          <div className="flex space-x-2">
            {[ 
              { key: 'bb', label: 'BB', val: bb, set: setBb },
              { key: 'mb', label: 'MB', val: mb, set: setMb },
              { key: 'sb', label: 'SB', val: sb, set: setSb }
            ].map(bag => (
              <div key={bag.key} className="flex-1 bg-[var(--color-surface-1)] rounded p-2 flex items-center justify-between border border-[rgba(255,255,255,0.07)]">
                <span className="text-[11px] font-bold font-mono text-[var(--color-muted)]">{bag.label}</span>
                <input 
                  type="number"
                  min="0"
                  value={bag.val || ''}
                  onChange={(e) => bag.set(parseInt(e.target.value) || 0)}
                  className="w-10 h-7 text-center text-sm font-bold bg-transparent border-none p-0 focus:ring-0 text-white"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-[10px] font-mono text-[var(--color-light-muted)]">AUTO-CALCULATED</span>
            <span className={`text-[18px] font-bold font-mono ${totalAmount > 0 ? 'text-[var(--color-accent-amber)]' : 'text-[var(--color-muted)]'}`}>
              {fmt(totalAmount)}
            </span>
          </div>

          <button
            onClick={handleAddEntry}
            disabled={!isValid}
            className={`w-full py-3 rounded font-bold font-mono text-[12px] transition-colors ${isValid ? 'bg-[var(--color-accent-amber)] text-[var(--color-obsidian)]' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] cursor-not-allowed'}`}
          >
            ADD ENTRY
          </button>
        </div>
      </div>

      {/* Entries Today */}
      <div className="space-y-3">
        <div className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.1em] uppercase">ENTRIES TODAY</div>
        {marketingTxs.length === 0 ? (
          <div className="text-[11px] text-[var(--color-muted)] font-mono py-4 text-center border border-dashed border-[rgba(255,255,255,0.1)] rounded">No entries yet</div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {marketingTxs.map(t => (
              <div key={t.id} className="flex justify-between items-center bg-[var(--color-surface-1)] p-3 rounded border border-[rgba(255,255,255,0.05)]">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="text-[12px] font-bold text-white truncate">{t.name}</div>
                  <div className="text-[10px] font-mono text-[var(--color-muted)]">{t.detail}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] font-bold font-mono text-[var(--color-accent-amber)]">{fmt(t.amount)}</div>
                  <div className="text-[9px] font-mono text-[var(--color-muted)]">{t.mode} {t.bank ? `· ${t.bank}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expense Section */}
      <div className="space-y-4 pt-4 border-t border-[rgba(255,255,255,0.07)]">
        <div className="text-[10px] font-mono text-white tracking-[0.1em] uppercase">LOG EXPENSE</div>
        <div className="flex space-x-2">
          <select 
            value={expType}
            onChange={(e) => setExpType(e.target.value)}
            className="flex-1 h-11 px-3 text-sm rounded font-sans"
          >
            {EXPENSE_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input 
            type="number"
            placeholder="Amount"
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)}
            className="w-[100px] h-11 px-3 text-sm rounded font-sans"
          />
        </div>
        <div className="flex space-x-2">
          <input 
            placeholder="Description (optional)"
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
            className="flex-1 h-11 px-3 text-sm rounded font-sans"
          />
          <button 
            onClick={handleAddExpense}
            disabled={!expAmount}
            className="h-11 px-4 bg-[var(--color-surface-2)] text-white text-[12px] font-mono font-bold rounded disabled:opacity-50"
          >
            LOG
          </button>
        </div>

        <div className="bg-[rgba(255,255,255,0.03)] p-3 rounded mt-4 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase">
            <span className="text-[var(--color-muted)]">Expenses Today</span>
            <span className="text-[var(--color-error)]">{fmt(totalExpenses)}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-bold font-mono uppercase border-t border-[rgba(255,255,255,0.07)] pt-2">
            <span className="text-[var(--color-light-muted)]">Balance to Remit</span>
            <span className="text-[var(--color-success)]">{fmt(balanceToRemit)}</span>
          </div>
        </div>
      </div>

      <button className="w-full py-[14px] bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-2)] text-white text-[12px] font-bold font-mono rounded border border-[rgba(255,255,255,0.1)] transition-colors">
        SUBMIT DAY & GENERATE REPORT
      </button>

    </div>
  );
};
