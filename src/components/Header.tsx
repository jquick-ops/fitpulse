'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setSyncMsg(null);

    try {
      const res = await fetch('/api/sync/peloton', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setSyncMsg(data.message);
        if (data.synced > 0) {
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        setSyncMsg(data.error || 'Sync failed');
      }
    } catch {
      setSyncMsg('Network error');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 3000);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">FitPulse</h1>
          <p className="text-text-secondary text-sm">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-9 h-9 rounded-full bg-card border border-card-border flex items-center justify-center text-text-secondary hover:text-accent transition"
            title="Sync Peloton"
          >
            <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <Link
            href="/sync"
            className="w-9 h-9 rounded-full bg-card border border-card-border flex items-center justify-center text-text-secondary hover:text-accent transition"
            title="Log Activity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
          <Link
            href="/settings"
            className="w-9 h-9 rounded-full bg-card border border-card-border flex items-center justify-center text-text-secondary hover:text-text-primary transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </div>
      {syncMsg && (
        <div className="mt-2 px-3 py-2 rounded-xl bg-accent/10 text-accent text-xs font-medium text-center">
          {syncMsg}
        </div>
      )}
    </>
  );
}
