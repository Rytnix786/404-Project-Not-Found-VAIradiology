'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDate } from '@/context/DateContext';
import { useAuth } from '@/context/AuthContext';
import Column from './Column';
import { Task } from './TaskCard';
import TaskModal from './TaskModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Board() {
  const { selectedDate } = useDate();
  const { token } = useAuth();

  const [tasks,    setTasks   ] = useState<Task[]>([]);
  const [loading,  setLoading ] = useState(true);
  const [error,    setError   ] = useState<string | null>(null);

  const [isModalOpen,   setIsModalOpen  ] = useState(false);
  const [editingTask,   setEditingTask  ] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');

  // Toast: only shown for errors and async actions; silent on success (anti-ai-slop rule)
  const [toast, setToast] = useState<{ text: string; type: 'info' | 'error' } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/tasks/?date=${selectedDate}`, {
        headers: { 'Authorization': `Token ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const results = data.results ?? data;
        const validated: Task[] = results.map((t: {
          id: number; title?: string; description?: string;
          status?: string; priority?: string; due_date?: string;
          tags?: string[]; owner?: string;
        }) => ({
          id:          t.id,
          title:       typeof t.title === 'string' ? t.title : '[Unnamed Task]',
          description: t.description ?? '',
          status:      ['todo','in_progress','done'].includes(t.status ?? '') ? t.status as Task['status'] : 'todo',
          priority:    ['low','medium','high'].includes(t.priority ?? '') ? t.priority as Task['priority'] : 'medium',
          due_date:    t.due_date ?? selectedDate,
          tags:        Array.isArray(t.tags) ? t.tags : [],
          owner:       t.owner ?? '',
        }));
        setTasks(validated);
      } else {
        setError('Could not load tasks for this date.');
      }
    } catch {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, token]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const showToast = (text: string, type: 'info' | 'error' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !token) return;

    const taskId      = parseInt(active.id as string);
    const nextStatus  = over.id as Task['status'];
    const task        = tasks.find(t => t.id === taskId);
    if (!task || task.status === nextStatus) return;

    const prevStatus = task.status;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));

    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body:    JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('API rejection');
      // Silent success — user already sees the card in the new column
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: prevStatus } : t));
      showToast('Status update failed — reverted.', 'error');
    }
  };

  const handleSaveTask = async (payload: Omit<Task, 'id' | 'owner'>) => {
    if (!token) return;
    const method   = editingTask ? 'PUT' : 'POST';
    const endpoint = editingTask
      ? `${API_URL}/api/tasks/${editingTask.id}/`
      : `${API_URL}/api/tasks/`;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body:    JSON.stringify(payload),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingTask(null);
        // Silent success for create/update — user sees the card appear immediately after refetch
        await fetchTasks();
      } else {
        const err = await res.json();
        showToast(err?.title?.[0] ?? err?.due_date?.[0] ?? 'Save failed.', 'error');
      }
    } catch {
      showToast('Connection error. Please retry.', 'error');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!token) return;
    // Optimistic delete
    const snapshot = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}/`, {
        method:  'DELETE',
        headers: { 'Authorization': `Token ${token}` },
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(snapshot);
      showToast('Delete failed — task restored.', 'error');
    }
  };

  const openAddModal = (status: Task['status']) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const todoTasks       = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks       = tasks.filter(t => t.status === 'done');

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">

      {/* Toast — fixed, viewport corner, non-layout-shifting */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 animate-slide-up"
          style={{
            background:   toast.type === 'error' ? 'var(--danger-surface)' : 'var(--surface-overlay)',
            border:       `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.25)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-lg)',
            padding:      '0.625rem 0.875rem',
            display:      'flex',
            alignItems:   'center',
            gap:          '0.5rem',
            maxWidth:     '320px',
            boxShadow:    '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <span
            className="text-sm"
            style={{ color: toast.type === 'error' ? 'var(--danger)' : 'var(--ink-secondary)' }}
          >
            {toast.text}
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0,1,2].map(i => (
            <div
              key={i}
              style={{
                background:   'var(--surface-raised)',
                border:       '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                minHeight:    '360px',
                overflow:     'hidden',
              }}
            >
              <div style={{ height: '2px', background: 'var(--border-default)' }} />
              <div className="p-4 space-y-3">
                <div className="h-4 rounded animate-pulse" style={{ background: 'var(--surface-overlay)', width: '40%' }} />
                <div className="h-3 rounded animate-pulse" style={{ background: 'var(--surface-overlay)', width: '60%', animationDelay: `${i * 80}ms` }} />
                <div className="h-3 rounded animate-pulse" style={{ background: 'var(--surface-overlay)', width: '50%', animationDelay: `${i * 120}ms` }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error state */
        <div
          className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--danger-surface)' }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: 'var(--danger)' }}>
              <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>{error}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--ink-tertiary)' }}>Check that the backend is running on port 8000.</p>
          </div>
          <button onClick={fetchTasks} className="btn-ghost text-sm">Retry</button>
        </div>
      ) : tasks.length === 0 ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center p-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--ink-tertiary)' }}>
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 12h8M8 8h5M8 16h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
              No tasks on this date
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--ink-tertiary)', maxWidth: '280px' }}>
              Nothing scheduled for this day. Create a task to get started.
            </p>
          </div>
          <button onClick={() => openAddModal('todo')} className="btn-primary text-sm">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Create task
          </button>
        </div>
      ) : (
        /* Kanban board */
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto pb-2">
            <Column
              status="todo"
              title="To Do"
              tasks={todoTasks}
              onAddTask={openAddModal}
              onEditTask={openEditModal}
              onDeleteTask={handleDeleteTask}
            />
            <Column
              status="in_progress"
              title="In Progress"
              tasks={inProgressTasks}
              onAddTask={openAddModal}
              onEditTask={openEditModal}
              onDeleteTask={handleDeleteTask}
            />
            <Column
              status="done"
              title="Done"
              tasks={doneTasks}
              onAddTask={openAddModal}
              onEditTask={openEditModal}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        </DndContext>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        task={editingTask}
        defaultStatus={defaultStatus}
        defaultDueDate={selectedDate}
      />
    </div>
  );
}
