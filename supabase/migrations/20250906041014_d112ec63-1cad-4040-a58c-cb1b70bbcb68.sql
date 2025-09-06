-- Create work sessions table for automated tracking
CREATE TABLE work_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  session_type TEXT NOT NULL DEFAULT 'development',
  activity_summary TEXT,
  files_modified JSONB DEFAULT '[]'::jsonb,
  lines_added INTEGER DEFAULT 0,
  lines_removed INTEGER DEFAULT 0,
  commits_made INTEGER DEFAULT 0,
  features_worked_on JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily summaries table
CREATE TABLE daily_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_hours NUMERIC NOT NULL DEFAULT 0,
  session_count INTEGER NOT NULL DEFAULT 0,
  projects_worked_on JSONB DEFAULT '[]'::jsonb,
  tasks_completed INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  features_completed INTEGER DEFAULT 0,
  documentation_created INTEGER DEFAULT 0,
  productivity_score NUMERIC DEFAULT 0.0,
  highlights TEXT[],
  blockers TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create code activity log table
CREATE TABLE code_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES work_sessions(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activity_type TEXT NOT NULL, -- 'file_edit', 'component_create', 'feature_add', etc.
  file_path TEXT,
  component_name TEXT,
  change_description TEXT,
  impact_level TEXT DEFAULT 'minor', -- 'minor', 'moderate', 'major'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own work sessions" 
ON work_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own daily summaries" 
ON daily_summaries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own code activity" 
ON code_activity_log FOR ALL USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_work_sessions_updated_at
BEFORE UPDATE ON work_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_summaries_updated_at
BEFORE UPDATE ON daily_summaries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate daily summary
CREATE OR REPLACE FUNCTION generate_daily_summary(summary_date DATE, summary_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  summary_id UUID;
  total_session_hours NUMERIC := 0;
  session_count_val INTEGER := 0;
  tasks_completed_val INTEGER := 0;
  tasks_created_val INTEGER := 0;
  features_completed_val INTEGER := 0;
  doc_created_val INTEGER := 0;
BEGIN
  -- Calculate metrics for the day
  SELECT 
    COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, now()) - start_time)) / 3600), 0),
    COUNT(*)
  INTO total_session_hours, session_count_val
  FROM work_sessions 
  WHERE user_id = summary_user_id 
    AND start_time::date = summary_date;

  -- Count tasks completed and created on this date
  SELECT COUNT(*) INTO tasks_completed_val
  FROM tasks 
  WHERE updated_at::date = summary_date 
    AND status = 'completed';

  SELECT COUNT(*) INTO tasks_created_val
  FROM tasks 
  WHERE created_at::date = summary_date;

  -- Count features completed
  SELECT COUNT(*) INTO features_completed_val
  FROM features 
  WHERE updated_at::date = summary_date 
    AND completion_percentage = 100;

  -- Count documentation created
  SELECT COUNT(*) INTO doc_created_val
  FROM documentation 
  WHERE created_at::date = summary_date 
    AND created_by = summary_user_id;

  -- Insert or update daily summary
  INSERT INTO daily_summaries (
    user_id, date, total_hours, session_count, 
    tasks_completed, tasks_created, features_completed, 
    documentation_created, productivity_score
  ) VALUES (
    summary_user_id, summary_date, total_session_hours, session_count_val,
    tasks_completed_val, tasks_created_val, features_completed_val,
    doc_created_val, LEAST(10.0, total_session_hours * 2)
  )
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    total_hours = EXCLUDED.total_hours,
    session_count = EXCLUDED.session_count,
    tasks_completed = EXCLUDED.tasks_completed,
    tasks_created = EXCLUDED.tasks_created,
    features_completed = EXCLUDED.features_completed,
    documentation_created = EXCLUDED.documentation_created,
    productivity_score = EXCLUDED.productivity_score,
    updated_at = now()
  RETURNING id INTO summary_id;

  RETURN summary_id;
END;
$$;