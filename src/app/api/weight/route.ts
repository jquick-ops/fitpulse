import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { weight_lbs } = body;

  if (!weight_lbs || typeof weight_lbs !== 'number') {
    return NextResponse.json({ error: 'weight_lbs required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('weight_entries')
    .upsert({ date: today, weight_lbs, source: 'manual' }, { onConflict: 'date' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
