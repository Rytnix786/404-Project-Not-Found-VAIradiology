'use client';

/* Hallmark · component: page · genre: modern-minimal · theme: obsidian-mono
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

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

  // Redirect if already logged in
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
        // Let user see the success state for a brief second for visual feedback
        setTimeout(() => {
          router.replace(redirectPath);
        }, 800);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Invalid credentials.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  const isFormDisabled = status === 'loading' || status === 'success';

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-state={status}>
      {/* Email Input */}
      <div className="space-y-2">
        <label 
          htmlFor="email" 
          className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('default');
          }}
          disabled={isFormDisabled}
          placeholder="e.g. user@404workspace.com"
          className={`w-full px-4 py-3 bg-neutral-950 border ${
            status === 'error' ? 'border-red-800 focus:border-red-700 focus:ring-red-900' : 'border-neutral-800 focus:border-neutral-600 focus:ring-neutral-800'
          } rounded-lg text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:ring-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed`}
          required
            />
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label 
          htmlFor="password" 
          className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (status === 'error') setStatus('default');
          }}
          disabled={isFormDisabled}
          placeholder="••••••••"
          className={`w-full px-4 py-3 bg-neutral-950 border ${
            status === 'error' ? 'border-red-800 focus:border-red-700 focus:ring-red-900' : 'border-neutral-800 focus:border-neutral-600 focus:ring-neutral-800'
          } rounded-lg text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:ring-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed`}
          required
        />
      </div>

      {/* Error Message Box */}
      {status === 'error' && (
        <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg flex items-start gap-2.5">
          <span className="text-red-400 text-xs font-medium">
            {errorMessage}
          </span>
        </div>
      )}

      {/* Success Message Box */}
      {status === 'success' && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg flex items-center gap-2.5">
          <span className="text-emerald-400 text-xs font-medium">
            Authentication successful! Redirecting...
          </span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isFormDisabled}
        className={`w-full py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 select-none flex items-center justify-center gap-2 cursor-pointer ${
          status === 'loading'
            ? 'bg-neutral-800 text-neutral-500 cursor-wait'
            : status === 'success'
            ? 'bg-emerald-900 text-emerald-100'
            : 'bg-neutral-100 text-neutral-950 hover:bg-neutral-200 active:scale-[0.99] active:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {status === 'loading' ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Authenticating...
          </>
        ) : status === 'success' ? (
          <>
            <svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Logged In
          </>
        ) : (
          'Enter Workspace'
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 selection:bg-neutral-800 selection:text-neutral-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* Subtle top decoration hairline */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
        
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100 text-left font-mono">
            404_PROJECT
          </h1>
          <p className="text-sm text-neutral-400 mt-2 text-left">
            Authentication required to access tasks and annotations.
          </p>
        </header>

        <Suspense fallback={
          <div className="text-neutral-500 font-mono text-xs text-center py-12 animate-pulse">
            Loading authentication panel...
          </div>
        }>
          <LoginForm />
        </Suspense>

        <footer className="mt-8 pt-6 border-t border-neutral-800/60 flex justify-between items-center text-xs text-neutral-500 font-mono">
          <span>PORT: 3000</span>
          <span>SECURE_SESSION</span>
        </footer>
      </div>
    </main>
  );
}
