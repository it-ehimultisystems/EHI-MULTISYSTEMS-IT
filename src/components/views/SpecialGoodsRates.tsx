import { useState, useEffect } from 'react';
import { PackageSearch, Loader } from 'lucide-react';
import { BackButton } from '../BackButton';
import { KgTierEditor, KgTier } from '../KgTierEditor';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/ToastContext';
import { useAirlines } from '../../lib/airlines';

interface SpecialContentType {
  id: string;
  name: string;
}

interface RateRow {
  id: string;
  content_type_id: string;
  airline: string;
  min_kg: number;
  max_kg: number | null;
  rate_per_kg: number;
}

export const SpecialGoodsRates = ({ onBack, presetContentTypeId }: { onBack: () => void; presetContentTypeId?: string }) => {
  const [contentTypes, setContentTypes] = useState<SpecialContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>(presetContentTypeId || '');
  const [selectedAirline, setSelectedAirline] = useState<string>('');
  const [rows, setRows] = useState<RateRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);

  const { showToast } = useToast();
  const airlines = useAirlines({ includeOther: false });

  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase
        .from('content_types')
        .select('id, name')
        .eq('is_special_goods', true)
        .order('name');
      if (error) {
        showToast({ message: `Failed to load special goods: ${error.message}`, type: 'error' });
      } else {
        setContentTypes(data || []);
        if (!selectedContentTypeId && data && data.length > 0) setSelectedContentTypeId(data[0].id);
      }
      setLoading(false);
    };
    fetchTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (airlines.length > 0 && !selectedAirline) setSelectedAirline(airlines[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airlines]);

  const fetchRows = async () => {
    if (!selectedContentTypeId || !selectedAirline) { setRows([]); return; }
    setRowsLoading(true);
    const { data, error } = await supabase
      .from('special_goods_rates')
      .select('id, content_type_id, airline, min_kg, max_kg, rate_per_kg')
      .eq('content_type_id', selectedContentTypeId)
      .eq('airline', selectedAirline)
      .order('min_kg');
    if (error) {
      showToast({ message: `Failed to load rate brackets: ${error.message}`, type: 'error' });
    } else {
      setRows(data || []);
    }
    setRowsLoading(false);
  };

  useEffect(() => { fetchRows(); }, [selectedContentTypeId, selectedAirline]);

  const handleAdd = async ({ min_kg, max_kg, price }: { min_kg: number; max_kg: number | null; price: number }) => {
    const { error } = await supabase.from('special_goods_rates').insert({
      content_type_id: selectedContentTypeId,
      airline: selectedAirline,
      min_kg,
      max_kg,
      rate_per_kg: price,
    });
    if (error) {
      showToast({ message: `Failed to add bracket: ${error.message}`, type: 'error' });
      return;
    }
    fetchRows();
  };

  // Optimistic update -- rolls back on failure, same pattern as
  // ExcessBaggageAirlines.tsx/ContentTypes.tsx.
  const handleUpdateField = async (id: string, field: 'min_kg' | 'max_kg' | 'price', value: number | null) => {
    const prev = rows;
    const column = field === 'price' ? 'rate_per_kg' : field;
    setRows(cur => cur.map(r => r.id === id ? { ...r, [column]: value } as RateRow : r));
    const { error } = await supabase.from('special_goods_rates').update({ [column]: value, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      setRows(prev);
      showToast({ message: `Failed to save change: ${error.message}`, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const prevRows = rows;
    setRows(cur => cur.filter(r => r.id !== id));
    const { error } = await supabase.from('special_goods_rates').delete().eq('id', id);
    if (error) {
      setRows(prevRows);
      showToast({ message: `Failed to remove bracket: ${error.message}`, type: 'error' });
      return;
    }
    showToast({ message: 'Bracket removed', type: 'success' });
  };

  const tiers: KgTier[] = rows.map(r => ({ id: r.id, min_kg: r.min_kg, max_kg: r.max_kg, price: r.rate_per_kg }));

  return (
    <main className="flex flex-col h-full bg-[var(--color-obsidian)] overflow-y-auto">
      <div className="ehi-view-header">
        <BackButton onClick={onBack} />
        <div className="text-center">
          <div className="text-[12px] font-bold text-[var(--color-foreground)]">Special Goods Rates</div>
          <div className="text-[10px] font-mono text-[var(--color-muted)]">Synced across all devices</div>
        </div>
        <div className="w-8" />
      </div>

      <div className="ehi-page-body px-4 pt-4 pb-6 space-y-3">
        <div className="bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] rounded-xl p-3">
          <p className="text-[11px] text-[var(--color-accent-cobalt)] font-sans leading-relaxed">
            Set per-airline weight brackets for content types flagged "special goods" in Content Types. When
            staff pick this content type + airline at intake, the matching bracket's rate overrides the
            normal route rate. Flag more content types from the Content Types screen.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size={20} className="animate-spin text-[var(--color-accent-amber)]" />
          </div>
        ) : contentTypes.length === 0 ? (
          <div className="ehi-card p-6 text-center space-y-2">
            <PackageSearch size={24} className="mx-auto text-[var(--color-muted)]" />
            <div className="text-[12px] text-[var(--color-muted)]">
              No content types are flagged as special goods yet. Flag one from Content Types first.
            </div>
          </div>
        ) : (
          <>
            <div className="ehi-card p-4 space-y-3">
              <div>
                <label htmlFor="sg-content-type" className="text-[9px] font-mono text-[var(--color-muted)] block mb-1">SPECIAL GOOD</label>
                <select
                  id="sg-content-type"
                  value={selectedContentTypeId}
                  onChange={(e) => setSelectedContentTypeId(e.target.value)}
                  className="w-full ehi-input"
                >
                  {contentTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sg-airline" className="text-[9px] font-mono text-[var(--color-muted)] block mb-1">AIRLINE</label>
                <select
                  id="sg-airline"
                  value={selectedAirline}
                  onChange={(e) => setSelectedAirline(e.target.value)}
                  className="w-full ehi-input"
                >
                  {airlines.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {rowsLoading ? (
              <div className="flex justify-center py-8">
                <Loader size={18} className="animate-spin text-[var(--color-accent-amber)]" />
              </div>
            ) : (
              <KgTierEditor
                tiers={tiers}
                priceLabel="RATE (₦/KG)"
                priceUnit="RATE (₦/KG)"
                itemLabel="rate bracket"
                onAdd={handleAdd}
                onUpdateField={handleUpdateField}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
};
