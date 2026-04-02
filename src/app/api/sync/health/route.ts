import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const WORKOUT_TYPE_MAP: Record<string, string> = {
  cycling: 'Peloton Cycling',
  'indoor cycling': 'Peloton Cycling',
  'indoor cycle': 'Peloton Cycling',
  running: 'Peloton Running',
  'indoor run': 'Peloton Running',
  functional_strength_training: 'Tonal Strength',
  'functional strength training': 'Tonal Strength',
  traditional_strength_training: 'Tonal Strength',
  'traditional strength training': 'Tonal Strength',
  strength_training: 'Tonal Strength',
  'strength training': 'Tonal Strength',
  hockey: 'Hockey',
  tennis: 'Tennis',
  walking: 'Walking',
  yoga: 'Yoga',
  hiking: 'Hiking',
  swimming: 'Swimming',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeWorkoutType(raw: any): string {
  if (!raw) return 'Other';
  const lower = String(raw).toLowerCase().trim();
  return WORKOUT_TYPE_MAP[lower] || String(raw);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDuration(workout: any): number | null {
  // Try direct duration field
  if (workout.duration_minutes) return Math.round(Number(workout.duration_minutes));
  if (workout.duration) {
    const d = Number(workout.duration);
    // If > 300, probably in seconds
    return d > 300 ? Math.round(d / 60) : Math.round(d);
  }
  // Try start/end time calculation
  if (workout.start_time && workout.end_time) {
    const start = new Date(workout.start_time).getTime();
    const end = new Date(workout.end_time).getTime();
    if (!isNaN(start) && !isNaN(end) && end > start) {
      return Math.round((end - start) / 60000);
    }
  }
  if (workout.Start && workout.End) {
    const start = new Date(workout.Start).getTime();
    const end = new Date(workout.End).getTime();
    if (!isNaN(start) && !isNaN(end) && end > start) {
      return Math.round((end - start) / 60000);
    }
  }
  // Try Date and Duration (Apple Health format)
  if (workout.Date && workout.Duration) {
    const d = Number(workout.Duration);
    return d > 300 ? Math.round(d / 60) : Math.round(d);
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDate(workout: any): string {
  const today = new Date().toISOString().split('T')[0];
  const candidates = [workout.date, workout.Date, workout.start_time, workout.Start, workout.startDate];
  for (const c of candidates) {
    if (c) {
      try {
        const d = new Date(c);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      } catch { /* skip */ }
    }
  }
  return today;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSource(workout: any): string {
  const raw = workout.source || workout.Source || workout.sourceName || '';
  const lower = String(raw).toLowerCase();
  if (lower.includes('peloton')) return 'Peloton';
  if (lower.includes('tonal')) return 'Tonal';
  if (lower.includes('apple') || lower.includes('watch')) return 'Apple Watch';
  return raw || 'Apple Health';
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Log the raw payload for debugging
  await supabase.from('settings').upsert({
    key: 'last_sync_payload',
    value: JSON.stringify(body).slice(0, 4000),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  // Validate API key
  const apiKey = body.api_key || body.apiKey || body.key;
  if (apiKey) {
    const { data: keySetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'sync_api_key')
      .single();

    if (keySetting && keySetting.value !== apiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
  }

  // Handle different payload formats
  // 1. Direct workouts array: { workouts: [...] }
  // 2. iOS Shortcuts sends the whole body as an array
  // 3. Single workout object
  let workouts: unknown[] = [];
  if (Array.isArray(body)) {
    workouts = body;
  } else if (Array.isArray(body.workouts)) {
    workouts = body.workouts;
  } else if (body.type || body.Type || body.workout_type || body.Duration) {
    workouts = [body];
  }

  const results = { workouts_synced: 0, skipped: 0, errors: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const w of workouts as any[]) {
    const workoutType = normalizeWorkoutType(w.type || w.Type || w.workout_type || w.activityType || w['Activity Type']);
    const duration = parseDuration(w);
    const date = parseDate(w);
    const source = parseSource(w);
    const startTime = w.start_time || w.Start || w.startDate || null;

    if (!duration || duration < 1) {
      results.errors++;
      continue;
    }

    // Deduplicate
    const { data: existing } = await supabase
      .from('workouts')
      .select('id')
      .eq('date', date)
      .eq('workout_type', workoutType)
      .eq('duration_minutes', duration)
      .limit(1);

    if (existing && existing.length > 0) {
      results.skipped++;
      continue;
    }

    const { error } = await supabase.from('workouts').insert({
      date,
      workout_type: workoutType,
      source,
      duration_minutes: duration,
      start_time: startTime ? new Date(startTime).toISOString() : null,
      peloton_output_kj: w.output_kj || w.totalEnergy || null,
      notes: w.notes || w.Name || null,
      ai_parsed: false,
    });

    if (!error) results.workouts_synced++;
    else results.errors++;
  }

  // Also handle weight
  const weight = body.weight;
  let weightSynced = false;
  if (weight?.lbs && weight?.date) {
    const { error } = await supabase
      .from('weight_entries')
      .upsert({ date: weight.date, weight_lbs: weight.lbs, source: 'apple_health' }, { onConflict: 'date' });
    if (!error) weightSynced = true;
  }

  return NextResponse.json({
    success: true,
    ...results,
    weight_synced: weightSynced,
    message: results.workouts_synced > 0
      ? `Synced ${results.workouts_synced} workout${results.workouts_synced !== 1 ? 's' : ''}`
      : results.skipped > 0
        ? 'All workouts already synced'
        : 'No workouts found in payload',
  });
}
