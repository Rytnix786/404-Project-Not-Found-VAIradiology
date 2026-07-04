'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import TaskCard, { Task } from './TaskCard';

interface ColumnProps {
  status: 'todo' | 'in_progress' | 'done';
  title: string;
  tasks: Task[];
  onAddTask: (status: 'todo' | 'in_progress' | 'done') => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
}

/** Accent stripe per column status — a single top line, not a thick side border */
const STATUS_CONFIG = {
  todo:        { accent: 'var(--ink-tertiary)' },
  in_progress: { accent: 'var(--warn)' },
  done:        { accent: 'var(--positive)' },
} as const;

export default function Column({ status, title, tasks, onAddTask, onEditTask, onDeleteTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  return (
    <div
      style={{
        background:   'var(--surface-raised)',
        border:       `1px solid ${isOver ? 'var(--border-default)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-xl)',
        display:      'flex',
        flexDirection: 'column',
        minWidth:     '260px',
        transition:   'border-color 120ms var(--ease-out)',
        overflow:     'hidden',  /* clips the top accent stripe */
      }}
    >
      {/* Top accent stripe — 2px, column identity at a glance */}
      <div style={{ height: '2px', background: config.accent, flexShrink: 0 }} />

      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: 'var(--ink-primary)' }}
          >
            {title}
          </span>
          <span
            className="badge badge-neutral font-data"
            style={{ fontSize: '0.625rem' }}
          >
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTask(status)}
          className="btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', height: '26px' }}
          aria-label={`Add task to ${title}`}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add
        </button>
      </div>

      {/* Droppable task list */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2.5 p-3 overflow-y-auto"
        style={{
          minHeight: '320px',
          background: isOver ? 'var(--accent-surface)' : 'transparent',
          transition: 'background 120ms var(--ease-out)',
        }}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        ) : (
          <div
            className="flex-1 flex items-center justify-center rounded-[var(--radius-lg)] p-6 text-center"
            style={{
              border: '1px dashed var(--border-subtle)',
              minHeight: '80px',
            }}
          >
            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              {isOver ? 'Drop here' : 'No tasks'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
