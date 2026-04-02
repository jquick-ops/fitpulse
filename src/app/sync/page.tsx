'use client';

import { useState } from 'react';
import Link from 'next/link';

const ACTIVITY_TYPES = ['Hockey', 'Ball Hockey', 'Tennis', 'Basketball', 'Soccer', 'Golf', 'Skiing', 'Hiking', 'Swimming', 'Yoga', 'Other'];

export default function SyncPage() {
  const [workoutType, setWorkoutType] = useState('Hockey');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [intensity, setIntensity] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!duration || saving) return;

    setSaving(true);
    setResult(null);

    try {
      const startTime = time
        ? new Date(`${date}T${time}`).toISOString()
        : null;

      const res = await fetch('/api/sync/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'Manual',
          workout_type: workoutType,
          duration_minutes: parseInt(duration),
          date,
          start_time: startTime,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: `Logged ${workoutType} — ${duration} min` });
        setDuration('');
        setNotes('');
        setTime('');
        setIntensity(null);
      } else {
        setResult({ success: false, message: data.error || 'Failed to save' });
      }
    } catch {
      setResult({ success: false, message: 'Network error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-8 h-8 rounded-lg bg-card-border flex items-center justify-center">
          <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">Log Activity</h1>
      </div>

      <p className="text-text-secondary text-xs mb-4">
        For activities not tracked by Peloton, Tonal, or Apple Watch.
      </p>

      {/* Result toast */}
      {result && (
        <div className={`rounded-xl px-4 py-3 mb-4 text-sm font-medium ${
          result.success
            ? 'bg-accent/10 border border-accent/20 text-accent'
            : 'bg-accent-red/10 border border-accent-red/20 text-accent-red'
        }`}>
          {result.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Activity Type */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3 block">Activity</label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setWorkoutType(t)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  workoutType === t
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-bg/50 text-text-secondary border border-card-border'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">
            Duration (minutes) *
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="60"
            required
            className="w-full bg-bg/70 border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition"
          />
        </div>

        {/* Intensity */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3 block">Intensity</label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setIntensity(intensity === level ? null : level)}
                className={`py-2 rounded-xl text-xs font-semibold transition capitalize ${
                  intensity === level
                    ? level === 'high'
                      ? 'bg-accent-red/20 text-accent-red border border-accent-red/30'
                      : level === 'medium'
                        ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
                        : 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-bg/50 text-text-secondary border border-card-border'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Date + Time */}
        <div className="bg-card border border-card-border rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg/70 border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">
              Time <span className="text-text-muted normal-case">(optional)</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-bg/70 border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">
            Notes <span className="text-text-muted normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="2G 5A, we won, felt strong"
            className="w-full bg-bg/70 border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!duration || saving}
          className="w-full py-4 rounded-2xl bg-accent text-bg font-bold text-sm transition disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Log Activity'}
        </button>
      </form>
    </div>
  );
}
