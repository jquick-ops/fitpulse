'use client';

interface StatusPillsProps {
  moveMinutes: number;
  moveTarget: number;
  fastHours: number | null;
  fastTarget: number;
  isFasting: boolean;
  calories: number;
  calorieTarget: number;
}

export default function StatusPills({
  moveMinutes,
  moveTarget,
  fastHours,
  fastTarget,
  isFasting,
  calories,
  calorieTarget,
}: StatusPillsProps) {
  const moveHit = moveMinutes >= moveTarget;
  const fastHit = fastHours !== null && fastHours >= fastTarget;
  const eatHit = calories > 0 && calories <= calorieTarget;

  return (
    <div className="flex gap-2 mt-4">
      <div className={`flex-1 rounded-xl px-3 py-2 text-center border ${
        moveHit
          ? 'bg-accent/10 border-accent/20'
          : 'bg-card border-card-border'
      }`}>
        <div className={`text-[10px] uppercase tracking-wider font-semibold ${moveHit ? 'text-accent' : 'text-text-muted'}`}>Move</div>
        <div className={`font-bold text-sm mt-0.5 ${moveHit ? 'text-accent' : 'text-text-secondary'}`}>{moveMinutes} min</div>
      </div>
      <div className={`flex-1 rounded-xl px-3 py-2 text-center border ${
        fastHit
          ? 'bg-accent/10 border-accent/20'
          : isFasting
            ? 'bg-accent-amber/10 border-accent-amber/20'
            : 'bg-card border-card-border'
      }`}>
        <div className={`text-[10px] uppercase tracking-wider font-semibold ${
          fastHit ? 'text-accent' : isFasting ? 'text-accent-amber' : 'text-text-muted'
        }`}>Fast</div>
        <div className={`font-bold text-sm mt-0.5 ${
          fastHit ? 'text-accent' : isFasting ? 'text-accent-amber' : 'text-text-secondary'
        }`}>
          {fastHours !== null ? `${Math.floor(fastHours)}h ${Math.round((fastHours % 1) * 60)}m` : '—'}
        </div>
      </div>
      <div className={`flex-1 rounded-xl px-3 py-2 text-center border ${
        eatHit
          ? 'bg-accent/10 border-accent/20'
          : calories > calorieTarget
            ? 'bg-accent-red/10 border-accent-red/20'
            : 'bg-card border-card-border'
      }`}>
        <div className={`text-[10px] uppercase tracking-wider font-semibold ${
          eatHit ? 'text-accent' : calories > calorieTarget ? 'text-accent-red' : 'text-text-muted'
        }`}>Eat</div>
        <div className={`font-bold text-sm mt-0.5 ${
          eatHit ? 'text-accent' : calories > calorieTarget ? 'text-accent-red' : 'text-text-secondary'
        }`}>{calories.toLocaleString()} cal</div>
      </div>
    </div>
  );
}
