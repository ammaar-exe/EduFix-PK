-- Migration: Create user_activities table for Activity Log
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT CHECK (feature_type IN ('notes', 'answer_assistant', 'answer_checker')),
  title TEXT,
  prompt_payload JSONB,
  result_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Policies: users can only interact with their own rows
CREATE POLICY "select_own_activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own_activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_activities" ON user_activities
  FOR DELETE USING (auth.uid() = user_id);
