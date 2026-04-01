import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import StatusPills from '@/components/StatusPills';
import MoveCard from '@/components/MoveCard';
import FastCard from '@/components/FastCard';
import EatCard from '@/components/EatCard';
import WeightCard from '@/components/WeightCard';

export const dynamic = 'force-dynamic';

function getWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

export default async function Dashboard() {
  const today = toDateStr(new Date());
  const weekDates = getWeekDates();
  const weekStart = toDateStr(weekDates[0]);
  const weekEnd = toDateStr(weekDates[6]);
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Fetch all data in parallel
  const [
    { data: todayWorkouts },
    { data: weekWorkouts },
    { data: todayMeals },
    { data: activeFast },
    { data: weekFasts },
    { data: latestWeight },
    { data: weightEntries },
    { data: settings },
    { data: allWorkoutsForStreak },
  ] = await Promise.all([
    supabase.from('workouts').select('*').eq('date', today).order('start_time'),
    supabase.from('workouts').select('*').gte('date', weekStart).lte('date', weekEnd),
    supabase.from('meals').select('*').eq('date', today).order('created_at'),
    supabase.from('fasts').select('*').is('end_time', null).order('start_time', { ascending: false }).limit(1),
    supabase.from('fasts').select('*').gte('start_time', weekDates[0].toISOString()).lte('start_time', weekDates[6].toISOString()),
    supabase.from('weight_entries').select('*').order('date', { ascending: false }).limit(1),
    supabase.from('weight_entries').select('*').order('date', { ascending: true }),
    supabase.from('settings').select('*'),
    supabase.from('workouts').select('date, duration_minutes').order('date', { ascending: false }).limit(500),
  ]);

  // Parse settings
  const settingsMap: Record<string, string> = {};
  settings?.forEach((s: { key: string; value: string }) => {
    settingsMap[s.key] = s.value;
  });
  const activityTarget = parseInt(settingsMap.activity_target_minutes || '60');
  const fastingTarget = parseInt(settingsMap.fasting_target_hours || '16');
  const calorieTarget = parseInt(settingsMap.calorie_target || '1800');
  const startingWeight = parseFloat(settingsMap.starting_weight || '192');
  const goalWeight = parseFloat(settingsMap.goal_weight || '172');

  // Move data
  const totalMinutes = todayWorkouts?.reduce((sum: number, w: { duration_minutes: number }) => sum + w.duration_minutes, 0) || 0;

  // Streak calculation
  let streak = 0;
  if (allWorkoutsForStreak) {
    const byDate: Record<string, number> = {};
    allWorkoutsForStreak.forEach((w: { date: string; duration_minutes: number }) => {
      byDate[w.date] = (byDate[w.date] || 0) + w.duration_minutes;
    });
    const d = new Date();
    if (!byDate[toDateStr(d)] || byDate[toDateStr(d)] < activityTarget) {
      d.setDate(d.getDate() - 1);
    }
    while (byDate[toDateStr(d)] && byDate[toDateStr(d)] >= activityTarget) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
  }

  // Move week
  const moveWeek = weekDates.map((date, i) => {
    const dateStr = toDateStr(date);
    const dayWorkouts = weekWorkouts?.filter((w: { date: string }) => w.date === dateStr) || [];
    const mins = dayWorkouts.reduce((sum: number, w: { duration_minutes: number }) => sum + w.duration_minutes, 0);
    const isToday = dateStr === today;
    const isPast = date < new Date(today);
    return {
      label: dayLabels[i],
      hit: isPast || isToday ? mins >= activityTarget : null,
      minutes: mins,
    };
  });

  // Fast data
  const currentFast = activeFast?.[0] || null;
  const isFasting = !!currentFast;
  let fastElapsed: number | null = null;
  if (currentFast) {
    fastElapsed = (Date.now() - new Date(currentFast.start_time).getTime()) / 1000 / 3600;
  }

  const completedFastsToday = weekFasts?.filter((f: { end_time: string | null }) => f.end_time !== null) || [];
  const lastCompleted = completedFastsToday.length > 0
    ? (new Date(completedFastsToday[completedFastsToday.length - 1].end_time!).getTime() - new Date(completedFastsToday[completedFastsToday.length - 1].start_time).getTime()) / 3600000
    : null;

  // Fast week
  const fastWeek = weekDates.map((date, i) => {
    const dayFasts = weekFasts?.filter((f: { start_time: string }) => {
      const fDate = new Date(f.start_time).toISOString().split('T')[0];
      return fDate === toDateStr(date);
    }) || [];
    let hours: number | null = null;
    if (dayFasts.length > 0) {
      hours = dayFasts.reduce((sum: number, f: { start_time: string; end_time: string | null }) => {
        const end = f.end_time ? new Date(f.end_time).getTime() : Date.now();
        return sum + (end - new Date(f.start_time).getTime()) / 3600000;
      }, 0);
    }
    const isPast = date < new Date(today);
    return {
      label: dayLabels[i],
      hours,
      hit: hours !== null ? hours >= fastingTarget : (isPast ? false : null),
    };
  });

  // Eat data
  const totalCalories = todayMeals?.reduce((sum: number, m: { estimated_calories: number }) => sum + (m.estimated_calories || 0), 0) || 0;
  const totalProtein = todayMeals?.reduce((sum: number, m: { estimated_protein_grams: number | null }) => sum + (m.estimated_protein_grams || 0), 0) || 0;

  // Weight data
  const currentWeight = latestWeight?.[0]?.weight_lbs ?? null;
  const lastLoggedDate = latestWeight?.[0]?.date ?? null;

  return (
    <div className="max-w-[430px] mx-auto min-h-screen relative">
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md px-5 pt-5 pb-3">
        <Header />
        <StatusPills
          moveMinutes={totalMinutes}
          moveTarget={activityTarget}
          fastHours={isFasting ? fastElapsed : lastCompleted}
          fastTarget={fastingTarget}
          isFasting={isFasting}
          calories={totalCalories}
          calorieTarget={calorieTarget}
        />
      </div>

      <div className="px-5 pb-24 space-y-4 mt-2">
        <MoveCard
          workouts={todayWorkouts || []}
          totalMinutes={totalMinutes}
          target={activityTarget}
          streak={streak}
          weekDays={moveWeek}
          weeklyScore={null}
          weeklySummary={null}
          weeklyTrend={null}
        />
        <FastCard
          isFasting={isFasting}
          fastStartTime={currentFast?.start_time || null}
          lastCompletedHours={lastCompleted}
          targetHours={fastingTarget}
          weekDays={fastWeek}
        />
        <EatCard
          meals={todayMeals || []}
          totalCalories={totalCalories}
          totalProtein={totalProtein}
          target={calorieTarget}
        />
        <WeightCard
          currentWeight={currentWeight}
          startingWeight={startingWeight}
          goalWeight={goalWeight}
          entries={weightEntries || []}
          lastLoggedDate={lastLoggedDate}
        />
      </div>
    </div>
  );
}
