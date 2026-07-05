'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface HealthData {
  status: string;
  message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const { isAuthenticated, logout, user } = useAuth();

  const [health, setHealth] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [pingTime, setPingTime] = useState<number | null>(null);

  const checkHealth = async (retries = 2) => {
    setHealth('checking');
    const startTime = performance.now();

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${API_URL}/api/health/`, { cache: 'no-store' });
        const duration = Math.round(performance.now() - startTime);
        if (res.ok) {
          const data = await res.json();
          setHealthData(data);
          setPingTime(duration);
          setHealth('connected');
          return;
        }
      } catch {
        if (attempt < retries) {
          // Render free tier cold start delay — wait 2.5s and retry
          await new Promise(resolve => setTimeout(resolve, 2500));
        }
      }
    }

    setHealth('disconnected');
    setHealthData(null);
  };

  useEffect(() => { checkHealth(); }, []);

  const healthLabel =
    health === 'checking'     ? 'Checking…' :
    health === 'connected'    ? 'Connected' :
                                'Unreachable';

  const healthColor =
    health === 'connected'    ? 'var(--positive)' :
    health === 'checking'     ? 'var(--warn)' :
                                'var(--danger)';

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--surface-base)', color: 'var(--ink-primary)' }}
    >
      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-5 h-12"
        style={{
          background: 'rgba(13,13,15,0.85)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="font-data text-xs font-medium"
            style={{ color: 'var(--ink-primary)', letterSpacing: '0.08em' }}
          >
            404_PROJECT
          </span>
          <span style={{ width: '1px', height: '14px', background: 'var(--border-default)', display: 'inline-block' }} aria-hidden="true" />
          <span className="font-data text-xs" style={{ color: 'var(--ink-tertiary)' }}>v1.0.0</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/tasks" className="nav-link text-sm">Tasks</Link>
          <Link href="/annotate" className="nav-link text-sm">Annotate</Link>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-default)' }} aria-hidden="true" />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>{user?.email}</span>
              <button onClick={logout} className="btn-ghost text-xs py-1 px-3">Sign out</button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary text-xs py-1.5 px-3">Sign in</Link>
          )}
        </div>
      </nav>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 py-14 flex flex-col gap-10">

        {/* Hero — left-aligned, not centred */}
        <section>
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ color: 'var(--ink-primary)', lineHeight: 1.2 }}
          >
            Take-Home Workspace
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)', maxWidth: '520px' }}>
            Confirm API connectivity, test route middleware safeguards, and verify CORS configuration below.
          </p>
        </section>

        {/* Health check card */}
        <section
          className="card p-5"
          aria-label="Backend connection status"
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between pb-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-3">
              {/* Status indicator */}
              <span className="relative flex" style={{ width: '10px', height: '10px' }}>
                {health === 'connected' && (
                  <span
                    className="animate-ping absolute inline-flex rounded-full"
                    style={{ inset: 0, background: 'var(--positive)', opacity: 0.5 }}
                  />
                )}
                <span
                  className="relative inline-flex rounded-full"
                  style={{ width: '10px', height: '10px', background: healthColor }}
                />
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                Backend connection
              </span>
              <span
                className="badge"
                style={{
                  color: healthColor,
                  background: health === 'connected' ? 'var(--positive-surface)' : health === 'checking' ? 'var(--warn-surface)' : 'var(--danger-surface)',
                  border: `1px solid ${health === 'connected' ? 'rgba(52,211,153,0.2)' : health === 'checking' ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}`,
                }}
              >
                {healthLabel}
              </span>
            </div>
            <button
              onClick={() => checkHealth(2)}
              disabled={health === 'checking'}
              className="btn-ghost text-xs disabled:opacity-50"
              style={{ height: '28px', padding: '0 0.625rem' }}
            >
              Ping
            </button>
          </div>

          {/* Diagnostics table */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-data" style={{ color: 'var(--ink-tertiary)' }}>ENDPOINT</span>
              <span className="font-data" style={{ color: 'var(--ink-secondary)' }}>{API_URL}/api/health/</span>
            </div>

            {health === 'connected' && pingTime !== null && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-data" style={{ color: 'var(--ink-tertiary)' }}>RESPONSE_TIME</span>
                  <span className="font-data" style={{ color: 'var(--positive)' }}>{pingTime}ms</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-data" style={{ color: 'var(--ink-tertiary)' }}>PAYLOAD</span>
                  <span className="font-data" style={{ color: 'var(--ink-secondary)' }}>{JSON.stringify(healthData)}</span>
                </div>
              </>
            )}

            {health === 'checking' && (
              <div className="text-xs animate-pulse" style={{ color: 'var(--ink-muted)' }}>
                Fetching diagnostics…
              </div>
            )}

            {health === 'disconnected' && (
              <div
                className="text-xs leading-relaxed mt-1"
                style={{ color: 'var(--danger)' }}
              >
                Could not reach Django API at port 8000. Ensure the backend is running ({' '}
                <code className="font-data">python manage.py runserver</code>
                {' '}) and that <code className="font-data">.env.local</code> is configured correctly.
              </div>
            )}
          </div>
        </section>

        {/* Feature cards */}
        <section
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          aria-label="Application sections"
        >
          {/* Tasks card */}
          <Link
            href="/tasks"
            className="card p-5 group block"
            style={{ textDecoration: 'none', transition: 'border-color 120ms var(--ease-out)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-data text-xs" style={{ color: 'var(--ink-tertiary)' }}>/tasks</span>
              <span className="badge badge-danger">Secure</span>
            </div>
            <h2 className="text-base font-semibold mb-1.5" style={{ color: 'var(--ink-primary)' }}>
              Kanban Board
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              Date-bound task organiser with drag-and-drop. Middleware redirects unauthenticated requests to login.
            </p>
            <span
              className="inline-flex items-center gap-1 mt-4 text-sm font-medium"
              style={{ color: 'var(--accent)', transition: 'gap 120ms var(--ease-out)' }}
            >
              Access Tasks
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>

          {/* Annotate card */}
          <Link
            href="/annotate"
            className="card p-5 group block"
            style={{ textDecoration: 'none', transition: 'border-color 120ms var(--ease-out)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-data text-xs" style={{ color: 'var(--ink-tertiary)' }}>/annotate</span>
              <span className="badge badge-danger">Secure</span>
            </div>
            <h2 className="text-base font-semibold mb-1.5" style={{ color: 'var(--ink-primary)' }}>
              Annotation Tool
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              Multi-image polygon drawing tool. Upload frames and draw vector shapes stored with normalised coordinates.
            </p>
            <span
              className="inline-flex items-center gap-1 mt-4 text-sm font-medium"
              style={{ color: 'var(--accent)', transition: 'gap 120ms var(--ease-out)' }}
            >
              Access Annotator
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer
        className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-5"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <span className="font-data text-xs" style={{ color: 'var(--ink-muted)' }}>
          © 2026 404_PROJECT
        </span>
        <div className="flex gap-5">
          <span className="font-data text-xs" style={{ color: 'var(--ink-muted)' }}>Backend: DRF + SQLite</span>
          <span className="font-data text-xs" style={{ color: 'var(--ink-muted)' }}>Frontend: Next.js 14</span>
        </div>
      </footer>
    </div>
  );
}
