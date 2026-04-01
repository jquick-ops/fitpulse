'use client';

import { useState, useEffect } from 'react';

interface FastWeekDay {
  label: string;
  hours: number | null;
  hit: boolean | null;
}

interface FastCardProps {
  isFasting: boolean;
  fastStartTime: string | null;
  lastCompletedHours: number | null;
  targetHours: number;
  weekDays: FastWeekDay[];
}

export default function FastCard({
  isFasting: initialFasting,
  fastStartTime,
  lastCompletedHours,
  targetHours,
  weekDays,
}: FastCardProps) {
  const [isFasting, setIsFasting] = useState(initialFasting);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isFasting || !fastStartTime) return;
    const start = new Date(fastStartTime).getTime();

    function update() {
      setElapsed((Date.now() - start) / 1000 / 3600);
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [isFasting, fastStartTime]);

  const hours = Math.floor(elapsed);
  const minutes = Math.round((elapsed % 1) * 60);
  const remaining = Math.max(0, targetHours - elapsed);
  const remainH = Math.floor(remaining);
  const remainM = Math.round((remaining % 1) * 60);
  const progress = Math.min(elapsed / targetHours, 1);
  const hit = elapsed >= targetHours;

  async function toggleFast() {
    setLoading(true);
    try {
      const endpoint = isFasting ? '/api/fasts/stop' : '/api/fasts/start';
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  const startTimeStr = fastStartTime
    ? new Date(fastStartTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;
  const targetTimeStr = fastStartTime
    ? new Date(new Date(fastStartTime).getTime() + targetHours * 3600000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <div className={`bg-card border border-card-border rounded-2xl p-5 ${isFasting ? 'shadow-[0_0_20px_rgba(245,158,11,0.1)]' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-amber/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-base">Fast</h2>
            <p className="text-text-secondary text-xs">{targetHours}:{24 - targetHours} protocol</p>
          </div>
        </div>
        <div className="text-right">
          {isFasting ? (
            <>
              <span className={`font-bold text-lg ${hit ? 'text-accent' : 'text-accent-amber'} ${!hit ? 'timer-pulse' : ''}`}>
                {hours}h {minutes}m
              </span>
              <p className="text-text-muted text-xs">
                {hit ? 'Target reached!' : `${remainH}h ${remainM}m to go`}
              </p>
            </>
          ) : lastCompletedHours !== null ? (
            <>
              <span className="text-accent font-bold text-lg">{lastCompletedHours.toFixed(1)}h</span>
              <p className="text-text-muted text-xs">last fast</p>
            </>
          ) : (
            <span className="text-text-muted font-bold text-lg">{'\u2014'}</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isFasting && (
        <div className="mb-4">
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${hit ? 'bg-accent' : 'bg-gradient-to-r from-accent-amber to-accent'}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-text-muted text-[10px]">Start {startTimeStr}</span>
            <span className="text-text-muted text-[10px]">Target {targetTimeStr}</span>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggleFast}
        disabled={loading}
        className={`w-full py-3 rounded-xl border font-semibold text-sm transition mb-4 disabled:opacity-40 ${
          isFasting
            ? 'bg-accent-amber/15 border-accent-amber/30 text-accent-amber hover:bg-accent-amber/25'
            : 'bg-accent/15 border-accent/30 text-accent hover:bg-accent/25'
        }`}
      >
        {loading ? 'Updating...' : isFasting ? 'End Fast' : 'Start Fast'}
      </button>

      {/* Weekly grid */}
      <div className="flex justify-between">
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-[11px] font-semibold ${
              day.hit === true
                ? 'bg-accent/20 text-accent'
                : day.hit === false
                  ? 'bg-accent-red/15 text-accent-red'
                  : 'bg-card-border text-text-muted'
            }`}
          >
            <span>{day.label}</span>
            {day.hours !== null && (
              <span className="text-[9px] font-normal opacity-70">{Math.round(day.hours)}h</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
