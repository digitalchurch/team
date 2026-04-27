import React, {useEffect, useMemo, useState} from 'react';
import Layout from '@theme/Layout';
import {useHistory, useLocation} from '@docusaurus/router';
import {
  AUTH_ROUTE_PATH,
  DEFAULT_AUTH_REDIRECT_PATH,
} from '../auth/config';
import {loginWithDigitalChurch} from '../auth/api';
import {sanitizeInternalRedirect} from '../auth/redirect';
import {clearSession, loadSession, saveSession} from '../auth/session';
import styles from './auth.module.css';

export default function AuthPage() {
  const history = useHistory();
  const location = useLocation();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const rawRedirect = params.get('redirect');
    return sanitizeInternalRedirect(rawRedirect, DEFAULT_AUTH_REDIRECT_PATH);
  }, [location.search]);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      history.replace(redirectTarget);
    }
  }, [history, redirectTarget]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const origin = typeof window !== 'undefined'
        ? window.location.origin
        : 'https://digitalchurch.team';

      const response = await loginWithDigitalChurch({
        emailOrPhone: emailOrPhone.trim(),
        password,
        redirectTo: `${origin}${redirectTarget}`,
      });

      saveSession(response.user);
      history.replace(redirectTarget);
    } catch (error) {
      setErrorMessage(error.message || 'Sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    clearSession();
    history.replace(AUTH_ROUTE_PATH);
  }

  return (
    <Layout title="Sign in" description="Sign in to access Digital Church Team docs" noNavbar noFooter>
      <main className={styles.page}>
        <section className={styles.card}>
          <h1 className={styles.title}>Digital Church Team</h1>
          <p className={styles.subtitle}>Sign in with your digitalchurch.dev account</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label} htmlFor="email_or_phone">
              Email or username
            </label>
            <input
              id="email_or_phone"
              className={styles.input}
              type="text"
              name="email_or_phone"
              autoComplete="username"
              value={emailOrPhone}
              onChange={(event) => setEmailOrPhone(event.target.value)}
              required
            />

            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className={styles.input}
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

            <button className={styles.submit} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <button className={styles.linkButton} type="button" onClick={handleLogout}>
            Clear local session
          </button>
        </section>
      </main>
    </Layout>
  );
}
