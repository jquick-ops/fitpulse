import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Simple AI parsing stub — will be replaced with Claude API in Phase 2
function parseActivityInput(input: string) {
  const lower = input.toLowerCase();

  // Try to detect workout type
  let workoutType = 'Other';
  if (lower.includes('hockey')) workoutType = 'Hockey';
  else if (lower.includes('tennis')) workoutType = 'Tennis';
  else if (lower.includes('walk')) workoutType = 'Walking';
  else if (lower.includes('run') || lower.includes('jog')) workoutType = 'Running';
  else if (lower.includes('cycling') || lower.includes('bike') || lower.includes('peloton')) workoutType = 'Peloton Cycling';
  else if (lower.includes('tonal') || lower.includes('strength') || lower.includes('weight')) workoutType = 'Tonal Strength';
  else if (lower.includes('swim')) workoutType = 'Swimming';
  else if (lower.includes('yoga')) workoutType = 'Yoga';

  // Try to detect duration
  let duration = 60; // default
  const durationMatch = lower.match(/(\d+)\s*(?:min|minute)/);
  if (durationMatch) {
    duration = parseInt(durationMatch[1]);
  } else {
    const hourMatch = lower.match(/(\d+)\s*(?:hr|hour)/);
    if (hourMatch) duration = parseInt(hourMatch[1]) * 60;
  }

  // Try to detect percentage played
  const pctMatch = lower.match(/(\d+)\s*%/);
  if (pctMatch) {
    duration = Math.round(duration * parseInt(pctMatch[1]) / 100);
  }

  return { workoutType, duration, notes: input, source: 'Manual' };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { input } = body;

  if (!input || typeof input !== 'string') {
    return NextResponse.json({ error: 'input required' }, { status: 400 });
  }

  const parsed = parseActivityInput(input);
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      date: today,
      workout_type: parsed.workoutType,
      source: parsed.source,
      duration_minutes: parsed.duration,
      notes: parsed.notes,
      ai_parsed: true,
      raw_input: input,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
