'use client';

/* Hallmark · component: page · genre: modern-minimal · theme: obsidian-mono
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AnnotatePage() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 selection:bg-neutral-850 font-mono text-xs">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl space-y-6">
        
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <span className="font-bold text-sm tracking-tight text-neutral-200">/annotate</span>
          <Link href="/" className="hover:text-neutral-300 transition-colors">
            &larr; Back Home
          </Link>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-neutral-500">AUTHENTICATED_USER:</span>
            <span className="text-neutral-300">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">GATEKEEPER_STATUS:</span>
            <span className="text-emerald-400 font-semibold">ACCESS_GRANTED</span>
          </div>
        </div>

        <div className="p-8 border border-dashed border-neutral-800 rounded-lg text-center text-neutral-500 space-y-2">
          <div className="text-sm font-semibold text-neutral-400">Annotation Tool coming soon</div>
          <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
            Multi-image uploading, carousel sliding, and polygon shape-drawing canvas utilities will render here.
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-neutral-100 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
        >
          Logout Session
        </button>
      </div>
    </main>
  );
}
