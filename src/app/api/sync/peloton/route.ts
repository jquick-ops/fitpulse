import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Store synced workouts from client-side Peloton fetch
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { workouts } = body;

  if (!workouts || !Array.isArray(workouts)) {
    return NextResponse.json({ error: 'No workouts provided' }, { status: 400 });
  }

  let synced = 0;
  let skipped = 0;

  for (const w of workouts) {
    // Check if already synced
    const { data: existing } = await supabase
      .from('workouts')
      .select('id')
      .eq('date', w.date)
      .eq('workout_type', w.workout_type)
      .eq('source', 'Peloton')
      .eq('duration_minutes', w.duration_minutes)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from('workouts').insert({
      date: w.date,
      workout_type: w.workout_type,
      source: 'Peloton',
      duration_minutes: w.duration_minutes,
      start_time: w.start_time || null,
      peloton_output_kj: w.peloton_output_kj || null,
      notes: w.notes || null,
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
        : 'No workouts to sync',
  });
}
