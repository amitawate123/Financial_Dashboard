import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle';
import ProfileMenu from '../profile/ProfileMenu';

const NAV = [
  { to: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard, roles: ['user', 'admin'] },
  { to: '/transactions',  label: 'Transactions', icon: ArrowLeftRight,  roles: ['user', 'admin'] },
  { to: '/users',         label: 'Users',        icon: Users,           roles: ['admin'] },
];

export default function Layout({ children }) {
  const { can } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--text)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color="var(--logo-fg)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.02em' }}>Fintrack</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Dashboard</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.filter(n => can(n.roles)).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              fontSize: '14px', fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--text)' : 'var(--text-2)',
              background: isActive ? 'var(--bg)' : 'transparent',
              transition: 'all var(--transition)',
              textDecoration: 'none',
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Theme */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar — profile top right */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '12px 36px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <ProfileMenu />
        </header>

        <main style={{ flex: 1, padding: '32px 36px', animation: 'fadeIn 250ms ease' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
