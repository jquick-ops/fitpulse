import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const WORKOUT_TYPE_MAP: Record<string, string> = {
  cycling: 'Peloton Cycling',
  running: 'Peloton Running',
  functional_strength_training: 'Tonal Strength',
  traditional_strength_training: 'Tonal Strength',
  strength_training: 'Tonal Strength',
  hockey: 'Hockey',
  tennis: 'Tennis',
  walking: 'Walking',
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { api_key, workouts, weight } = body;

  // Validate API key
  const { data: keySetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'sync_api_key')
    .single();

  if (!keySetting || keySetting.value !== api_key) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const results = { workouts_synced: 0, weight_synced: false };

  // Sync workouts
  if (workouts && Array.isArray(workouts)) {
    for (const w of workouts) {
      const workoutType = WORKOUT_TYPE_MAP[w.type] || w.type || 'Other';
      const date = w.start_time
        ? new Date(w.start_time).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('workouts').upsert(
        {
          date,
          workout_type: workoutType,
          source: w.source || 'Apple Health',
          duration_minutes: w.duration_minutes,
          start_time: w.start_time || null,
          peloton_output_kj: w.output_kj || null,
        },
        { onConflict: 'date,workout_type,source,duration_minutes' }
      );

      if (!error) results.workouts_synced++;
    }
  }

  // Sync weight
  if (weight?.lbs && weight?.date) {
    const { error } = await supabase
      .from('weight_entries')
      .upsert({ date: weight.date, weight_lbs: weight.lbs, source: 'apple_health' }, { onConflict: 'date' });

    if (!error) results.weight_synced = true;
  }

  return NextResponse.json({ success: true, ...results });
}
