import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Stub for Phase 4 — Claude Vision integration
  // For now, create a placeholder meal entry
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('meals')
    .insert({
      date: today,
      meal_type: 'meal',
      description: 'Meal (photo analysis coming soon)',
      estimated_calories: 500,
      estimated_protein_grams: 25,
      confidence: 'low',
      notes: 'Placeholder — Claude Vision integration in Phase 4',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
