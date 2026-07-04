'use client';

import React, { useState, useEffect } from 'react';
import { Task } from './TaskCard';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'owner'>) => void;
  task: Task | null;
  defaultStatus: 'todo' | 'in_progress' | 'done';
  defaultDueDate: string;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  defaultStatus,
  defaultDueDate,
}: TaskModalProps) {
  const [title,      setTitle      ] = useState('');
  const [description,setDescription] = useState('');
  const [status,     setStatus     ] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [priority,   setPriority   ] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate,    setDueDate    ] = useState('');
  const [tagsInput,  setTagsInput  ] = useState('');
  const [error,      setError      ] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title || '');
        setDescription(task.description || '');
        setStatus(task.status || 'todo');
        setPriority(task.priority || 'medium');
        setDueDate(task.due_date || '');
        setTagsInput(Array.isArray(task.tags) ? task.tags.join(', ') : '');
      } else {
        setTitle('');
        setDescription('');
        setStatus(defaultStatus);
        setPriority('medium');
        setDueDate(defaultDueDate);
        setTagsInput('');
      }
      setError(null);
    }
  }, [isOpen, task, defaultStatus, defaultDueDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!dueDate)       { setError('Due date is required.'); return; }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t !== '');

    onSave({ title: title.trim(), description: description.trim() || undefined, status, priority, due_date: dueDate, tags });
  };

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={task ? 'Edit task' : 'Create task'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div
        className="w-full flex flex-col gap-0 animate-slide-up"
        style={{
          maxWidth: '440px',
          background: 'var(--surface-overlay)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 64px -12px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--ink-primary)' }}
          >
            {task ? 'Edit task' : 'New task'}
          </h2>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close"
            style={{ width: '28px', height: '28px' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-5 py-5 space-y-4">

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] text-sm animate-fade-in"
                style={{ background: 'var(--danger-surface)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)' }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="modal-title" className="field-label">Title *</label>
              <input
                id="modal-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement auth middleware"
                className="field"
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="modal-desc" className="field-label">Description</label>
              <textarea
                id="modal-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional context or notes"
                rows={3}
                className="field resize-none"
                style={{ lineHeight: 1.5 }}
              />
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="modal-status" className="field-label">Status</label>
                <select
                  id="modal-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'todo' | 'in_progress' | 'done')}
                  className="field"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label htmlFor="modal-priority" className="field-label">Priority</label>
                <select
                  id="modal-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="field"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Due Date + Tags */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="modal-date" className="field-label">Due date *</label>
                <input
                  id="modal-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="field"
                  style={{ cursor: 'pointer' }}
                  required
                />
              </div>
              <div>
                <label htmlFor="modal-tags" className="field-label">Tags</label>
                <input
                  id="modal-tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="backend, urgent"
                  className="field"
                />
              </div>
            </div>

          </div>

          {/* Footer actions */}
          <div
            className="flex items-center justify-end gap-2.5 px-5 py-4"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
