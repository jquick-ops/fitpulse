-- FitPulse Database Schema

-- Workouts (synced from Apple Health + manual entries)
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  workout_type TEXT NOT NULL,
  source TEXT,
  duration_minutes INTEGER NOT NULL,
  start_time TIMESTAMPTZ,
  notes TEXT,
  ai_parsed BOOLEAN DEFAULT FALSE,
  raw_input TEXT,
  peloton_output_kj INTEGER,
  intensity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, workout_type, source, duration_minutes)
);

-- Meals (photo-logged with AI estimates)
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  meal_type TEXT,
  description TEXT,
  photo_url TEXT,
  estimated_calories INTEGER,
  estimated_protein_grams INTEGER,
  confidence TEXT,
  notes TEXT,
  user_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fasts
CREATE TABLE fasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  target_hours NUMERIC DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight entries
CREATE TABLE weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  weight_lbs NUMERIC NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings (key-value)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_meals_date ON meals(date);
CREATE INDEX idx_fasts_start ON fasts(start_time);
CREATE INDEX idx_weight_date ON weight_entries(date);

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('activity_target_minutes', '60'),
  ('fasting_target_hours', '16'),
  ('calorie_target', '1800'),
  ('starting_weight', '192'),
  ('goal_weight', '172'),
  ('sync_api_key', 'fp_' || encode(gen_random_bytes(16), 'hex'));
