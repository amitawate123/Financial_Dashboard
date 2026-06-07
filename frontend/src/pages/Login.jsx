import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Alert } from '../components/ui';
import AuthPageShell, { AuthFooterLink, AuthLink } from '../components/auth/AuthPageShell';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setNeedsVerification(false);
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
      }
      setError(data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    setInfo('');
    try {
      const res = await authAPI.resendVerification({ email: form.email });
      setInfo(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Sign in to your finance dashboard"
      footer={
        <AuthFooterLink>
          Don&apos;t have an account? <AuthLink to="/register">Register</AuthLink>
        </AuthFooterLink>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Alert type="error" message={error} />
        <Alert type="success" message={info} />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="you@example.com"
          required
        />
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Password</label>
            <AuthLink to="/forgot-password">Forgot password?</AuthLink>
          </div>
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder="••••••••"
            required
            style={{
              width: '100%',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '8px 12px',
              fontSize: 14,
              background: 'var(--surface)',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
        </div>
        <Button
          type="submit"
          variant="ghost"
          loading={loading}
          style={{ width: '100%', marginTop: 4, color: 'var(--text)', fontWeight: 600, fontSize: 14 }}
        >
          Sign in
        </Button>
        {needsVerification && form.email && (
          <Button type="button" variant="secondary" loading={resending} onClick={resendVerification} style={{ width: '100%' }}>
            Resend verification email
          </Button>
        )}
      </form>
    </AuthPageShell>
  );
}
