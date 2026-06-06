import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, Spinner } from '../components/ui';
import AuthPageShell, { AuthFooterLink, AuthLink } from '../components/auth/AuthPageShell';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeAuthFromResponse } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(token ? 'loading' : 'missing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    authAPI
      .verifyEmail({ token })
      .then(async (res) => {
        await completeAuthFromResponse(res.data);
        setStatus('success');
        setMessage(res.data.message || 'Email verified.');
        setTimeout(() => navigate('/dashboard'), 1500);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      });
  }, [token, navigate, completeAuthFromResponse]);

  return (
    <AuthPageShell
      title="Verify email"
      subtitle={
        status === 'loading'
          ? 'Confirming your address…'
          : status === 'success'
            ? 'You’re all set'
            : 'Link invalid or expired'
      }
      footer={
        <AuthFooterLink>
          <AuthLink to="/login">Back to sign in</AuthLink>
        </AuthFooterLink>
      }
    >
      {status === 'loading' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <Spinner size={28} />
        </div>
      )}
      {status === 'missing' && (
        <Alert type="error" message="No verification token in the link. Check your email or request a new one." />
      )}
      {status === 'success' && <Alert type="success" message={message} />}
      {status === 'error' && (
        <>
          <Alert type="error" message={message} />
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
            <AuthLink to="/login">Sign in</AuthLink> to resend verification from the login page.
          </p>
        </>
      )}
    </AuthPageShell>
  );
}
