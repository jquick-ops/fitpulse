'use client';

import { useState } from 'react';

interface WeightEntry {
  date: string;
  weight_lbs: number;
}

interface WeightCardProps {
  currentWeight: number | null;
  startingWeight: number;
  goalWeight: number;
  entries: WeightEntry[];
  lastLoggedDate: string | null;
}

export default function WeightCard({
  currentWeight,
  startingWeight,
  goalWeight,
  entries,
  lastLoggedDate,
}: WeightCardProps) {
  const [showInput, setShowInput] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [saving, setSaving] = useState(false);

  const lost = currentWeight !== null ? startingWeight - currentWeight : 0;
  const toGo = currentWeight !== null ? currentWeight - goalWeight : startingWeight - goalWeight;
  const totalToLose = startingWeight - goalWeight;
  const progress = totalToLose > 0 ? Math.max(0, Math.min(lost / totalToLose, 1)) : 0;

  // Days since last log
  const daysSinceLog = lastLoggedDate
    ? Math.floor((Date.now() - new Date(lastLoggedDate).getTime()) / 86400000)
    : null;

  async function handleLog() {
    const val = parseFloat(weightInput);
    if (isNaN(val) || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_lbs: val }),
      });
      if (res.ok) {
        setShowInput(false);
        setWeightInput('');
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  }

  // Build SVG chart points from entries
  const chartEntries = entries.slice(-90);
  let svgPoints = '';
  let svgFill = '';
  if (chartEntries.length > 1) {
    const weights = chartEntries.map((e) => e.weight_lbs);
    const maxW = Math.max(...weights) + 2;
    const minW = Math.min(goalWeight - 2, ...weights);
    const range = maxW - minW;
    svgPoints = chartEntries
      .map((e, i) => {
        const x = (i / (chartEntries.length - 1)) * 300;
        const y = ((maxW - e.weight_lbs) / range) * 90;
        return `${x},${y}`;
      })
      .join(' ');
    const lastPoint = svgPoints.split(' ').pop();
    svgFill = `${svgPoints} 300,100 0,100`;
    // Goal line Y
    var goalY = ((maxW - goalWeight) / range) * 90;
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-base">Weight</h2>
            <p className="text-text-secondary text-xs">Goal: {goalWeight} lbs</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-purple font-bold text-lg">{currentWeight ?? '\u2014'}</span>
          <span className="text-text-muted text-sm"> lbs</span>
        </div>
      </div>

      {/* Progress */}
      {currentWeight !== null && (
        <div className="bg-bg/50 rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-accent text-sm font-semibold">{'\u25BC'} {lost.toFixed(1)} lbs</span>
              <span className="text-text-muted text-xs"> from start</span>
            </div>
            <div>
              <span className="text-text-secondary text-sm font-semibold">{toGo.toFixed(1)} lbs</span>
              <span className="text-text-muted text-xs"> to go</span>
            </div>
          </div>
          <div className="h-2 bg-card-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple to-accent rounded-full transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Chart */}
      {chartEntries.length > 1 && (
        <div className="bg-bg/30 rounded-xl p-3 mb-4 h-[120px]">
          <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1={goalY!} x2="300" y2={goalY!} stroke="#22c55e" strokeWidth="1" strokeDasharray="4,4" opacity="0.4" />
            <text x="255" y={goalY! - 3} fill="#22c55e" fontSize="8" opacity="0.6">{goalWeight} goal</text>
            <defs>
              <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={svgFill} fill="url(#wg)" />
            <polyline points={svgPoints} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Log Weight */}
      {showInput ? (
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            step="0.1"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLog()}
            placeholder="185.0"
            className="flex-1 bg-bg/70 border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-purple/50 transition"
            autoFocus
          />
          <button
            onClick={handleLog}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-purple/15 border border-purple/30 text-purple font-semibold text-sm hover:bg-purple/25 transition disabled:opacity-40"
          >
            Save
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="w-full py-3 rounded-xl bg-purple/15 border border-purple/30 text-purple font-semibold text-sm hover:bg-purple/25 transition"
        >
          Log Weight
        </button>
      )}

      {/* Last logged */}
      {lastLoggedDate && (
        <p className="text-text-muted text-xs text-center mt-3">
          Last logged: {new Date(lastLoggedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          {currentWeight && ` \u00B7 ${currentWeight} lbs`}
          {daysSinceLog !== null && daysSinceLog >= 7 && (
            <span className="text-accent-amber"> {'\u00B7'} Time to weigh in!</span>
          )}
        </p>
      )}
    </div>
  );
}
