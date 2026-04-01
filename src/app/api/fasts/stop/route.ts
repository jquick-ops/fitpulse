import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST() {
  const { data: active } = await supabase
    .from('fasts')
    .select('id')
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1);

  if (!active || active.length === 0) {
    return NextResponse.json({ error: 'No active fast' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('fasts')
    .update({ end_time: new Date().toISOString() })
    .eq('id', active[0].id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
