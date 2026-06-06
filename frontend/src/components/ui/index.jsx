import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

/* ── Button ─────────────────────────────────────────────────────────────────── */
export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:  'bg-[var(--text)] text-[var(--logo-fg)] hover:opacity-90 active:scale-[.98]',
    secondary:'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg)] active:scale-[.98]',
    ghost:    'text-[var(--text-2)] hover:bg-[var(--bg)] hover:text-[var(--text)]',
    danger:   'bg-[var(--red)] text-white hover:bg-red-700 active:scale-[.98]',
    success:  'bg-[var(--green)] text-white hover:bg-green-700 active:scale-[.98]',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ── Input ───────────────────────────────────────────────────────────────────── */
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>}
      <input
        style={{
          border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '8px 12px',
          fontSize: '14px',
          background: 'var(--surface)',
          color: 'var(--text)',
          outline: 'none',
          transition: 'border-color var(--transition)',
          width: '100%',
        }}
        onFocus={(e) => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--accent)'; }}
        onBlur={(e)  => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'; }}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

/* ── Select ──────────────────────────────────────────────────────────────────── */
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>}
      <select
        style={{
          border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '8px 12px',
          fontSize: '14px',
          background: 'var(--surface)',
          color: 'var(--text)',
          outline: 'none',
          cursor: 'pointer',
          width: '100%',
        }}
        {...props}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

/* ── Card ────────────────────────────────────────────────────────────────────── */
export function Card({ children, className = '', style = {} }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow)',
      ...style,
    }} className={className}>
      {children}
    </div>
  );
}

/* ── Badge ───────────────────────────────────────────────────────────────────── */
export function Badge({ children, color = 'default' }) {
  const colors = {
    default: { bg: 'var(--bg)', color: 'var(--text-2)', border: 'var(--border)' },
    green:   { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)' },
    red:     { bg: 'var(--red-bg)',   color: 'var(--red)',   border: 'var(--red-border)' },
    blue:    { bg: 'var(--accent-bg)',color: 'var(--accent)', border: 'var(--accent-border)' },
    amber:   { bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--amber-border)' },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '99px',
      fontSize: '12px', fontWeight: 500,
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
    }}>
      {children}
    </span>
  );
}

/* ── Spinner ─────────────────────────────────────────────────────────────────── */
export function Spinner({ size = 20 }) {
  return <Loader2 size={size} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />;
}

/* ── Empty State ─────────────────────────────────────────────────────────────── */
export function Empty({ icon: Icon, title, message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12, color: 'var(--text-3)' }}>
      {Icon && <Icon size={32} strokeWidth={1.5} />}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 500, color: 'var(--text-2)', marginBottom: 4 }}>{title}</div>
        {message && <div style={{ fontSize: '13px' }}>{message}</div>}
      </div>
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, maxWidth = 480 }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        background: 'rgba(0,0,0,.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 150ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          width: '100%',
          maxWidth,
          maxHeight: 'min(90vh, 640px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeUp 200ms ease',
        }}
      >
        {title && (
          <div
            style={{
              flexShrink: 0,
              padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <h3 id="modal-title" style={{ fontWeight: 600, fontSize: '15px', lineHeight: 1.3 }}>
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                color: 'var(--text-3)',
                cursor: 'pointer',
                lineHeight: 1,
                fontSize: 22,
                background: 'none',
                border: 'none',
                padding: 4,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, minHeight: 0 }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* ── Alert ───────────────────────────────────────────────────────────────────── */
export function Alert({ type = 'error', message }) {
  if (!message) return null;
  const styles = {
    error:   { bg: 'var(--red-bg)',   color: 'var(--red)',   border: 'var(--red-border)' },
    success: { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)' },
  };
  const s = styles[type];
  return (
    <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: '13px' }}>
      {message}
    </div>
  );
}

/* ── Pagination ──────────────────────────────────────────────────────────────── */
export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
      <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>← Prev</Button>
      <span style={{ fontSize: '13px', color: 'var(--text-2)', padding: '0 8px' }}>Page {page} of {pages}</span>
      <Button variant="secondary" size="sm" disabled={page === pages} onClick={() => onPage(page + 1)}>Next →</Button>
    </div>
  );
}
