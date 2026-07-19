import React, { useState, useEffect } from 'react';
import { X, Scale, Package, Wallet, CheckCircle2 } from 'lucide-react';
import { fmt } from '../../lib/helpers';

interface PartialRetrievalModalProps {
  entry: any; // Using any for simplicity here
  onClose: () => void;
  onConfirm: (data: {
    isPartial: boolean;
    refundAmount: number;
    retrievedPieces: number;
    retrievedKg: number;
  }) => void;
}

export const PartialRetrievalModal: React.FC<PartialRetrievalModalProps> = ({ entry, onClose, onConfirm }) => {
  const [retrievalType, setRetrievalType] = useState<'full' | 'partial'>('full');
  
  // Safe extraction of original values
  const totalPieces = entry.pieces || 1;
  const totalKg = entry.kg || 1;
  const totalAmount = entry.amount || 0;
  
  const [retrievedPieces, setRetrievedPieces] = useState<string>('');
  const [retrievedKg, setRetrievedKg] = useState<string>('');
  
  const originalRate = totalKg > 0 ? totalAmount / totalKg : 0;
  
  const parsedPieces = parseInt(retrievedPieces) || 0;
  const parsedKg = parseFloat(retrievedKg) || 0;
  
  let refundAmount = totalAmount;
  if (retrievalType === 'partial') {
    refundAmount = Math.min(totalAmount, Math.round(parsedKg * originalRate));
  }

  const handleConfirm = () => {
    if (retrievalType === 'partial') {
      if (parsedPieces <= 0 || parsedPieces > totalPieces) {
        alert(`Invalid pieces. Must be between 1 and ${totalPieces}`);
        return;
      }
      if (parsedKg <= 0 || parsedKg > totalKg) {
        alert(`Invalid weight. Must be between 0.1 and ${totalKg}`);
        return;
      }
    }
    
    onConfirm({
      isPartial: retrievalType === 'partial',
      refundAmount,
      retrievedPieces: retrievalType === 'partial' ? parsedPieces : totalPieces,
      retrievedKg: retrievalType === 'partial' ? parsedKg : totalKg,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-[var(--color-obsidian)] border border-[var(--color-border)] rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-card)]">
          <h3 className="text-[14px] font-bold font-sans text-[var(--color-foreground)] tracking-wide">
            Process Cargo Retrieval
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-muted)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Original Entry Context */}
          <div className="bg-[var(--color-surface-1)] p-3 rounded-lg border border-[var(--color-border)] flex flex-col gap-2">
            <div className="text-[11px] font-mono text-[var(--color-muted)] uppercase tracking-wider flex justify-between">
              <span>Entry: {entry.id}</span>
              <span className="text-[var(--color-accent-amber)] font-bold">{entry.name}</span>
            </div>
            <div className="flex items-center gap-4 text-[13px] font-bold text-[var(--color-foreground)]">
              <span className="flex items-center gap-1.5"><Package size={14} className="text-[var(--color-muted)]" /> {totalPieces} PCS</span>
              <span className="flex items-center gap-1.5"><Scale size={14} className="text-[var(--color-muted)]" /> {totalKg} KG</span>
              <span className="flex items-center gap-1.5 ml-auto text-[var(--color-success)]">₦{fmt(totalAmount)}</span>
            </div>
          </div>

          {/* Toggle Type */}
          <div className="flex p-1 bg-[var(--color-surface-2)] rounded-lg">
            <button
              onClick={() => setRetrievalType('full')}
              className={`flex-1 py-2 text-[12px] font-bold rounded-md transition-colors ${retrievalType === 'full' ? 'bg-[var(--color-accent-amber)] text-[var(--color-obsidian)] shadow-sm' : 'text-[var(--color-muted)]'}`}
            >
              Full Retrieval
            </button>
            <button
              onClick={() => setRetrievalType('partial')}
              className={`flex-1 py-2 text-[12px] font-bold rounded-md transition-colors ${retrievalType === 'partial' ? 'bg-[var(--color-accent-cobalt)] text-white shadow-sm' : 'text-[var(--color-muted)]'}`}
            >
              Partial Retrieval
            </button>
          </div>

          {/* Partial Inputs */}
          {retrievalType === 'partial' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[var(--color-muted)]">Pieces Retrieved</label>
                <div className="relative">
                  <Package size={14} className="absolute left-3 top-3 text-[var(--color-muted)]" />
                  <input
                    type="number"
                    min="1"
                    max={totalPieces}
                    value={retrievedPieces}
                    onChange={(e) => setRetrievedPieces(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-lg text-[13px] font-mono text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent-cobalt)]"
                    placeholder={`Max ${totalPieces}`}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[var(--color-muted)]">Weight Retrieved (KG)</label>
                <div className="relative">
                  <Scale size={14} className="absolute left-3 top-3 text-[var(--color-muted)]" />
                  <input
                    type="number"
                    min="0.1"
                    max={totalKg}
                    step="0.1"
                    value={retrievedKg}
                    onChange={(e) => setRetrievedKg(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-lg text-[13px] font-mono text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent-cobalt)]"
                    placeholder={`Max ${totalKg}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Refund Calculation */}
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors ${retrievalType === 'full' ? 'bg-[rgba(245,158,11,0.05)] border-[rgba(245,158,11,0.2)]' : 'bg-[rgba(59,130,246,0.05)] border-[rgba(59,130,246,0.2)]'}`}>
            <div className="text-[11px] font-mono text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Wallet size={12} /> Pro-Rated Refund Amount
            </div>
            <div className={`text-[28px] font-mono font-bold ${retrievalType === 'full' ? 'text-[var(--color-accent-amber)]' : 'text-[var(--color-accent-cobalt)]'}`}>
              ₦{fmt(refundAmount)}
            </div>
            {retrievalType === 'partial' && (
              <div className="text-[10px] font-mono text-[var(--color-muted)]">
                Calculated at ₦{fmt(Math.round(originalRate))}/KG
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-card)]">
          <button
            onClick={handleConfirm}
            className={`w-full h-12 flex items-center justify-center gap-2 rounded-lg text-[13px] font-bold transition-colors ${
              retrievalType === 'full'
                ? 'bg-[var(--color-accent-amber)] text-[var(--color-obsidian)] hover:bg-amber-400'
                : 'bg-[var(--color-accent-cobalt)] text-white hover:bg-blue-500'
            }`}
          >
            <CheckCircle2 size={16} />
            {retrievalType === 'full' ? 'Refund Full Amount to Wallet' : 'Process Partial Refund to Wallet'}
          </button>
        </div>
      </div>
    </div>
  );
};
