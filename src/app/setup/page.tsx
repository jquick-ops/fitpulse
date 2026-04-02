'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SetupPage() {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const key = data.settings?.find((s: { key: string }) => s.key === 'sync_api_key');
        if (key) setApiKey(key.value);
      })
      .catch(() => {});
  }, []);

  async function generateKey() {
    const newKey = crypto.randomUUID().replace(/-/g, '');
    setApiKey(newKey);
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'sync_api_key', value: newKey }),
    });
    setSaving(false);
  }

  function copyText(text: string, label: string) {
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
        <h1 className="text-lg font-bold">Apple Health Sync</h1>
      </div>

      {/* API Key */}
      <div className="bg-card border border-card-border rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-sm mb-3">1. API Key</h2>
        {apiKey ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-bg/70 rounded-xl px-3 py-2 text-xs text-accent font-mono break-all">
              {apiKey}
            </code>
            <button
              onClick={() => copyText(apiKey, 'key')}
              className="px-3 py-2 rounded-xl bg-accent/15 text-accent text-xs font-semibold shrink-0"
            >
              {copied === 'key' ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : (
          <button
            onClick={generateKey}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-accent/15 border border-accent/30 text-accent font-semibold text-sm"
          >
            {saving ? 'Generating...' : 'Generate API Key'}
          </button>
        )}
      </div>

      {/* Webhook URL */}
      <div className="bg-card border border-card-border rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-sm mb-3">2. Webhook URL</h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-bg/70 rounded-xl px-3 py-2 text-xs text-text-secondary font-mono break-all">
            {webhookUrl}
          </code>
          <button
            onClick={() => copyText(webhookUrl, 'url')}
            className="px-3 py-2 rounded-xl bg-accent/15 text-accent text-xs font-semibold shrink-0"
          >
            {copied === 'url' ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* iOS Shortcut Instructions */}
      <div className="bg-card border border-card-border rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-sm mb-3">3. iOS Shortcut Setup</h2>
        <div className="space-y-4 text-xs text-text-secondary leading-relaxed">
          <div>
            <p className="text-text-primary font-medium mb-1">Create the Shortcut:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>Open the <strong>Shortcuts</strong> app on your iPhone</li>
              <li>Tap <strong>+</strong> to create a new shortcut</li>
              <li>Name it <strong>&quot;Sync Health to FitPulse&quot;</strong></li>
            </ol>
          </div>

          <div>
            <p className="text-text-primary font-medium mb-1">Add Actions:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>Add <strong>&quot;Find Health Samples&quot;</strong> action</li>
              <li>Set Type to <strong>Workouts</strong></li>
              <li>Set Start Date to <strong>last 24 hours</strong></li>
              <li>Add <strong>&quot;Get Contents of URL&quot;</strong> action</li>
              <li>Set URL to your webhook URL (copied above)</li>
              <li>Method: <strong>POST</strong></li>
              <li>Request Body: <strong>JSON</strong></li>
            </ol>
          </div>

          <div>
            <p className="text-text-primary font-medium mb-1">JSON Body Format:</p>
            <pre className="bg-bg/70 rounded-xl p-3 text-[10px] font-mono overflow-x-auto whitespace-pre">
{`{
  "api_key": "<your key>",
  "workouts": [
    {
      "type": "cycling",
      "duration_minutes": 30,
      "start_time": "2024-01-01T08:00:00Z",
      "source": "Peloton",
      "output_kj": 250
    }
  ],
  "weight": {
    "lbs": 185,
    "date": "2024-01-01"
  }
}`}
            </pre>
          </div>

          <div>
            <p className="text-text-primary font-medium mb-1">Automate It:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>Go to <strong>Automation</strong> tab in Shortcuts</li>
              <li>Tap <strong>+</strong> &rarr; <strong>Create Personal Automation</strong></li>
              <li>Choose <strong>Time of Day</strong> (e.g., 9 PM daily)</li>
              <li>Add your <strong>&quot;Sync Health to FitPulse&quot;</strong> shortcut</li>
              <li>Turn off <strong>Ask Before Running</strong></li>
            </ol>
          </div>
        </div>
      </div>

      {/* Test */}
      <div className="bg-card border border-card-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-3">4. Test It</h2>
        <p className="text-xs text-text-secondary leading-relaxed mb-3">
          Run this curl command to verify your setup:
        </p>
        <div className="relative">
          <pre className="bg-bg/70 rounded-xl p-3 text-[10px] font-mono overflow-x-auto whitespace-pre">
{`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "${apiKey || '<your-key>'}",
    "workouts": [{
      "type": "cycling",
      "duration_minutes": 30,
      "start_time": "${new Date().toISOString()}",
      "source": "Peloton"
    }]
  }'`}
          </pre>
          <button
            onClick={() => copyText(`curl -X POST ${webhookUrl} -H "Content-Type: application/json" -d '{"api_key":"${apiKey}","workouts":[{"type":"cycling","duration_minutes":30,"start_time":"${new Date().toISOString()}","source":"Peloton"}]}'`, 'curl')}
            className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-accent/15 text-accent text-[10px] font-semibold"
          >
            {copied === 'curl' ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
