'use client';

import { useState } from 'react';

interface LogResponse {
  success: boolean;
  workout?: {
    workout_type: string;
    duration_minutes: number;
    notes: string;
  };
  follow_up?: string;
  error?: string;
}

export default function ActivityLogger() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [context, setContext] = useState('');

  async function handleSubmit() {
    if (!input.trim() || isLogging) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsLogging(true);

    try {
      const res = await fetch('/api/workouts/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: context ? `${context}\n${userMsg}` : userMsg }),
      });

      const data: LogResponse = await res.json();

      if (data.follow_up) {
        setMessages((prev) => [...prev, { role: 'ai', text: data.follow_up! }]);
        setContext((prev) => prev ? `${prev}\n${userMsg}` : userMsg);
      } else if (data.success && data.workout) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: `Logged: ${data.workout!.workout_type} — ${data.workout!.duration_minutes} min${data.workout!.notes ? ` (${data.workout!.notes})` : ''}`,
          },
        ]);
        setContext('');
        // Refresh after a moment so user can read the confirmation
        setTimeout(() => window.location.reload(), 1500);
      } else if (data.error) {
        setMessages((prev) => [...prev, { role: 'ai', text: `Error: ${data.error}` }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Something went wrong. Try again.' }]);
    } finally {
      setIsLogging(false);
    }
  }

  return (
    <div className="mb-4">
      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="mb-3 space-y-2 max-h-48 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-xs px-3 py-2 rounded-xl max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-accent/10 text-accent ml-auto'
                  : 'bg-bg/70 text-text-secondary'
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={context ? 'Answer...' : 'Log activity... "Hockey game, felt great"'}
          className="flex-1 bg-bg/70 border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition"
        />
        <button
          onClick={handleSubmit}
          disabled={isLogging || !input.trim()}
          className="px-4 py-3 rounded-xl bg-accent/15 border border-accent/30 text-accent font-semibold text-sm hover:bg-accent/25 transition disabled:opacity-40"
        >
          {isLogging ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-text-muted text-[10px] mt-1.5 px-1">
        {context ? 'AI needs more info — answer above' : 'AI parses activity, duration, and details'}
      </p>
    </div>
  );
}
