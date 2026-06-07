import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Alert } from '../components/ui';
import AuthPageShell, { AuthFooterLink, AuthLink } from '../components/auth/AuthPageShell';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await register(form);
      if (result?.requiresVerification) {
        setSuccess(result.message || 'Check your email to verify your account.');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      const details = data?.errors?.map((e) => `${e.field}: ${e.message}`).join(' · ');
      setError(details || data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Create account"
      subtitle="Join the finance dashboard"
      footer={
        <AuthFooterLink>
          Already have an account? <AuthLink to="/login">Sign in</AuthLink>
        </AuthFooterLink>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Alert type="error" message={error} />
        <Alert type="success" message={success} />
        <Input label="Full name" value={form.name} onChange={set('name')} placeholder="Jane Doe" required />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="Min. 6 characters"
          required
        />
        <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 4 }}>
          Create account
        </Button>
      </form>
    </AuthPageShell>
  );
}
