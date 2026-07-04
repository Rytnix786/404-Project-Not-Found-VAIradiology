'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DateProvider } from '@/context/DateContext';
import DateSelector from '@/components/DateSelector';
import Board from '@/components/Board';

export default function TasksPage() {
  const { user, logout } = useAuth();

  return (
    <DateProvider>
      <div
        className="min-h-dvh flex flex-col"
        style={{ background: 'var(--surface-base)', color: 'var(--ink-primary)' }}
      >
        {/* ── Top Navbar ─────────────────────────────────────────────── */}
        <nav
          className="sticky top-0 z-40 flex items-center justify-between px-5 h-12"
          style={{
            background: 'rgba(13,13,15,0.85)',
            borderBottom: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Brand + breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-data text-xs font-medium transition-colors-fast"
              style={{ color: 'var(--ink-primary)', letterSpacing: '0.08em' }}
            >
              404_PROJECT
            </Link>
            <span
              aria-hidden="true"
              className="select-none"
              style={{ color: 'var(--border-default)', fontSize: '0.75rem' }}
            >/</span>
            <span className="text-sm font-medium" style={{ color: 'var(--ink-secondary)' }}>
              Tasks
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <Link href="/annotate" className="nav-link text-sm">
              Annotate
            </Link>
            <div
              className="h-4"
              style={{ width: '1px', background: 'var(--border-default)' }}
              aria-hidden="true"
            />
            <span className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
              {user?.email}
            </span>
            <button onClick={logout} className="btn-ghost text-xs py-1 px-3">
              Sign out
            </button>
          </div>
        </nav>

        {/* ── Page Header ────────────────────────────────────────────── */}
        <div
          className="px-5 pt-6 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
              Task board
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--ink-tertiary)' }}>
              Drag cards between columns to update status. Filtered by date.
            </p>
          </div>

          {/* Date navigator lives here as a standalone component */}
          <DateSelector />
        </div>

        {/* ── Board ──────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-h-0 px-5 py-5">
          <Board />
        </main>
      </div>
    </DateProvider>
  );
}
