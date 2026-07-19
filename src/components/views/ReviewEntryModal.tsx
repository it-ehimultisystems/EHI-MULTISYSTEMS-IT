import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { fmt } from '../../lib/helpers';

interface ReviewEntryModalProps {
  title: string;
  details: { label: string; value: string | number }[];
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  isSubmitting?: boolean;
}

export const ReviewEntryModal: React.FC<ReviewEntryModalProps> = ({
  title,
  details,
  onConfirm,
  onCancel,
  confirmText = 'Confirm & Log Entry',
  isSubmitting = false
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-[var(--color-obsidian)] border border-[var(--color-border)] rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-card)]">
          <h3 className="text-[15px] font-bold font-sans text-[var(--color-foreground)] tracking-wide">
            {title}
          </h3>
          <button onClick={onCancel} disabled={isSubmitting} className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-muted)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {details.map((detail, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0">
                <span className="text-[12px] font-mono text-[var(--color-muted)] uppercase tracking-wider">{detail.label}</span>
                <span className={\`text-[13px] font-sans font-bold \${detail.label.toLowerCase().includes('amount') ? 'text-[var(--color-success)]' : 'text-[var(--color-foreground)]'}\`}>
                  {detail.label.toLowerCase().includes('amount') && typeof detail.value === 'number' ? \`₦\${fmt(detail.value)}\` : detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-card)] flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-foreground)] text-[13px] font-bold hover:bg-[var(--color-surface-1)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-lg text-[13px] font-bold transition-colors bg-[var(--color-success)] text-[#030712] hover:bg-[#10b981]"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-[#030712] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={16} />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
