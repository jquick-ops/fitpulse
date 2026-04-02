'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Settings {
  activity_target_minutes: string;
  fasting_target_hours: string;
  calorie_target: string;
  starting_weight: string;
  goal_weight: string;
  sync_api_key: string;
  peloton_username: string;
  peloton_password: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then(setSettings);
  }, []);

  async function handleSave() {
    if (!settings || saving) return;
    setSaving(true);
    setSaved(false);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function update(key: keyof Settings, value: string) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  if (!settings) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen flex items-center justify-center">
        <p className="text-text-muted">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen px-5 py-5">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-text-secondary text-sm">FitPulse configuration</p>
        </div>
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-card border border-card-border flex items-center justify-center text-text-secondary hover:text-text-primary transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Activity */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm text-accent mb-4 uppercase tracking-wider">Move</h2>
          <label className="block mb-1 text-text-secondary text-sm">Daily activity target (minutes)</label>
          <input
            type="number"
            value={settings.activity_target_minutes}
            onChange={(e) => update('activity_target_minutes', e.target.value)}
            className="w-full bg-bg border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition"
          />
        </div>

        {/* Fasting */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm text-accent-amber mb-4 uppercase tracking-wider">Fast</h2>
          <label className="block mb-1 text-text-secondary text-sm">Fasting target (hours)</label>
          <input
            type="number"
            value={settings.fasting_target_hours}
            onChange={(e) => update('fasting_target_hours', e.target.value)}
            className="w-full bg-bg border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-amber/50 transition"
          />
        </div>

        {/* Eat */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm text-accent mb-4 uppercase tracking-wider">Eat</h2>
          <label className="block mb-1 text-text-secondary text-sm">Daily calorie target</label>
          <input
            type="number"
            value={settings.calorie_target}
            onChange={(e) => update('calorie_target', e.target.value)}
            className="w-full bg-bg border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition"
          />
        </div>

        {/* Weight */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm text-purple mb-4 uppercase tracking-wider">Weight</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-text-secondary text-sm">Starting weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                value={settings.starting_weight}
                onChange={(e) => update('starting_weight', e.target.value)}
                className="w-full bg-bg border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-purple/50 transition"
              />
            </div>
            <div>
              <label className="block mb-1 text-text-secondary text-sm">Goal weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                value={settings.goal_weight}
                onChange={(e) => update('goal_weight', e.target.value)}
                className="w-full bg-bg border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-purple/50 transition"
              />
            </div>
          </div>
        </div>

        {/* Peloton */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm text-red-500 mb-4 uppercase tracking-wider">Peloton</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-text-secondary text-sm">Email or username</label>
              <input
                type="text"
                value={settings.peloton_username || ''}
                onChange={(e) => update('peloton_username', e.target.value)}
                placeholder="your@email.com"
                autoComplete="off"
                className="w-full bg-bg border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-red-500/50 transition"
              />
            </div>
            <div>
              <label className="block mb-1 text-text-secondary text-sm">Password</label>
              <input
                type="password"
                value={settings.peloton_password || ''}
                onChange={(e) => update('peloton_password', e.target.value)}
                placeholder="••••••••"
                autoComplete="off"
                className="w-full bg-bg border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-red-500/50 transition"
              />
            </div>
            <p className="text-text-muted text-[10px]">Stored securely in your database. Used to sync workouts automatically.</p>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-xl bg-accent/15 border border-accent/30 text-accent font-semibold text-sm hover:bg-accent/25 transition disabled:opacity-40"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
