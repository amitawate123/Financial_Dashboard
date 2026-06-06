import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0 : 8,
        padding: compact ? 8 : '8px 12px',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text-2)',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        transition: 'all var(--transition)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text)';
        e.currentTarget.style.borderColor = 'var(--border-2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-2)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {!compact && (isDark ? 'Light mode' : 'Dark mode')}
    </button>
  );
}
