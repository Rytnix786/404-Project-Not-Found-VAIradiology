'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/tasks';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'default' | 'loading' | 'error' | 'success'>('default');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, authLoading, router, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setStatus('error');
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const result = await login(email, password);
      if (result.success) {
        setStatus('success');
        setTimeout(() => {
          router.replace(redirectPath);
        }, 600);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Invalid email or password.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Connection error. Please try again.');
    }
  };

  const isFormDisabled = status === 'loading' || status === 'success';
  const isError = status === 'error';

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Email */}
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('default');
          }}
          disabled={isFormDisabled}
          placeholder="you@example.com"
          className={`field ${isError ? 'field-error' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
          autoComplete="email"
          required
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (status === 'error') setStatus('default');
          }}
          disabled={isFormDisabled}
          placeholder="••••••••••"
          className={`field ${isError ? 'field-error' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
          autoComplete="current-password"
          required
        />
      </div>

      {/* Error state */}
      {status === 'error' && (
        <div
          role="alert"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] animate-fade-in"
          style={{ background: 'var(--danger-surface)', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: 'var(--danger)', flexShrink: 0 }}>
            <path d="M8 5v4M8 11h.01M1.5 13.5l6.19-11a.35.35 0 01.62 0l6.19 11a.35.35 0 01-.31.5H1.81a.35.35 0 01-.31-.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>{errorMessage}</span>
        </div>
      )}

      {/* Success state */}
      {status === 'success' && (
        <div
          role="status"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] animate-fade-in"
          style={{ background: 'var(--positive-surface)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: 'var(--positive)', flexShrink: 0 }}>
            <path d="M3 8l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '0.8125rem', color: 'var(--positive)' }}>Authenticated — redirecting…</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isFormDisabled}
        className="btn-primary w-full py-2.5 mt-1"
        style={
          status === 'success'
            ? { background: 'var(--positive)', pointerEvents: 'none' }
            : status === 'loading'
            ? { opacity: 0.7, cursor: 'wait', pointerEvents: 'none' }
            : {}
        }
      >
        {status === 'loading' ? (
          <>
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Signing in…
          </>
        ) : status === 'success' ? (
          'Signed in'
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main
      className="min-h-dvh flex items-center justify-center p-4"
      style={{ background: 'var(--surface-base)' }}
    >
      {/* Subtle grain texture via pseudo-element would need CSS module; use solid surface instead */}
      <div className="w-full" style={{ maxWidth: '380px' }}>

        {/* Wordmark — left-aligned, not centred */}
        <div className="mb-8">
          <div
            className="font-data text-xs mb-5"
            style={{ color: 'var(--ink-tertiary)', letterSpacing: '0.12em' }}
          >
            404_PROJECT
          </div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--ink-primary)', lineHeight: 1.2 }}
          >
            Sign in to your workspace
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Tasks and annotation tools await.
          </p>
        </div>

        {/* Card */}
        <div
          className="p-6 card animate-slide-up"
          style={{ boxShadow: 'var(--shadow-modal, 0 24px 64px -12px rgba(0,0,0,0.6))' }}
        >
          <Suspense
            fallback={
              <div
                className="py-10 text-center text-sm animate-pulse"
                style={{ color: 'var(--ink-muted)' }}
              >
                Loading…
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

      </div>
    </main>
  );
}
