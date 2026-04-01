'use client';

import { useState } from 'react';

interface Workout {
  id: string;
  workout_type: string;
  source: string;
  duration_minutes: number;
  start_time: string | null;
  notes: string | null;
  ai_parsed: boolean;
  peloton_output_kj: number | null;
}

interface WeekDay {
  label: string;
  hit: boolean | null; // null = future/no data
  minutes: number;
}

interface MoveCardProps {
  workouts: Workout[];
  totalMinutes: number;
  target: number;
  streak: number;
  weekDays: WeekDay[];
  weeklyScore: string | null;
  weeklySummary: string | null;
  weeklyTrend: string | null;
}

const workoutEmoji: Record<string, string> = {
  'Peloton Cycling': '\u{1F6B4}',
  'Peloton Running': '\u{1F3C3}',
  'Tonal Strength': '\u{1F4AA}',
  'Hockey': '\u{1F3D2}',
  'Ball Hockey': '\u{1F3D2}',
  'Tennis': '\u{1F3BE}',
  'Walking': '\u{1F6B6}',
};

const sourceColor: Record<string, string> = {
  'Peloton': 'bg-red-500/15',
  'Tonal': 'bg-blue-500/15',
  'Manual': 'bg-cyan-500/15',
  'Apple Watch': 'bg-pink-500/15',
};

export default function MoveCard({
  workouts,
  totalMinutes,
  target,
  streak,
  weekDays,
  weeklyScore,
  weeklySummary,
  weeklyTrend,
}: MoveCardProps) {
  const [activityInput, setActivityInput] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const hit = totalMinutes >= target;

  async function handleLogActivity() {
    if (!activityInput.trim() || isLogging) return;
    setIsLogging(true);
    try {
      const res = await fetch('/api/workouts/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: activityInput }),
      });
      if (res.ok) {
        setActivityInput('');
        window.location.reload();
      }
    } finally {
      setIsLogging(false);
    }
  }

  return (
    <div className={`bg-card border border-card-border rounded-2xl p-5 ${hit ? 'shadow-[0_0_20px_rgba(34,197,94,0.1)]' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-base">Move</h2>
            <p className="text-text-secondary text-xs">{target} min daily target</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold text-lg ${hit ? 'text-accent' : 'text-text-secondary'}`}>
            {totalMinutes} min
          </span>
          {hit && (
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Workout list */}
      <div className="space-y-2 mb-4">
        {workouts.map((w) => (
          <div key={w.id} className={`flex items-center justify-between bg-bg/50 rounded-xl px-4 py-3 ${w.ai_parsed ? 'border border-dashed border-accent/20' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${sourceColor[w.source] || 'bg-gray-500/15'} flex items-center justify-center text-xs`}>
                {workoutEmoji[w.workout_type] || '\u{1F3CB}'}
              </div>
              <div>
                <p className="text-sm font-medium">{w.workout_type}</p>
                <p className="text-text-muted text-xs">
                  {w.source}
                  {w.start_time && ` \u00B7 ${new Date(w.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-text-secondary font-semibold text-sm">{w.duration_minutes} min</span>
              {w.peloton_output_kj && (
                <p className="text-accent text-[10px]">{w.peloton_output_kj} kJ</p>
              )}
              {w.notes && (
                <p className="text-accent text-[10px]">{w.notes}</p>
              )}
            </div>
          </div>
        ))}
        {workouts.length === 0 && (
          <div className="flex items-center justify-center bg-bg/50 rounded-xl px-4 py-6 border border-dashed border-card-border">
            <p className="text-text-muted text-sm">No activity logged today</p>
          </div>
        )}
      </div>

      {/* Log Activity input */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={activityInput}
            onChange={(e) => setActivityInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogActivity()}
            placeholder='Log activity... "Hockey game, felt great"'
            className="flex-1 bg-bg/70 border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition"
          />
          <button
            onClick={handleLogActivity}
            disabled={isLogging || !activityInput.trim()}
            className="px-4 py-3 rounded-xl bg-accent/15 border border-accent/30 text-accent font-semibold text-sm hover:bg-accent/25 transition disabled:opacity-40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-text-muted text-[10px] mt-1.5 px-1">AI parses activity, duration, and details</p>
      </div>

      {/* Weekly Fitness Score */}
      {weeklyScore && (
        <div className="bg-bg/50 rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">This Week</span>
            <div className="flex items-center gap-2">
              <span className="text-accent font-bold text-lg">{weeklyScore}</span>
              {weeklyTrend && (
                <span className={`text-[10px] ${weeklyTrend === 'up' ? 'text-accent' : weeklyTrend === 'down' ? 'text-accent-red' : 'text-text-muted'}`}>
                  {weeklyTrend === 'up' ? '\u25B2 above avg' : weeklyTrend === 'down' ? '\u25BC below avg' : '\u2014 average'}
                </span>
              )}
            </div>
          </div>
          {weeklySummary && (
            <p className="text-text-secondary text-xs leading-relaxed">{weeklySummary}</p>
          )}
        </div>
      )}

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm">{'\u{1F525}'}</span>
          <span className="text-sm font-semibold text-accent-amber">{streak}-day streak</span>
        </div>
      )}

      {/* Weekly grid */}
      <div className="flex justify-between">
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-semibold ${
              day.hit === true
                ? 'bg-accent/20 text-accent'
                : day.hit === false
                  ? 'bg-accent-red/15 text-accent-red'
                  : 'bg-card-border text-text-muted'
            }`}
          >
            {day.label}
          </div>
        ))}
      </div>
    </div>
  );
}
