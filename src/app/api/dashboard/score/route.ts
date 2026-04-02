import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

interface WeekStats {
  totalMinutes: number;
  sessions: number;
  daysActive: number;
  workoutTypes: Set<string>;
}

function getWeekRange(weeksAgo: number): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

function calcWeekStats(workouts: Row[]): WeekStats {
  const daysSet = new Set<string>();
  const typesSet = new Set<string>();
  let totalMinutes = 0;

  for (const w of workouts) {
    totalMinutes += w.duration_minutes;
    daysSet.add(w.date);
    typesSet.add(w.workout_type);
  }

  return {
    totalMinutes,
    sessions: workouts.length,
    daysActive: daysSet.size,
    workoutTypes: typesSet,
  };
}

function calcGrade(current: WeekStats, avgMinutes: number, avgSessions: number, avgDays: number): { grade: string; trend: string } {
  // Score components (0-100 each)
  const volumeScore = avgMinutes > 0
    ? Math.min((current.totalMinutes / avgMinutes) * 100, 150)
    : current.totalMinutes > 0 ? 100 : 0;

  const consistencyScore = avgDays > 0
    ? Math.min((current.daysActive / avgDays) * 100, 150)
    : current.daysActive > 0 ? 100 : 0;

  const varietyScore = Math.min(current.workoutTypes.size * 25, 100);

  const sessionScore = avgSessions > 0
    ? Math.min((current.sessions / avgSessions) * 100, 150)
    : current.sessions > 0 ? 100 : 0;

  // Weighted composite
  const composite = volumeScore * 0.35 + consistencyScore * 0.30 + varietyScore * 0.15 + sessionScore * 0.20;

  let grade: string;
  if (composite >= 120) grade = 'A+';
  else if (composite >= 110) grade = 'A';
  else if (composite >= 100) grade = 'A-';
  else if (composite >= 90) grade = 'B+';
  else if (composite >= 80) grade = 'B';
  else if (composite >= 70) grade = 'B-';
  else if (composite >= 60) grade = 'C+';
  else if (composite >= 50) grade = 'C';
  else if (composite >= 40) grade = 'C-';
  else if (composite >= 30) grade = 'D';
  else grade = 'F';

  const trend = composite >= 105 ? 'up' : composite <= 85 ? 'down' : 'flat';

  return { grade, trend };
}

function generateSummary(current: WeekStats, grade: string, trend: string, avgMinutes: number): string {
  const types = Array.from(current.workoutTypes);
  const typeList = types.length > 0 ? types.join(', ') : 'no workouts';

  const volumeChange = avgMinutes > 0
    ? Math.round(((current.totalMinutes - avgMinutes) / avgMinutes) * 100)
    : 0;

  let summary = '';

  if (types.length > 0) {
    // Group by type and count
    const parts: string[] = [];
    for (const t of types) {
      parts.push(t);
    }
    summary = `${current.sessions} session${current.sessions !== 1 ? 's' : ''} across ${current.daysActive} day${current.daysActive !== 1 ? 's' : ''} — ${typeList}.`;
  } else {
    summary = 'No workouts logged this week yet.';
  }

  if (avgMinutes > 0 && current.totalMinutes > 0) {
    if (volumeChange > 0) {
      summary += ` Volume up ${volumeChange}% vs. your 8-week average.`;
    } else if (volumeChange < -10) {
      summary += ` Volume down ${Math.abs(volumeChange)}% vs. your 8-week average.`;
    } else {
      summary += ` On pace with your 8-week average.`;
    }
  }

  return summary;
}

export async function GET() {
  // Get current week and past 8 weeks of workouts
  const thisWeek = getWeekRange(0);
  const eightWeeksAgo = getWeekRange(8);

  const [{ data: currentWorkouts }, { data: historicalWorkouts }] = await Promise.all([
    supabase.from('workouts').select('*').gte('date', thisWeek.start).lte('date', thisWeek.end),
    supabase.from('workouts').select('*').gte('date', eightWeeksAgo.start).lt('date', thisWeek.start),
  ]);

  const current = calcWeekStats(currentWorkouts || []);

  // Calculate weekly averages from history
  const weeklyStats: WeekStats[] = [];
  for (let i = 1; i <= 8; i++) {
    const range = getWeekRange(i);
    const weekWorkouts = (historicalWorkouts || []).filter(
      (w: Row) => w.date >= range.start && w.date <= range.end
    );
    if (weekWorkouts.length > 0) {
      weeklyStats.push(calcWeekStats(weekWorkouts));
    }
  }

  const numWeeks = Math.max(weeklyStats.length, 1);
  const avgMinutes = weeklyStats.reduce((s, w) => s + w.totalMinutes, 0) / numWeeks;
  const avgSessions = weeklyStats.reduce((s, w) => s + w.sessions, 0) / numWeeks;
  const avgDays = weeklyStats.reduce((s, w) => s + w.daysActive, 0) / numWeeks;

  const { grade, trend } = calcGrade(current, avgMinutes, avgSessions, avgDays);
  const summary = generateSummary(current, grade, trend, avgMinutes);

  return NextResponse.json({
    grade,
    trend,
    summary,
    stats: {
      totalMinutes: current.totalMinutes,
      sessions: current.sessions,
      daysActive: current.daysActive,
      workoutTypes: Array.from(current.workoutTypes),
      avgMinutesPerWeek: Math.round(avgMinutes),
    },
  });
}
