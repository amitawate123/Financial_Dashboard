import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Wallet, ArrowUpRight, ArrowDownRight, Percent,
  Tag, CalendarDays,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { dashboardAPI } from '../api/client';
import { Card, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTransactionUpdates } from '../hooks/useTransactionUpdates';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#059669', '#ea580c'];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        boxShadow: 'var(--shadow-md)',
        maxWidth: 220,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload
        .filter((p) => p.value > 0)
        .map((p) => (
          <div key={p.name} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ textTransform: 'capitalize' }}>{cap(p.name)}</span>
            <span style={{ fontWeight: 500 }}>{fmt(p.value)}</span>
          </div>
        ))}
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)', fontWeight: 600 }}>
        Total: {fmt(total)}
      </div>
    </div>
  );
};

function InsightCard({ label, value, sub, icon: Icon, color }) {
  return (
    <Card style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{label}</div>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={16} color={color || 'var(--text-2)'} />
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: color || 'var(--text)' }}>
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 6, fontSize: '12px', color: 'var(--text-3)' }}>{sub}</div>
      )}
    </Card>
  );
}

function ChartEmpty({ message }) {
  return (
    <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 14 }}>
      {message}
    </div>
  );
}

export default function SmartDashboard() {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [categoryStack, setCategoryStack] = useState({ categories: [], months: [], year: new Date().getFullYear() });
  const [loading, setLoading] = useState(true);

  const loadInsights = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    return Promise.all([
      dashboardAPI.insights(),
      dashboardAPI.weekly(),
      dashboardAPI.categoryStack({ type: 'expense', top: 6 }),
    ])
      .then(([insightsRes, weeklyRes, stackRes]) => {
        setInsights(insightsRes.data.data);
        setWeekly(weeklyRes.data.data || []);
        setCategoryStack(stackRes.data.data || { categories: [], months: [], year: new Date().getFullYear() });
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  useTransactionUpdates(useCallback(() => loadInsights(true), [loadInsights]));

  const expenseStackData = useMemo(() => {
    const { categories, months } = categoryStack;
    if (!categories?.length) return [];
    return months.filter((row) => categories.some((c) => row[c] > 0));
  }, [categoryStack]);

  const weeklyStackData = useMemo(
    () => weekly.filter((w) => w.income > 0 || w.expenses > 0),
    [weekly]
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Spinner size={28} />
      </div>
    );
  }

  const topCategory = insights?.topSpendingCategory
    ? cap(insights.topSpendingCategory)
    : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--text-3)',
              marginBottom: 12,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>
            Smart Dashboard
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            Detailed insights for {insights?.monthLabel || 'this month'}
            {user?.name ? ` · ${user.name}` : ''}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        <InsightCard
          label="Current Balance"
          value={fmt(insights?.currentBalance || 0)}
          sub="All-time income minus expenses"
          icon={Wallet}
          color={(insights?.currentBalance || 0) >= 0 ? 'var(--accent)' : 'var(--red)'}
        />
        <InsightCard
          label="This Month Income"
          value={fmt(insights?.thisMonthIncome || 0)}
          sub={insights?.monthLabel}
          icon={ArrowUpRight}
          color="var(--green)"
        />
        <InsightCard
          label="This Month Expense"
          value={fmt(insights?.thisMonthExpense || 0)}
          sub={insights?.monthLabel}
          icon={ArrowDownRight}
          color="var(--red)"
        />
        <InsightCard
          label="Savings Rate"
          value={`${insights?.savingsRate ?? 0}%`}
          sub="(Income − Expense) ÷ Income this month"
          icon={Percent}
          color={(insights?.savingsRate ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'}
        />
        <InsightCard
          label="Top Spending Category"
          value={topCategory}
          sub={
            insights?.topSpendingCategoryAmount
              ? `${fmt(insights.topSpendingCategoryAmount)} this month`
              : 'No expenses this month'
          }
          icon={Tag}
          color="var(--accent)"
        />
        <InsightCard
          label="Average Daily Spend"
          value={fmt(insights?.averageDailySpend || 0)}
          sub="This month’s expenses ÷ days elapsed"
          icon={CalendarDays}
          color="var(--text-2)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: 4 }}>
            Expenses by Category (Stacked)
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
            Top categories per month · {categoryStack.year}
          </p>
          {expenseStackData.length === 0 ? (
            <ChartEmpty message="No expense data for stacked chart yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={expenseStackData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="monthName"
                  tick={{ fontSize: 11, fill: 'var(--text-3)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-3)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>
                      {cap(value)}
                    </span>
                  )}
                />
                {categoryStack.categories.map((category, i) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="expenses"
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    radius={i === categoryStack.categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card style={{ padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: 4 }}>
            Weekly Cash Flow (Stacked)
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
            Income and expenses combined per week (last 6 weeks)
          </p>
          {weeklyStackData.length === 0 ? (
            <ChartEmpty message="No weekly data for stacked chart yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyStackData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: 'var(--text-3)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.replace(/^\d{4}-/, '')}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-3)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>
                      {value}
                    </span>
                  )}
                />
                <Bar dataKey="income" name="Income" stackId="flow" fill="#16a34a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" stackId="flow" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
