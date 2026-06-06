import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

export default function AuthPageShell({ title, subtitle, children, footer }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>
          ← Home
        </Link>
        <ThemeToggle compact />
      </div>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              background: 'var(--text)',
              borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <TrendingUp size={22} color="var(--logo-fg)" />
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>{subtitle}</p>
          )}
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            boxShadow: 'var(--shadow)',
          }}
        >
          {children}
        </div>

        {footer}
      </div>
    </div>
  );
}

export function AuthFooterLink({ children }) {
  return (
    <p style={{ textAlign: 'center', marginTop: 20, fontSize: '13px', color: 'var(--text-3)' }}>
      {children}
    </p>
  );
}

export function AuthLink({ to, children }) {
  return (
    <Link to={to} style={{ color: 'var(--accent)', fontWeight: 500 }}>
      {children}
    </Link>
  );
}
