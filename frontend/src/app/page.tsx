'use client';

/* Hallmark · component: page · genre: modern-minimal · theme: obsidian-mono
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

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

  const checkHealth = async () => {
    setHealth('checking');
    const startTime = performance.now();
    try {
      const res = await fetch(`${API_URL}/api/health/`, {
        cache: 'no-store'
      });
      const duration = Math.round(performance.now() - startTime);
      
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
        setPingTime(duration);
        setHealth('connected');
      } else {
        setHealth('disconnected');
        setHealthData(null);
      }
    } catch {
      setHealth('disconnected');
      setHealthData(null);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-neutral-800 selection:text-neutral-200">
      
      {/* Top Navbar: N9 Edge-aligned minimal */}
      <nav className="w-full border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-semibold tracking-tight text-neutral-100">
            404_PROJECT
          </span>
          <span className="h-4 w-[1px] bg-neutral-800" />
          <span className="text-xs font-mono text-neutral-500">v1.0.0</span>
        </div>

        <div className="flex items-center gap-6">
          <Link 
            href="/tasks" 
            className="text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            /tasks
          </Link>
          <Link 
            href="/annotate" 
            className="text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            /annotate
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-400 font-mono">
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1.5 border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-300 rounded-md text-xs font-mono transition-colors cursor-pointer hover:bg-neutral-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-950 rounded-md text-xs font-mono font-medium transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-16 flex flex-col justify-center space-y-12">
        
        {/* Typographic Hero */}
        <section className="space-y-4 text-left">
          <h2 className="text-4xl font-light tracking-tight text-neutral-200 font-sans">
            Take-Home <span className="font-mono font-semibold text-neutral-100">Workspace</span>
          </h2>
          <p className="text-neutral-400 max-w-xl text-base font-light leading-relaxed">
            Welcome to the scaffolded monorepo dashboard. Confirm API connectivity, test the route middleware safeguards, and verify CORS below.
          </p>
        </section>

        {/* Health Check Dashboard Card */}
        <section className="bg-neutral-900 border border-neutral-900 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-neutral-800" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h3 className="text-xs uppercase font-mono tracking-widest text-neutral-500">
                Backend Connection Status
              </h3>
              <div className="flex items-center gap-3">
                <span className={`relative flex h-2.5 w-2.5`}>
                  {health === 'connected' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    health === 'checking' 
                      ? 'bg-amber-500' 
                      : health === 'connected' 
                      ? 'bg-emerald-500' 
                      : 'bg-red-500'
                  }`}></span>
                </span>
                <span className="text-lg font-medium tracking-tight text-neutral-200 font-mono">
                  {health === 'checking' && 'Pinging Api...'}
                  {health === 'connected' && 'Online'}
                  {health === 'disconnected' && 'Unreachable'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={checkHealth}
                disabled={health === 'checking'}
                className="px-4 py-2 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-300 hover:text-neutral-100 disabled:opacity-50 text-xs font-mono rounded-lg transition-all cursor-pointer"
              >
                Trigger Ping
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="mt-6 pt-6 border-t border-neutral-950/60 font-mono text-xs text-neutral-400 space-y-2.5 bg-neutral-950/40 p-4 rounded-lg">
            <div className="flex justify-between">
              <span>ENDPOINT_URI:</span>
              <span className="text-neutral-300">{API_URL}/api/health/</span>
            </div>
            {health === 'connected' && (
              <>
                <div className="flex justify-between">
                  <span>RESPONSE_TIME:</span>
                  <span className="text-emerald-400">{pingTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>PAYLOAD:</span>
                  <span className="text-neutral-300">{JSON.stringify(healthData)}</span>
                </div>
              </>
            )}
            {health === 'disconnected' && (
              <div className="text-red-400 mt-2 text-xs leading-normal">
                Could not connect to Django API. Make sure the backend server is running locally on port 8000 (`python manage.py runserver`) and that env files are properly defined.
              </div>
            )}
            {health === 'checking' && (
              <div className="text-neutral-500 animate-pulse">
                Fetching diagnostic information...
              </div>
            )}
          </div>
        </section>

        {/* Feature Stubs and Middleware testing */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Tasks */}
          <div className="bg-neutral-900/60 border border-neutral-900 rounded-xl p-6 hover:border-neutral-800 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-500">/tasks</span>
                <span className="px-2 py-0.5 border border-red-950 text-red-400 bg-red-950/20 text-[10px] rounded uppercase font-mono tracking-wider">
                  Secure Path
                </span>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-medium text-neutral-200 group-hover:text-neutral-100 transition-colors">
                  Kanban Board
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  A date-bound task organizer with drag-and-drop mechanics. Guarded by cookies, middleware will redirect unauthenticated requests to login.
                </p>
              </div>
              <Link
                href="/tasks"
                className="inline-flex items-center text-xs font-mono text-neutral-300 group-hover:text-neutral-100 transition-colors"
              >
                Access Tasks <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Annotate */}
          <div className="bg-neutral-900/60 border border-neutral-900 rounded-xl p-6 hover:border-neutral-800 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-500">/annotate</span>
                <span className="px-2 py-0.5 border border-red-950 text-red-400 bg-red-950/20 text-[10px] rounded uppercase font-mono tracking-wider">
                  Secure Path
                </span>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-medium text-neutral-200 group-hover:text-neutral-100 transition-colors">
                  Annotation Tool
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  Multi-image scroll slider supporting custom vector polygon drawings on uploaded frames. Guards require authenticated session credentials.
                </p>
              </div>
              <Link
                href="/annotate"
                className="inline-flex items-center text-xs font-mono text-neutral-300 group-hover:text-neutral-100 transition-colors"
              >
                Access Annotator <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer: Ft2 Inline single line */}
      <footer className="w-full border-t border-neutral-900 bg-neutral-950 py-6 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-neutral-500">
        <span>&copy; 2026 404_PROJECT. Monorepo scaffold.</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-neutral-400 transition-colors">BACKEND: DRF + SQLite</a>
          <a href="#" className="hover:text-neutral-400 transition-colors">FRONTEND: Next.js 14</a>
        </div>
      </footer>
    </div>
  );
}
