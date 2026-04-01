-- Seed data for FitPulse development/testing

-- Workouts (past 2 weeks)
INSERT INTO workouts (date, workout_type, source, duration_minutes, start_time, peloton_output_kj) VALUES
  (CURRENT_DATE, 'Peloton Cycling', 'Peloton', 30, CURRENT_DATE + TIME '07:00', 320),
  (CURRENT_DATE, 'Tonal Strength', 'Tonal', 35, CURRENT_DATE + TIME '17:30', NULL),
  (CURRENT_DATE - 1, 'Peloton Cycling', 'Peloton', 45, (CURRENT_DATE - 1) + TIME '06:30', 410),
  (CURRENT_DATE - 2, 'Tonal Strength', 'Tonal', 40, (CURRENT_DATE - 2) + TIME '17:00', NULL),
  (CURRENT_DATE - 2, 'Walking', 'Apple Watch', 25, (CURRENT_DATE - 2) + TIME '12:00', NULL),
  (CURRENT_DATE - 3, 'Peloton Cycling', 'Peloton', 30, (CURRENT_DATE - 3) + TIME '07:00', 295),
  (CURRENT_DATE - 3, 'Tonal Strength', 'Tonal', 30, (CURRENT_DATE - 3) + TIME '17:30', NULL),
  (CURRENT_DATE - 4, 'Peloton Running', 'Peloton', 35, (CURRENT_DATE - 4) + TIME '06:00', 280),
  (CURRENT_DATE - 5, 'Hockey', 'Manual', 48, (CURRENT_DATE - 5) + TIME '20:00', NULL),
  (CURRENT_DATE - 6, 'Peloton Cycling', 'Peloton', 45, (CURRENT_DATE - 6) + TIME '07:00', 390),
  (CURRENT_DATE - 6, 'Walking', 'Apple Watch', 20, (CURRENT_DATE - 6) + TIME '12:30', NULL),
  (CURRENT_DATE - 7, 'Tonal Strength', 'Tonal', 40, (CURRENT_DATE - 7) + TIME '17:00', NULL),
  (CURRENT_DATE - 7, 'Peloton Cycling', 'Peloton', 30, (CURRENT_DATE - 7) + TIME '07:00', 310),
  (CURRENT_DATE - 8, 'Peloton Cycling', 'Peloton', 45, (CURRENT_DATE - 8) + TIME '06:30', 405),
  (CURRENT_DATE - 9, 'Tonal Strength', 'Tonal', 35, (CURRENT_DATE - 9) + TIME '17:30', NULL),
  (CURRENT_DATE - 10, 'Peloton Running', 'Peloton', 30, (CURRENT_DATE - 10) + TIME '06:00', 270),
  (CURRENT_DATE - 10, 'Walking', 'Apple Watch', 30, (CURRENT_DATE - 10) + TIME '12:00', NULL),
  (CURRENT_DATE - 11, 'Hockey', 'Manual', 50, (CURRENT_DATE - 11) + TIME '20:00', NULL),
  (CURRENT_DATE - 12, 'Peloton Cycling', 'Peloton', 45, (CURRENT_DATE - 12) + TIME '07:00', 400),
  (CURRENT_DATE - 13, 'Tonal Strength', 'Tonal', 40, (CURRENT_DATE - 13) + TIME '17:00', NULL);

-- Meals (today)
INSERT INTO meals (date, meal_type, description, estimated_calories, estimated_protein_grams, confidence) VALUES
  (CURRENT_DATE, 'breakfast', 'Oatmeal with berries and almonds', 350, 28, 'high'),
  (CURRENT_DATE, 'lunch', 'Grilled chicken salad with avocado', 480, 42, 'high'),
  (CURRENT_DATE, 'snack', 'Apple with peanut butter', 310, 8, 'medium');

-- Fasts (this week)
INSERT INTO fasts (start_time, end_time, target_hours) VALUES
  (CURRENT_DATE - INTERVAL '1 day' + TIME '20:00', CURRENT_DATE + TIME '12:20', 16),
  (CURRENT_DATE - INTERVAL '2 days' + TIME '20:30', CURRENT_DATE - INTERVAL '1 day' + TIME '12:30', 16),
  (CURRENT_DATE - INTERVAL '3 days' + TIME '19:00', CURRENT_DATE - INTERVAL '2 days' + TIME '13:00', 16),
  (CURRENT_DATE - INTERVAL '4 days' + TIME '20:00', CURRENT_DATE - INTERVAL '3 days' + TIME '12:00', 16),
  (CURRENT_DATE - INTERVAL '5 days' + TIME '21:00', CURRENT_DATE - INTERVAL '4 days' + TIME '09:00', 16),
  (CURRENT_DATE - INTERVAL '6 days' + TIME '20:00', CURRENT_DATE - INTERVAL '5 days' + TIME '12:00', 16);

-- Weight entries (past 3 months)
INSERT INTO weight_entries (date, weight_lbs, source) VALUES
  (CURRENT_DATE - 90, 192.0, 'manual'),
  (CURRENT_DATE - 83, 191.5, 'manual'),
  (CURRENT_DATE - 76, 191.0, 'manual'),
  (CURRENT_DATE - 69, 190.8, 'manual'),
  (CURRENT_DATE - 62, 190.2, 'manual'),
  (CURRENT_DATE - 55, 190.0, 'manual'),
  (CURRENT_DATE - 48, 189.5, 'manual'),
  (CURRENT_DATE - 41, 189.0, 'manual'),
  (CURRENT_DATE - 34, 188.8, 'manual'),
  (CURRENT_DATE - 27, 188.5, 'manual'),
  (CURRENT_DATE - 20, 188.0, 'manual'),
  (CURRENT_DATE - 13, 187.8, 'manual'),
  (CURRENT_DATE - 6, 187.5, 'manual'),
  (CURRENT_DATE - 2, 187.5, 'manual');
