'use client';

import { useRef } from 'react';

interface Meal {
  id: string;
  meal_type: string | null;
  description: string | null;
  estimated_calories: number;
  estimated_protein_grams: number | null;
  confidence: string | null;
  photo_url: string | null;
  created_at: string;
}

interface EatCardProps {
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  target: number;
}

const mealEmoji: Record<string, string> = {
  breakfast: '\u{1F963}',
  lunch: '\u{1F957}',
  dinner: '\u{1F35D}',
  snack: '\u{1F34E}',
};

export default function EatCard({ meals, totalCalories, totalProtein, target }: EatCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const progress = Math.min(totalCalories / target, 1);
  const remaining = Math.max(0, target - totalCalories);
  const overTarget = totalCalories > target;

  async function handlePhoto(file: File) {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch('/api/meals/analyze', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      window.location.reload();
    }
  }

  return (
    <div className={`bg-card border border-card-border rounded-2xl p-5 ${!overTarget && totalCalories > 0 ? 'shadow-[0_0_20px_rgba(34,197,94,0.1)]' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-base">Eat</h2>
            <p className="text-text-secondary text-xs">{target.toLocaleString()} cal target</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`font-bold text-lg ${overTarget ? 'text-accent-red' : 'text-accent'}`}>
            {totalCalories.toLocaleString()}
          </span>
          <p className="text-text-muted text-xs">
            {overTarget ? `${(totalCalories - target).toLocaleString()} over` : `${remaining.toLocaleString()} cal left`}
          </p>
        </div>
      </div>

      {/* Calorie progress bar */}
      <div className="h-2 bg-bg rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all ${overTarget ? 'bg-accent-red' : 'bg-gradient-to-r from-accent to-emerald-400'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Meal list */}
      <div className="space-y-2 mb-4">
        {meals.map((meal) => (
          <div key={meal.id} className="flex items-center justify-between bg-bg/50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 overflow-hidden flex items-center justify-center text-lg">
                {meal.photo_url ? (
                  <img src={meal.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  mealEmoji[meal.meal_type || ''] || '\u{1F37D}'
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{meal.description || 'Meal'}</p>
                <p className="text-text-muted text-xs">
                  {meal.meal_type ? meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1) : 'Meal'}
                  {' \u00B7 '}
                  {new Date(meal.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-text-secondary font-semibold text-sm">{meal.estimated_calories} cal</span>
              {meal.estimated_protein_grams && (
                <p className="text-text-muted text-xs">{meal.estimated_protein_grams}g protein</p>
              )}
            </div>
          </div>
        ))}
        {meals.length === 0 && (
          <div className="flex items-center justify-center bg-bg/50 rounded-xl px-4 py-6 border border-dashed border-card-border">
            <p className="text-text-muted text-sm">No meals logged today</p>
          </div>
        )}
      </div>

      {/* Protein summary */}
      {totalProtein > 0 && (
        <div className="flex items-center gap-2 mb-4 bg-bg/50 rounded-xl px-4 py-2">
          <span className="text-xs text-text-muted">Protein today:</span>
          <span className="text-xs font-semibold text-text-secondary">{totalProtein}g</span>
          <span className="text-xs text-text-muted">{'\u00B7'} AI estimates</span>
        </div>
      )}

      {/* Log Meal button */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhoto(file);
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full py-3 rounded-xl bg-accent/15 border border-accent/30 text-accent font-semibold text-sm hover:bg-accent/25 transition flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Log Meal
      </button>
    </div>
  );
}
