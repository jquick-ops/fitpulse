import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { source, workout_type, duration_minutes, peloton_output_kj, date, start_time, notes } = body;

  if (!workout_type || !duration_minutes || !date) {
    return NextResponse.json({ error: 'workout_type, duration_minutes, and date are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      date,
      workout_type,
      source: source || 'Manual',
      duration_minutes,
      start_time: start_time || null,
      peloton_output_kj: peloton_output_kj || null,
      notes: notes || null,
      ai_parsed: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, workout: data });
}
