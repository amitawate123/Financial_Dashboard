import { useState } from 'react';
import { authAPI } from '../api/client';
import { Button, Input, Alert } from '../components/ui';
import AuthPageShell, { AuthFooterLink, AuthLink } from '../components/auth/AuthPageShell';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Forgot password"
      subtitle="We’ll email you a reset link if an account exists"
      footer={
        <AuthFooterLink>
          Remember your password? <AuthLink to="/login">Sign in</AuthLink>
        </AuthFooterLink>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Alert type="error" message={error} />
        <Alert type="success" message={message} />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Button type="submit" loading={loading} style={{ width: '100%' }}>
          Send reset link
        </Button>
      </form>
    </AuthPageShell>
  );
}
