import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface ParsedActivity {
  workoutType: string;
  duration: number | null;
  intensity: string | null;
  date: string;
  notes: string;
  source: string;
  needsMoreInfo: boolean;
  followUp: string | null;
}

function parseActivityInput(input: string): ParsedActivity {
  const lower = input.toLowerCase();
  const today = new Date().toISOString().split('T')[0];

  // Detect workout type
  let workoutType = 'Other';
  if (lower.includes('hockey')) workoutType = 'Hockey';
  else if (lower.includes('ball hockey')) workoutType = 'Ball Hockey';
  else if (lower.includes('tennis')) workoutType = 'Tennis';
  else if (lower.includes('walk')) workoutType = 'Walking';
  else if (lower.includes('run') || lower.includes('jog')) workoutType = 'Running';
  else if (lower.includes('cycling') || lower.includes('bike') || lower.includes('peloton')) workoutType = 'Peloton Cycling';
  else if (lower.includes('tonal') || lower.includes('strength') || lower.includes('weight')) workoutType = 'Tonal Strength';
  else if (lower.includes('swim')) workoutType = 'Swimming';
  else if (lower.includes('yoga')) workoutType = 'Yoga';
  else if (lower.includes('basketball')) workoutType = 'Basketball';
  else if (lower.includes('soccer') || lower.includes('football')) workoutType = 'Soccer';
  else if (lower.includes('golf')) workoutType = 'Golf';
  else if (lower.includes('ski')) workoutType = 'Skiing';
  else if (lower.includes('hike') || lower.includes('hiking')) workoutType = 'Hiking';

  // Detect duration
  let duration: number | null = null;
  const durationMatch = lower.match(/(\d+)\s*(?:min|minute)/);
  if (durationMatch) {
    duration = parseInt(durationMatch[1]);
  } else {
    const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour)/);
    if (hourMatch) duration = Math.round(parseFloat(hourMatch[1]) * 60);
  }

  // Detect percentage played (for team sports)
  const pctMatch = lower.match(/(\d+)\s*%/);
  if (pctMatch && duration) {
    duration = Math.round(duration * parseInt(pctMatch[1]) / 100);
  }

  // Detect date references
  let date = today;
  if (lower.includes('yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().split('T')[0];
  } else if (lower.includes('saturday')) {
    const d = new Date();
    const daysSinceSat = (d.getDay() + 1) % 7;
    d.setDate(d.getDate() - (daysSinceSat === 0 ? 7 : daysSinceSat));
    date = d.toISOString().split('T')[0];
  } else if (lower.includes('sunday')) {
    const d = new Date();
    const daysSinceSun = d.getDay();
    d.setDate(d.getDate() - (daysSinceSun === 0 ? 7 : daysSinceSun));
    date = d.toISOString().split('T')[0];
  } else if (lower.includes('friday')) {
    const d = new Date();
    const daysSinceFri = (d.getDay() + 2) % 7;
    d.setDate(d.getDate() - (daysSinceFri === 0 ? 7 : daysSinceFri));
    date = d.toISOString().split('T')[0];
  }

  // Detect intensity from keywords
  let intensity: string | null = null;
  if (lower.includes('felt strong') || lower.includes('hard') || lower.includes('intense') || lower.includes('crushed')) {
    intensity = 'high';
  } else if (lower.includes('easy') || lower.includes('light') || lower.includes('chill') || lower.includes('recovery')) {
    intensity = 'low';
  } else if (lower.includes('moderate') || lower.includes('good') || lower.includes('solid')) {
    intensity = 'medium';
  }

  // Extract stats/notes (goals, assists, score, etc.)
  let notes = input;
  const statsPatterns = [
    /(\d+)\s*(?:g|goals?)/i,
    /(\d+)\s*(?:a|assists?)/i,
    /(?:we\s+)?(?:won|lost|tied)/i,
    /\d+-\d+/,
  ];
  const foundStats: string[] = [];
  for (const pat of statsPatterns) {
    const m = input.match(pat);
    if (m) foundStats.push(m[0]);
  }
  if (foundStats.length > 0) {
    notes = foundStats.join(' · ');
  }

  // Determine if we need more info
  let needsMoreInfo = false;
  let followUp: string | null = null;

  if (workoutType === 'Other') {
    needsMoreInfo = true;
    followUp = "What type of activity was this? (e.g., hockey, tennis, cycling, strength training)";
  } else if (duration === null) {
    // Default durations by sport
    const defaultDurations: Record<string, number> = {
      'Hockey': 60, 'Ball Hockey': 60, 'Tennis': 60, 'Basketball': 60, 'Soccer': 90,
      'Walking': 30, 'Running': 30, 'Swimming': 30, 'Yoga': 45, 'Hiking': 60, 'Golf': 180,
    };
    if (defaultDurations[workoutType]) {
      duration = defaultDurations[workoutType];
      if (pctMatch) {
        duration = Math.round(duration * parseInt(pctMatch[1]) / 100);
      }
    } else {
      needsMoreInfo = true;
      followUp = `How long was the ${workoutType.toLowerCase()} session? (e.g., 45 min, 1 hour)`;
    }
  }

  return {
    workoutType,
    duration,
    intensity,
    date,
    notes,
    source: 'Manual',
    needsMoreInfo,
    followUp,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { input } = body;

  if (!input || typeof input !== 'string') {
    return NextResponse.json({ error: 'input required' }, { status: 400 });
  }

  const parsed = parseActivityInput(input);

  // If we need more info, ask a follow-up question
  if (parsed.needsMoreInfo) {
    return NextResponse.json({
      success: false,
      follow_up: parsed.followUp,
    });
  }

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      date: parsed.date,
      workout_type: parsed.workoutType,
      source: parsed.source,
      duration_minutes: parsed.duration,
      notes: parsed.notes,
      intensity: parsed.intensity,
      ai_parsed: true,
      raw_input: input,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    workout: {
      workout_type: data.workout_type,
      duration_minutes: data.duration_minutes,
      notes: parsed.notes,
    },
  });
}
