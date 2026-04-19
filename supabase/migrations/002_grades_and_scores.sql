-- ============================================================
-- ADD GRADE SCALE TO COURSES
-- ============================================================
alter table public.courses
  add column grade_scale jsonb default '[{"letter":"A","min":90},{"letter":"B","min":80},{"letter":"C","min":70},{"letter":"D","min":60},{"letter":"F","min":0}]';

-- ============================================================
-- ADD SCORING & LATE TRACKING TO TASKS
-- ============================================================
alter table public.tasks
  add column score numeric,
  add column points_earned numeric,
  add column points_possible numeric,
  add column is_extra_credit boolean default false,
  add column submitted_late boolean default false;
