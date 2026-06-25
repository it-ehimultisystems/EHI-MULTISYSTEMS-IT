import { useState, useEffect } from 'react';
import { User, TrackingEvent } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ArrowDown, Package, User as UserIcon, Clock } from 'lucide-react';

export const ArrivalsView = ({ user, onBack }: { user: User; onBack: () => void }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArrivals = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tracking_events')
          .select('*')
          .eq('event_type', 'ARRIVE')
          .eq('hub_name', user.hub)
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data) {
          setEvents(data);
        }
      } catch (err) {
        console.error('Error fetching arrivals:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArrivals();
  }, [user.hub]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-obsidian)] text-[var(--color-foreground)] relative animate-in slide-in-from-right overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors cursor-pointer border-none bg-transparent"
        >
          <ArrowLeft size={16} />
          <span className="text-[11px] font-mono">Back</span>
        </button>
        <span className="text-[10px] font-mono text-[var(--color-accent-amber)] tracking-widest font-bold">
          ● ARRIVALS LOG
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <ArrowDown size={20} className="text-[var(--color-success)]" />
          <h2 className="text-[16px] font-bold font-sans text-white">Hub Arrivals ({user.hub})</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[var(--color-muted)] text-[12px] font-mono">
            Loading arrivals...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[var(--color-surface-1)] text-[var(--color-muted)]">
            <Package size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-[13px] font-medium font-sans">No arrivals logged yet.</p>
            <p className="text-[11px] font-mono mt-1 opacity-60">Scanned items arriving at this hub will appear here.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-1)]">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                  <th className="py-3 px-4 text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-wider font-semibold">Ref / AWB</th>
                  <th className="py-3 px-4 text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-wider font-semibold">Destination</th>
                  <th className="py-3 px-4 text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-wider font-semibold">Time</th>
                  <th className="py-3 px-4 text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-wider font-semibold text-right">Scanned By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                {events.map((evt, i) => (
                  <tr key={evt.id || i} className="hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-[var(--color-accent-amber)]" />
                        <span className="text-[13px] font-bold text-white font-mono">{evt.cargo_ref}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[12px] font-sans text-[var(--color-muted)]">{evt.cargo_destination || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-light-muted)]">
                        <Clock size={12} className="opacity-50" />
                        {new Date(evt.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-[12px] font-sans text-white">
                        <UserIcon size={12} className="text-[var(--color-muted)]" />
                        {evt.scanned_by_name}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
