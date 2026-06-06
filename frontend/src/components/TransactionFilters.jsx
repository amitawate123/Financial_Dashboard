import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button, Select, Card, Input } from './ui';
import {
  DEFAULT_FILTERS,
  DATE_PRESETS,
  AMOUNT_SLIDER_MAX,
  AMOUNT_SLIDER_STEP,
  getFilterChips,
  hasActiveFilters,
} from '../utils/transactionFilters';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function AmountRangeSlider({ minAmount, maxAmount, onChange }) {
  const min = minAmount === '' ? 0 : Number(minAmount);
  const max = maxAmount === '' ? AMOUNT_SLIDER_MAX : Number(maxAmount);
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const loPct = (lo / AMOUNT_SLIDER_MAX) * 100;
  const hiPct = (hi / AMOUNT_SLIDER_MAX) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>
        <span>Amount range</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>
          {fmt(lo)} – {maxAmount === '' ? `${fmt(AMOUNT_SLIDER_MAX)}+` : fmt(hi)}
        </span>
      </div>
      <div style={{ position: 'relative', height: 28, marginBottom: 10 }}>
        <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: `${loPct}%`,
            width: `${hiPct - loPct}%`,
            height: 4,
            borderRadius: 2,
            background: 'var(--accent)',
          }}
        />
        <input
          type="range"
          min={0}
          max={AMOUNT_SLIDER_MAX}
          step={AMOUNT_SLIDER_STEP}
          value={lo}
          onChange={(e) => onChange({ minAmount: Number(e.target.value) === 0 ? '' : e.target.value, maxAmount })}
          className="amount-range-input"
          style={{ position: 'absolute', width: '100%', top: 4, zIndex: 3 }}
        />
        <input
          type="range"
          min={0}
          max={AMOUNT_SLIDER_MAX}
          step={AMOUNT_SLIDER_STEP}
          value={hi}
          onChange={(e) =>
            onChange({
              minAmount,
              maxAmount: Number(e.target.value) >= AMOUNT_SLIDER_MAX ? '' : e.target.value,
            })
          }
          className="amount-range-input"
          style={{ position: 'absolute', width: '100%', top: 4, zIndex: 4 }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Input
          label="Min (₹)"
          type="number"
          min={0}
          step={100}
          value={minAmount}
          onChange={(e) => onChange({ minAmount: e.target.value, maxAmount })}
          placeholder="0"
        />
        <Input
          label="Max (₹)"
          type="number"
          min={0}
          step={100}
          value={maxAmount}
          onChange={(e) => onChange({ minAmount, maxAmount: e.target.value })}
          placeholder="No max"
        />
      </div>
    </div>
  );
}

export default function TransactionFilters({ filters, onChange, categories, viewMode, exportSection }) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const patch = (updates) => onChange({ ...filters, ...updates, page: 1 });

  const toggleCategory = (cat) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    patch({ categories: next });
  };

  const chips = getFilterChips(filters, { viewMode });

  return (
    <Card style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            placeholder="Search notes or category…"
            value={filters.search}
            onChange={(e) => patch({ search: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: 14,
              background: 'var(--bg)',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
        </div>
        <Select value={filters.type} onChange={(e) => patch({ type: e.target.value })} style={{ flex: '0 0 130px' }}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => setAdvancedOpen((o) => !o)}>
          Advanced
          {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </Button>
      </div>

      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Active</span>
          {chips.map((chip) => (
            <span
              key={chip.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 99,
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-border)',
                textTransform: 'capitalize',
              }}
            >
              {chip.label}
              <button
                type="button"
                onClick={() => patch(chip.clear)}
                style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
                aria-label={`Remove ${chip.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <Button variant="ghost" size="sm" onClick={() => onChange({ ...DEFAULT_FILTERS })}>Clear all</Button>
        </div>
      )}

      {advancedOpen && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>Categories (multi-select)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((cat) => {
                const active = filters.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    style={{
                      padding: '5px 12px',
                      fontSize: 13,
                      fontWeight: 500,
                      borderRadius: 99,
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      background: active ? 'var(--accent-bg)' : 'var(--surface)',
                      color: active ? 'var(--accent)' : 'var(--text-2)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {viewMode === 'table' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>Date range</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DATE_PRESETS.map((preset) => {
                  const active = filters.datePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        patch({
                          datePreset: active ? '' : preset.id,
                          startDate: '',
                          endDate: '',
                        })
                      }
                      style={{
                        padding: '6px 14px',
                        fontSize: 13,
                        fontWeight: 500,
                        borderRadius: 99,
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        background: active ? 'var(--accent-bg)' : 'var(--surface)',
                        color: active ? 'var(--accent)' : 'var(--text-2)',
                        cursor: 'pointer',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                In calendar view, the visible month is always used for dates. Category and amount filters still apply.
              </p>
            </div>
          )}

          <AmountRangeSlider
            minAmount={filters.minAmount}
            maxAmount={filters.maxAmount}
            onChange={(amounts) => patch(amounts)}
          />
        </div>
      )}

      {exportSection}
    </Card>
  );
}
