import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useI18n } from '../hooks/useI18n.js';
import { Brand } from '../components/common/Brand.jsx';
import { Button } from '../components/common/Button.jsx';
import { TextField } from '../components/common/TextField.jsx';
import { InlineNotice } from '../components/feedback/InlineNotice.jsx';

function mapAuthError(error, t) {
  if (!error) return '';
  const message = String(error.message || '').toLowerCase();
  if (message.includes('invalid login credentials')) return t('auth.errorInvalidCredentials');
  if (message.includes('password')) return t('auth.errorWeakPassword');
  return t('auth.errorGeneric');
}

export function LoginPage() {
  const { t } = useI18n();
  const { isAuthenticated, signIn, signUp } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname ?? '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setConfirmationSent(false);
    setIsSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
      } else {
        const result = await signUp(email, password);
        if (!result.session) {
          setConfirmationSent(true);
        }
      }
    } catch (submitError) {
      setError(mapAuthError(submitError, t));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <Brand />
        <h1>{mode === 'signIn' ? t('auth.signInTitle') : t('auth.signUpTitle')}</h1>

        {error && <InlineNotice tone="danger">{error}</InlineNotice>}
        {confirmationSent && <InlineNotice tone="success">{t('auth.confirmEmailSent')}</InlineNotice>}

        <form onSubmit={handleSubmit} className="auth-form">
          <TextField
            id="auth-email"
            type="email"
            label={t('auth.email')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <TextField
            id="auth-password"
            type="password"
            label={t('auth.password')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (mode === 'signIn' ? t('auth.signingIn') : t('auth.signingUp'))
              : (mode === 'signIn' ? t('auth.signIn') : t('auth.signUp'))}
          </Button>
        </form>

        <button
          type="button"
          className="auth-page__switch"
          onClick={() => {
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
            setError('');
            setConfirmationSent(false);
          }}
        >
          {mode === 'signIn' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}
        </button>
      </div>
    </div>
  );
}
