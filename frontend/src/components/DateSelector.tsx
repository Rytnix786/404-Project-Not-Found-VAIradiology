'use client';

import React from 'react';
import { useDate } from '@/context/DateContext';

/**
 * DateSelector — standalone presentational component.
 * Emits date changes via context. No task-fetching logic.
 */
export default function DateSelector() {
  const { selectedDate, setSelectedDate, getTodayString } = useDate();

  const shift = (days: number) => {
    const d = new Date(`${selectedDate}T12:00:00`); // noon to avoid DST edge cases
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === getTodayString();

  // Friendly display label
  const label = (() => {
    const today = getTodayString();
    const yesterday = (() => {
      const d = new Date(`${today}T12:00:00`);
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();
    const tomorrow = (() => {
      const d = new Date(`${today}T12:00:00`);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })();

    if (selectedDate === today) return 'Today';
    if (selectedDate === yesterday) return 'Yesterday';
    if (selectedDate === tomorrow) return 'Tomorrow';

    return new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  })();

  return (
    <div className="flex items-center gap-1.5">
      {/* Prev day */}
      <button
        onClick={() => shift(-1)}
        className="btn-icon"
        aria-label="Previous day"
        style={{ width: '28px', height: '28px' }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Date display pill */}
      <div
        className="relative flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] transition-colors-fast"
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-default)',
          minWidth: '120px',
          justifyContent: 'center',
        }}
      >
        <span
          className="text-sm font-medium select-none"
          style={{ color: isToday ? 'var(--accent)' : 'var(--ink-primary)' }}
        >
          {label}
        </span>
        {/* Hidden native date input for direct picker access */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          aria-label="Select date"
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          tabIndex={-1}
        />
      </div>


      {/* Next day */}
      <button
        onClick={() => shift(1)}
        className="btn-icon"
        aria-label="Next day"
        style={{ width: '28px', height: '28px' }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Today shortcut — only visible when not on today */}
      {!isToday && (
        <button
          onClick={() => setSelectedDate(getTodayString())}
          className="btn-ghost text-xs py-1 px-2.5 animate-fade-in"
          style={{ height: '28px' }}
        >
          Today
        </button>
      )}
    </div>
  );
}
