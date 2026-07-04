'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  tags: string[];
  owner?: string;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

const PRIORITY_CONFIG = {
  high:   { label: 'High',   className: 'badge-danger' },
  medium: { label: 'Medium', className: 'badge-warn' },
  low:    { label: 'Low',    className: 'badge-neutral' },
} as const;

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id.toString(),
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
        cursor: 'grabbing',
      }
    : undefined;

  // Defensive rendering
  const title    = typeof task.title === 'string' && task.title.trim() ? task.title : '[Unnamed Task]';
  const tags     = Array.isArray(task.tags) ? task.tags : [];
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background:   isDragging ? 'var(--surface-overlay)' : 'var(--surface-raised)',
        border:       `1px solid ${isDragging ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow:    isDragging ? '0 8px 24px rgba(0,0,0,0.5)' : 'none',
        transition:   isDragging
          ? 'none'
          : 'border-color 120ms var(--ease-out), box-shadow 120ms var(--ease-out)',
      }}
      className={`flex flex-col gap-3 p-4 select-none group ${isDragging ? '' : 'hover:border-[var(--border-default)]'}`}
    >
      {/* Drag handle row: priority badge + drag grip */}
      <div
        {...listeners}
        {...attributes}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        className="flex items-center justify-between"
      >
        <span className={`badge ${priority.className}`}>{priority.label}</span>
        {/* Grip dots */}
        <div className="flex gap-[3px] opacity-30 group-hover:opacity-60" style={{ transition: 'opacity 120ms' }}>
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              style={{
                display:      'block',
                width:        '3px',
                height:       '3px',
                borderRadius: '50%',
                background:   'var(--ink-secondary)',
                // 2×3 grid layout
                order: i,
              }}
            />
          ))}
        </div>
      </div>

      {/* Title + optional description */}
      <div className="space-y-1 min-w-0">
        <h4
          className="text-sm font-medium leading-snug break-words"
          style={{ color: 'var(--ink-primary)' }}
        >
          {title}
        </h4>
        {task.description && (
          <p
            className="text-xs line-clamp-2 leading-relaxed break-words"
            style={{ color: 'var(--ink-tertiary)' }}
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="badge badge-accent"
              style={{ fontSize: '0.5625rem' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: owner + action buttons */}
      <div
        className="flex items-center justify-between pt-2"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <span className="text-xs font-data" style={{ color: 'var(--ink-muted)', fontSize: '0.6875rem' }}>
          {task.owner?.split('@')[0] ?? 'user'}
        </span>

        {/* Action buttons — stopPropagation prevents drag sensor from intercepting */}
        <div className="flex items-center gap-0.5">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onEdit(task)}
            className="btn-icon"
            title="Edit task"
            style={{ width: '28px', height: '28px' }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M11.5 2.5a1.414 1.414 0 012 2L5.5 12.5l-3 1 1-3 8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(task.id)}
            className="btn-danger"
            title="Delete task"
            style={{ width: '28px', height: '28px' }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 4h12M5.5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M6.5 7v4.5M9.5 7v4.5M3 4l.75 9a1 1 0 001 .93h6.5a1 1 0 001-.93L13 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
