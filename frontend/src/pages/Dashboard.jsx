import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Wallet, LayoutGrid } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { dashboardAPI } from '../api/client';
import { Card, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTransactionUpdates } from '../hooks/useTransactionUpdates';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#059669','#ea580c'];

function StatCard({ label, value, icon: Icon, trend, color }) {
  return (
    <Card style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{label}</div>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color || 'var(--text-2)'} />
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: color || 'var(--text)' }}>{value}</div>
      {trend !== undefined && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: trend >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          Net {trend >= 0 ? 'surplus' : 'deficit'}
        </div>
      )}
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8 }}>
          <span style={{ textTransform: 'capitalize' }}>{p.name}:</span>
          <span style={{ fontWeight: 500 }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary]     = useState(null);
  const [monthly, setMonthly]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent]       = useState([]);
  const [loading, setLoading]     = useState(true);

  const loadDashboard = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    return Promise.all([
      dashboardAPI.summary(),
      dashboardAPI.monthly(),
      dashboardAPI.categories(),
      dashboardAPI.recent({ limit: 6 }),
    ])
      .then(([s, m, c, r]) => {
        setSummary(s.data.data);
        setMonthly(m.data.data.months.filter((mo) => mo.income > 0 || mo.expenses > 0));
        const grouped = {};
        c.data.data.forEach(({ category, total }) => {
          grouped[category] = (grouped[category] || 0) + total;
        });
        setCategories(
          Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
        );
        setRecent(r.data.data);
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useTransactionUpdates(useCallback(() => loadDashboard(true), [loadDashboard]));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner size={28} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            {user?.name ? `${user.name}'s` : 'Your'} financial overview
          </p>
        </div>
        <Link
          to="/smart-dashboard"
          title="See detailed view"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-2)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent)';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-2)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <LayoutGrid size={16} />
          Detailed view
        </Link>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatCard label="Total Income"   value={fmt(summary?.totalIncome || 0)}   icon={ArrowUpRight}   color="var(--green)" />
        <StatCard label="Total Expenses" value={fmt(summary?.totalExpenses || 0)} icon={ArrowDownRight} color="var(--red)" />
        <StatCard label="Net Balance"    value={fmt(summary?.netBalance || 0)}    icon={Wallet}
          color={(summary?.netBalance || 0) >= 0 ? 'var(--accent)' : 'var(--red)'}
          trend={summary?.netBalance} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Monthly trend */}
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: 20 }}>Monthly Trends</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false}
                tickFormatter={v => v.slice(0,3)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income"   stroke="#16a34a" strokeWidth={2} fill="url(#gIncome)"  name="income" />
              <Area type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} fill="url(#gExpense)" name="expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Category pie */}
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: 20 }}>By Category</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categories} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                dataKey="value" paddingAngle={3}>
                {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px' }}>
          Recent Activity
        </div>
        <div>
          {recent.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>No recent activity</div>
          )}
          {recent.map((tx, i) => (
            <div key={tx._id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: tx.type === 'income' ? 'var(--green-bg)' : 'var(--red-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {tx.type === 'income' ? '↑' : '↓'}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>{tx.category}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{fmtDate(tx.date)} · {tx.notes || '—'}</div>
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
