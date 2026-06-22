import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Package, Plane, TrendingUp, Package2 } from 'lucide-react';
import { User, Transaction } from '../../lib/types';
import { fmt } from '../../lib/helpers';
import { AnimatedAmount } from '../AnimatedAmount';
import { motion, AnimatePresence } from 'motion/react';
import { useVirtualizer } from '@tanstack/react-virtual';

const AnimatedScore = React.memo(({ value }: { value: number }) => <AnimatedAmount value={value} />);

const TxRow = React.memo(({ t, isNewest }: { t: Transaction, isNewest: boolean }) => {
  let bgStyle: React.CSSProperties = {
    background: 'var(--color-surface-card)',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
  };

  if (isNewest) {
    if (t.type === 'cargo') {
      bgStyle = {
        background: 'linear-gradient(145deg, var(--color-surface-card) 0%, rgba(245,158,11,0.06) 100%)',
        border: '1.5px solid rgba(245,158,11,0.3)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 0 12px rgba(245,158,11,0.08)',
      };
    } else if (t.type === 'marketing') {
      bgStyle = {
        background: 'linear-gradient(145deg, var(--color-surface-card) 0%, rgba(16,185,129,0.06) 100%)',
        border: '1.5px solid rgba(16,185,129,0.3)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 0 12px rgba(16,185,129,0.08)',
      };
    } else {
      bgStyle = {
        background: 'linear-gradient(145deg, var(--color-surface-card) 0%, rgba(59,130,246,0.06) 100%)',
        border: '1.5px solid rgba(59,130,246,0.3)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 0 12px rgba(59,130,246,0.08)',
      };
    }
  }

  return (
    <motion.div
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.98, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-3.5 flex items-center space-x-3 mb-3"
      style={bgStyle}
    >
      <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
        t.type === 'cargo' ? 'bg-[rgba(245,158,11,0.15)] text-[var(--color-accent-amber)]' : 
        t.type === 'marketing' ? 'bg-[rgba(16,185,129,0.15)] text-[var(--color-success)]' :
        'bg-[rgba(59,130,246,0.15)] text-[var(--color-accent-cobalt)]'
      }`}>
        {t.type === 'cargo' ? <Package size={18} /> : 
         t.type === 'marketing' ? <TrendingUp size={18} /> :
         <Plane size={18} />}
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="text-[14px] font-sans font-bold text-[var(--color-foreground)] truncate leading-tight">{t.name}</div>
        <div className="text-[12px] font-sans text-[var(--color-light-muted)] truncate mt-0.5">{t.detail}</div>
      </div>

      <div className="text-right shrink-0 flex flex-col items-end justify-center">
        <div className={`text-[16px] font-extrabold font-mono mb-1 ${
          t.type === 'cargo' ? 'text-[var(--color-accent-amber)]' : 
          t.type === 'marketing' ? 'text-[var(--color-success)]' :
          'text-[var(--color-accent-cobalt)]'
        }`}>
          {fmt(t.amount)}
        </div>
        <div className="flex items-center space-x-1.5 flex-wrap justify-end">
          <span className={`text-[9px] font-sans px-1.5 py-0.5 rounded font-medium ${
            t.mode === 'Cash' ? 'bg-[rgba(16,185,129,0.15)] text-[var(--color-success)]' :
            t.mode === 'Transfer' ? 'bg-[rgba(59,130,246,0.15)] text-[var(--color-accent-cobalt)]' :
            t.mode === 'POS' ? 'bg-[rgba(245,158,11,0.15)] text-[var(--color-accent-amber)]' :
            'border border-[var(--color-error)] text-[var(--color-error)]'
          }`}>
            {t.mode === 'Debt' ? 'Credit' : t.mode}
          </span>
          <span className="text-[10px] font-sans text-[var(--color-muted)]">{t.time}</span>
        </div>
      </div>
    </motion.div>
  );
});

const ScoreCard = ({
  label, value, subtitle, accent, icon: Icon
}: {
  label: string;
  value: number;
  subtitle: string;
  accent: string;
  icon: React.ElementType;
}) => (
  <div
    style={{
      background: `linear-gradient(145deg, var(--color-surface-card) 0%, ${accent}0D 100%)`,
      border: `1.5px solid ${accent}22`,
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
    }}
  >
    {/* Subtle top accent line */}
    <div
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent} 0%, transparent 100%)`,
      }}
    />
    {/* Icon top-right */}
    <div
      style={{
        position: 'absolute', top: 12, right: 12,
        width: 32, height: 32,
        borderRadius: 'var(--radius-sm)',
        background: `${accent}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Icon size={16} style={{ color: accent }} />
    </div>
    <div style={{
      fontSize: 11, fontWeight: 600,
      color: 'var(--color-muted)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: 8,
    }}>
      {label}
    </div>
    <div style={{
      fontSize: 22, fontWeight: 800,
      fontFamily: 'monospace',
      color: accent,
      marginBottom: 4, lineHeight: 1,
    }}>
      <AnimatedScore value={value} />
    </div>
    <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
      {subtitle}
    </div>
  </div>
);

export const Dashboard = React.memo(({ user, transactions }: { user: User; transactions: Transaction[] }) => {
  const cargoTx = useMemo(() => transactions.filter(t => t.type === 'cargo'), [transactions]);
  const mktgTx = useMemo(() => transactions.filter(t => t.type === 'marketing'), [transactions]);
  const vjTx = useMemo(() => transactions.filter(t => t.type === 'baggage'), [transactions]);

  const cargoTotal = useMemo(() => cargoTx.reduce((sum, t) => sum + t.amount, 0), [cargoTx]);
  const mktgTotal = useMemo(() => mktgTx.reduce((sum, t) => sum + t.amount, 0), [mktgTx]);
  const vjTotal = useMemo(() => vjTx.reduce((sum, t) => sum + t.amount, 0), [vjTx]);

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  const showCargo = isAdmin || user.role === 'cargo_agent';
  const showVJ = isAdmin || user.role === 'vj_agent';
  const showMktg = isAdmin || user.role === 'marketing_agent';

  const allVisibleTx = useMemo(() => transactions.filter(t => 
    (showCargo && t.type === 'cargo') || 
    (showMktg && t.type === 'marketing') || 
    (showVJ && t.type === 'baggage')
  ), [transactions, showCargo, showMktg, showVJ]);

  const cashTotal = useMemo(() => allVisibleTx.reduce((sum, t) => sum + (t.mode === 'Cash' ? t.amount : 0), 0), [allVisibleTx]);
  const transferTotal = useMemo(() => allVisibleTx.reduce((sum, t) => sum + (t.mode === 'Transfer' ? t.amount : 0), 0), [allVisibleTx]);
  const posTotal = useMemo(() => allVisibleTx.reduce((sum, t) => sum + (t.mode === 'POS' ? t.amount : 0), 0), [allVisibleTx]);

  // Track newest transaction to apply fade tint
  const [newestId, setNewestId] = useState<string>('');
  useEffect(() => {
    if (allVisibleTx.length > 0) {
      const topTx = allVisibleTx[0];
      setNewestId(topTx.id);
      const timer = setTimeout(() => setNewestId(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [allVisibleTx]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: allVisibleTx.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Approximate row height with padding
    overscan: 5,
  });

  return (
    <div className="flex flex-col p-4 space-y-5 h-full">
      {/* Score Cards Header */}
      <div className="border-b border-[var(--color-border)] pb-2 flex justify-between items-center shrink-0">
        <span className="text-[13px] font-sans font-semibold text-[var(--color-muted)]">
          Stats Overview
        </span>
      </div>

      {/* Score Cards */}
      <div className="grid gap-3 shrink-0" style={{ gridTemplateColumns: 'var(--card-grid, repeat(2, 1fr))' }}>
        {showCargo && (
          <ScoreCard
            label="Cargo Stream"
            value={cargoTotal}
            subtitle={`${cargoTx.length} ${cargoTx.length === 1 ? 'entry' : 'entries'}`}
            accent="var(--color-accent-amber)"
            icon={Package}
          />
        )}
        {showMktg && (
          <ScoreCard
            label="Marketing"
            value={mktgTotal}
            subtitle={`${mktgTx.length} ${mktgTx.length === 1 ? 'customer' : 'customers'}`}
            accent="var(--color-success)"
            icon={TrendingUp}
          />
        )}
        {showVJ && (
          <ScoreCard
            label="ValueJet POS"
            value={vjTotal}
            subtitle={`${vjTx.length} ${vjTx.length === 1 ? 'passenger' : 'passengers'}`}
            accent="var(--color-accent-cobalt)"
            icon={Plane}
          />
        )}
      </div>

      {isAdmin && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)',
          border: '1.5px solid rgba(16,185,129,0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          boxShadow: '0 0 0 1px rgba(16,185,129,0.05) inset',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Total Revenue — All Streams
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-foreground)', marginBottom: 10, lineHeight: 1 }}>
            <AnimatedScore value={cargoTotal + mktgTotal + vjTotal} />
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Cash', value: cashTotal, color: 'var(--color-success)' },
              { label: 'Transfer', value: transferTotal, color: 'var(--color-accent-cobalt)' },
              { label: 'POS', value: posTotal, color: 'var(--color-accent-amber)' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color }}>
                  {fmt(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Feed Header */}
      <div className="border-b border-[rgba(255,255,255,0.07)] pb-2 mt-4 flex items-center justify-between shrink-0">
        <span className="text-[14px] font-sans font-semibold text-[var(--color-foreground)]">
          Today's Activity
        </span>
        <div className="inline-flex items-center space-x-1.5 bg-[rgba(16,185,129,0.1)] px-2 py-1 rounded border border-[rgba(16,185,129,0.15)]">
           <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse"></div>
           <span className="text-[11px] font-sans text-[var(--color-success)] font-medium">Live</span>
        </div>
      </div>

      {/* Live Feed */}
      <div ref={parentRef} className="flex-1 overflow-y-auto w-full no-scrollbar">
        {allVisibleTx.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 py-16 text-center bg-[var(--color-surface-card)] rounded-xl border border-dashed border-[rgba(255,255,255,0.1)] mt-2">
            <Package2 size={36} className="text-[#64748B] mb-3" strokeWidth={1.5} />
            <div className="text-[14px] font-medium text-[var(--color-foreground)] font-sans">No activity yet today.</div>
            <div className="text-[13px] text-[var(--color-muted)] font-sans mt-0.5">Entries will appear here.</div>
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }} className="mt-2">
            {virtualizer.getVirtualItems().map(v => (
              <div
                key={v.key}
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%',
                  transform: `translateY(${v.start}px)`,
                }}
              >
                <TxRow t={allVisibleTx[v.index]} isNewest={allVisibleTx[v.index].id === newestId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

