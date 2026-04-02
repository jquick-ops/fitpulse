'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SetupPage() {
  const [apiKey, setApiKey] = useState('');
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.sync_api_key) {
          setApiKey(data.sync_api_key);
        } else {
          // Auto-generate key
          generateKey();
        }
      })
      .catch(() => {});
  }, []);

  async function generateKey() {
    const newKey = crypto.randomUUID().replace(/-/g, '');
    setApiKey(newKey);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sync_api_key: newKey }),
    });
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/sync/health`
    : '/api/sync/health';

  return (
    <div className="max-w-[430px] mx-auto min-h-screen px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-8 h-8 rounded-lg bg-card-border flex items-center justify-center">
          <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold">Sync Setup</h1>
          <p className="text-text-muted text-xs">One-time setup, takes 2 minutes</p>
        </div>
      </div>

      <p className="text-text-secondary text-sm mb-6 leading-relaxed">
        This creates an iOS Shortcut that pulls your Peloton and Tonal workouts from Apple Health into FitPulse. Tap the sync button anytime to refresh.
      </p>

      {/* Step 1: Open Shortcuts */}
      <div className={`bg-card border rounded-2xl p-5 mb-3 transition ${step === 1 ? 'border-accent/40' : 'border-card-border'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > 1 ? 'bg-accent text-bg' : step === 1 ? 'bg-accent/20 text-accent' : 'bg-card-border text-text-muted'}`}>
            {step > 1 ? '\u2713' : '1'}
          </div>
          <h2 className="font-semibold text-sm">Create the Shortcut</h2>
        </div>
        {step === 1 && (
          <div className="pl-10 space-y-3">
            <p className="text-text-secondary text-xs leading-relaxed">
              Open the <strong>Shortcuts</strong> app on your iPhone, tap <strong>+</strong> in the top right, and name it <strong>FitPulse Sync</strong>.
            </p>
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs font-semibold"
            >
              Done, next step
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Find Health Samples */}
      <div className={`bg-card border rounded-2xl p-5 mb-3 transition ${step === 2 ? 'border-accent/40' : 'border-card-border'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > 2 ? 'bg-accent text-bg' : step === 2 ? 'bg-accent/20 text-accent' : 'bg-card-border text-text-muted'}`}>
            {step > 2 ? '\u2713' : '2'}
          </div>
          <h2 className="font-semibold text-sm">Add &quot;Find Health Samples&quot;</h2>
        </div>
        {step === 2 && (
          <div className="pl-10 space-y-3">
            <ol className="text-text-secondary text-xs leading-relaxed space-y-2 list-decimal list-inside">
              <li>Tap <strong>Add Action</strong></li>
              <li>Search for <strong>&quot;Find Health Samples&quot;</strong></li>
              <li>Set Type to <strong>Workouts</strong></li>
              <li>Tap <strong>Add Filter</strong> &rarr; <strong>Start Date</strong> &rarr; <strong>is in the last</strong> &rarr; <strong>1 day</strong></li>
            </ol>
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs font-semibold"
            >
              Done, next step
            </button>
          </div>
        )}
      </div>

      {/* Step 3: Add Get Contents of URL */}
      <div className={`bg-card border rounded-2xl p-5 mb-3 transition ${step === 3 ? 'border-accent/40' : 'border-card-border'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > 3 ? 'bg-accent text-bg' : step === 3 ? 'bg-accent/20 text-accent' : 'bg-card-border text-text-muted'}`}>
            {step > 3 ? '\u2713' : '3'}
          </div>
          <h2 className="font-semibold text-sm">Add &quot;Get Contents of URL&quot;</h2>
        </div>
        {step === 3 && (
          <div className="pl-10 space-y-3">
            <ol className="text-text-secondary text-xs leading-relaxed space-y-2 list-decimal list-inside">
              <li>Add another action: <strong>&quot;Get Contents of URL&quot;</strong></li>
              <li>Tap the URL field and paste this:</li>
            </ol>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-bg/70 rounded-lg px-3 py-2 text-[10px] text-accent font-mono break-all">
                {webhookUrl}
              </code>
              <button
                onClick={() => copy(webhookUrl, 'url')}
                className="px-3 py-2 rounded-lg bg-accent/15 text-accent text-[10px] font-semibold shrink-0"
              >
                {copied === 'url' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <ol start={3} className="text-text-secondary text-xs leading-relaxed space-y-2 list-decimal list-inside">
              <li>Set Method to <strong>POST</strong></li>
              <li>Under Headers, add: <strong>Content-Type</strong> = <strong>application/json</strong></li>
              <li>Under Request Body, choose <strong>JSON</strong> and add these keys:</li>
            </ol>
            <div className="bg-bg/70 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted font-mono">api_key</span>
                <div className="flex items-center gap-1">
                  <code className="text-[10px] text-accent font-mono">{apiKey}</code>
                  <button
                    onClick={() => copy(apiKey, 'key')}
                    className="px-2 py-1 rounded bg-accent/15 text-accent text-[9px] font-semibold"
                  >
                    {copied === 'key' ? '\u2713' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted font-mono">workouts</span>
                <span className="text-[10px] text-text-secondary">Health Samples variable</span>
              </div>
            </div>
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs font-semibold"
            >
              Done, next step
            </button>
          </div>
        )}
      </div>

      {/* Step 4: Done */}
      <div className={`bg-card border rounded-2xl p-5 mb-3 transition ${step === 4 ? 'border-accent/40' : 'border-card-border'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 4 ? 'bg-accent text-bg' : 'bg-card-border text-text-muted'}`}>
            {step > 4 ? '\u2713' : '4'}
          </div>
          <h2 className="font-semibold text-sm">Test it</h2>
        </div>
        {step === 4 && (
          <div className="pl-10 space-y-3">
            <p className="text-text-secondary text-xs leading-relaxed">
              Tap the <strong>play button</strong> in the Shortcuts app to test. If it works, go back to FitPulse and hit the sync button.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-xl bg-accent text-bg text-xs font-bold"
            >
              Back to FitPulse
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
