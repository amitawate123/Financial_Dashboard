import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api/client';
import { Button, Input, Alert } from '../components/ui';
import AuthPageShell, { AuthFooterLink, AuthLink } from '../components/auth/AuthPageShell';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword({ token, password });
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Request a new link.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthPageShell
        title="Reset password"
        subtitle="Invalid link"
        footer={
          <AuthFooterLink>
            <AuthLink to="/forgot-password">Request a new link</AuthLink>
          </AuthFooterLink>
        }
      >
        <Alert type="error" message="No reset token found. Use the link from your email." />
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="New password"
      subtitle="Choose a strong password for your account"
      footer={
        <AuthFooterLink>
          <AuthLink to="/login">Back to sign in</AuthLink>
        </AuthFooterLink>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Alert type="error" message={error} />
        <Alert type="success" message={success} />
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 6 characters"
          required
          minLength={6}
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
          required
          minLength={6}
        />
        <Button type="submit" loading={loading} style={{ width: '100%' }}>
          Update password
        </Button>
      </form>
    </AuthPageShell>
  );
}
