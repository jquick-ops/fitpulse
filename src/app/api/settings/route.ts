import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string> = {};
  data?.forEach((s: { key: string; value: string }) => {
    settings[s.key] = s.value;
  });
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  const updates = Object.entries(body).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('settings')
      .upsert(update, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
