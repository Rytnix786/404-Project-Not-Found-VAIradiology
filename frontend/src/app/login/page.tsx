'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function LoginForm() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/tasks';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'default' | 'loading' | 'error' | 'success'>('default');
  const [errorMessage, setErrorMessage] = useState('');
  const [isWakingUp, setIsWakingUp] = useState(false);

  // Background container pre-warming on login page mount
  useEffect(() => {
    // Fire a silent GET request to wake up Render container if it's sleeping
    fetch(`${API_URL}/api/health/`, { cache: 'no-store' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, authLoading, router, redirectPath]);

  // Handle cold-start status indicator when login takes longer than 2.5s
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'loading') {
      timer = setTimeout(() => setIsWakingUp(true), 2500);
    } else {
      setIsWakingUp(false);
    }
    return () => clearTimeout(timer);
  }, [status]);

  const performLogin = async (targetEmail: string, targetPass: string) => {
    if (!targetEmail || !targetPass) {
      setStatus('error');
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    setIsWakingUp(false);

    try {
      const result = await login(targetEmail, targetPass);
      if (result.success) {
        setStatus('success');
        setTimeout(() => {
          router.replace(redirectPath);
        }, 400);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Invalid email or password.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Connection to server failed. Please retry.');
    }
  };

  const handleInstantDemoSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    setEmail('demo@404.com');
    setPassword('password123');
    performLogin('demo@404.com', 'password123');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password);
  };

  const isFormDisabled = status === 'loading' || status === 'success';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* ⚡ Instant Demo Sign-In Banner */}
      <div
        onClick={handleInstantDemoSignIn}
        className="group flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-all border"
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
        }}
        title="Click for 1-tap instant demo sign-in"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm">⚡</span>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold" style={{ color: '#E0E7FF' }}>
              Instant Demo Sign In
            </span>
            <span className="text-[11px]" style={{ color: '#9CA3AF' }}>
              demo@404.com · password123
            </span>
          </div>
        </div>
        <button
          type="button"
          tabIndex={-1}
          className="text-[11px] font-semibold px-2.5 py-1 rounded transition-all group-hover:scale-105"
          style={{ color: '#818CF8', background: 'rgba(99, 102, 241, 0.2)' }}
        >
          1-Tap Sign In →
        </button>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: '#9CA3AF' }}
        >
          Email Address
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') setStatus('default');
            }}
            disabled={isFormDisabled}
            placeholder="demo@404.com"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
            style={{
              background: '#1C2029',
              color: '#F3F4F6',
              border: status === 'error' ? '1px solid #F87171' : '1px solid #333846',
            }}
            autoComplete="email"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: '#9CA3AF' }}
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (status === 'error') setStatus('default');
            }}
            disabled={isFormDisabled}
            placeholder="••••••••••"
            className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg outline-none transition-all"
            style={{
              background: '#1C2029',
              color: '#F3F4F6',
              border: status === 'error' ? '1px solid #F87171' : '1px solid #333846',
            }}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs p-1 rounded hover:text-white transition-colors"
            style={{ color: '#9CA3AF' }}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Cold-start status info banner */}
      {status === 'loading' && isWakingUp && (
        <div
          role="status"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs animate-fade-in"
          style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)', color: '#FBBF24' }}
        >
          <span className="w-2 h-2 rounded-full animate-ping" style={{ background: '#FBBF24', flexShrink: 0 }} />
          <span>Waking backend server on Render free tier (takes ~15s on first boot)...</span>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div
          role="alert"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm animate-fade-in"
          style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: '#F87171', flexShrink: 0 }}>
            <path d="M8 5v4M8 11h.01M1.5 13.5l6.19-11a.35.35 0 01.62 0l6.19 11a.35.35 0 01-.31.5H1.81a.35.35 0 01-.31-.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: '#F87171', fontSize: '0.8125rem' }}>{errorMessage}</span>
        </div>
      )}

      {/* Success state */}
      {status === 'success' && (
        <div
          role="status"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm animate-fade-in"
          style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: '#34D399', flexShrink: 0 }}>
            <path d="M3 8l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: '#34D399', fontSize: '0.8125rem' }}>Authenticated — redirecting to workspace…</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isFormDisabled}
        className="w-full py-2.5 px-4 font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
        style={{
          background: status === 'success' ? '#10B981' : '#6366F1',
          color: '#FFFFFF',
          opacity: isFormDisabled && status !== 'success' ? 0.75 : 1,
          cursor: isFormDisabled ? 'wait' : 'pointer',
          boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.35)',
        }}
      >
        {status === 'loading' ? (
          <>
            <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span>Signing in…</span>
          </>
        ) : status === 'success' ? (
          <span>Signed in</span>
        ) : (
          <span>Sign in to Workspace</span>
        )}
      </button>

    </form>
  );
}

export default function LoginPage() {
  return (
    <main
      className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0D0E12' }}
    >
      {/* Ambient Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.12), transparent 60%)',
        }}
      />

      <div className="w-full relative z-10" style={{ maxWidth: '400px' }}>

        {/* Brand Header */}
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-block font-mono text-xs font-bold tracking-widest px-2.5 py-1 rounded-full mb-3 transition-colors hover:bg-slate-800"
            style={{ color: '#818CF8', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
          >
            404_PROJECT v1.0
          </Link>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: '#F9FAFB' }}
          >
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#9CA3AF' }}>
            Sign in to access Kanban tasks &amp; image annotator
          </p>
        </div>

        {/* Grayish Slate Card */}
        <div
          className="p-6 rounded-2xl animate-slide-up"
          style={{
            background: '#15181E',
            border: '1px solid #2B2F3A',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.65)',
          }}
        >
          <Suspense
            fallback={
              <div className="py-12 text-center text-sm animate-pulse" style={{ color: '#9CA3AF' }}>
                Loading form…
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs" style={{ color: '#6B7280' }}>
          Protected by DRF Token Authentication ·{' '}
          <Link href="/" className="hover:underline" style={{ color: '#9CA3AF' }}>
            Back to Home
          </Link>
        </div>

      </div>
    </main>
  );
}
