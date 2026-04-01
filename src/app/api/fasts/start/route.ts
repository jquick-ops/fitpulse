import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST() {
  // Check for active fast
  const { data: active } = await supabase
    .from('fasts')
    .select('id')
    .is('end_time', null)
    .limit(1);

  if (active && active.length > 0) {
    return NextResponse.json({ error: 'Already fasting' }, { status: 400 });
  }

  const { data: settings } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'fasting_target_hours')
    .single();

  const targetHours = settings?.value ? parseInt(settings.value) : 16;

  const { data, error } = await supabase
    .from('fasts')
    .insert({ start_time: new Date().toISOString(), target_hours: targetHours })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
