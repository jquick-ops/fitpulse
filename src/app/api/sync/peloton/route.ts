import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const PELOTON_API = 'https://api.onepeloton.com';

const DISCIPLINE_MAP: Record<string, string> = {
  cycling: 'Peloton Cycling',
  bike_bootcamp: 'Peloton Cycling',
  running: 'Peloton Running',
  walking: 'Walking',
  strength: 'Tonal Strength',
  stretching: 'Yoga',
  yoga: 'Yoga',
  meditation: 'Yoga',
  cardio: 'Peloton Cycling',
};

export async function POST() {
  // Get Peloton credentials from settings
  const { data: settings } = await supabase.from('settings').select('*');
  const settingsMap: Record<string, string> = {};
  settings?.forEach((s: { key: string; value: string }) => {
    settingsMap[s.key] = s.value;
  });

  const username = settingsMap.peloton_username;
  const password = settingsMap.peloton_password;

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Peloton credentials not configured. Go to Settings to add them.' },
      { status: 400 }
    );
  }

  // Authenticate with Peloton
  let sessionId: string;
  let userId: string;

  try {
    const authRes = await fetch(`${PELOTON_API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username_or_email: username,
        password: password,
      }),
    });

    if (!authRes.ok) {
      const err = await authRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || 'Peloton login failed. Check your credentials.' },
        { status: 401 }
      );
    }

    const authData = await authRes.json();
    sessionId = authData.session_id;
    userId = authData.user_id;
  } catch {
    return NextResponse.json({ error: 'Could not reach Peloton servers' }, { status: 502 });
  }

  // Fetch recent workouts (last 7 days worth, up to 20)
  const headers = {
    Cookie: `peloton_session_id=${sessionId}`,
    'Peloton-Platform': 'web',
  };

  let workouts;
  try {
    const workoutsRes = await fetch(
      `${PELOTON_API}/api/user/${userId}/workouts?joins=ride&limit=20&page=0`,
      { headers }
    );

    if (!workoutsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch Peloton workouts' }, { status: 502 });
    }

    const workoutsData = await workoutsRes.json();
    workouts = workoutsData.data || [];
  } catch {
    return NextResponse.json({ error: 'Could not fetch workouts from Peloton' }, { status: 502 });
  }

  // Filter to last 7 days and sync
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.getTime() / 1000;

  let synced = 0;
  let skipped = 0;

  for (const w of workouts) {
    // Skip old workouts or incomplete ones
    if (w.created_at < cutoff) continue;
    if (w.status !== 'COMPLETE') continue;

    const startTime = new Date(w.start_time * 1000);
    const date = startTime.toISOString().split('T')[0];
    const durationMinutes = Math.round((w.end_time - w.start_time) / 60);
    const workoutType = DISCIPLINE_MAP[w.fitness_discipline] || 'Peloton Cycling';
    const outputKj = w.total_work ? Math.round(w.total_work / 1000) : null;

    // Check if already synced (same date, type, source, duration)
    const { data: existing } = await supabase
      .from('workouts')
      .select('id')
      .eq('date', date)
      .eq('workout_type', workoutType)
      .eq('source', 'Peloton')
      .eq('duration_minutes', durationMinutes)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    const rideName = w.ride?.title || null;

    const { error } = await supabase.from('workouts').insert({
      date,
      workout_type: workoutType,
      source: 'Peloton',
      duration_minutes: durationMinutes,
      start_time: startTime.toISOString(),
      peloton_output_kj: outputKj,
      notes: rideName,
      ai_parsed: false,
    });

    if (!error) synced++;
  }

  return NextResponse.json({
    success: true,
    synced,
    skipped,
    message: synced > 0
      ? `Synced ${synced} Peloton workout${synced !== 1 ? 's' : ''}`
      : skipped > 0
        ? 'All workouts already synced'
        : 'No recent Peloton workouts found',
  });
}
