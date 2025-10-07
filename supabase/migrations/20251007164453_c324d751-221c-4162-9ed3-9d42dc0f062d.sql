-- Drop Work Tracking System tables
DROP TABLE IF EXISTS public.time_entries CASCADE;
DROP TABLE IF EXISTS public.subtasks CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.milestones CASCADE;
DROP TABLE IF EXISTS public.features CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.code_activity_log CASCADE;
DROP TABLE IF EXISTS public.daily_summaries CASCADE;
DROP TABLE IF EXISTS public.work_sessions CASCADE;
DROP TABLE IF EXISTS public.documentation CASCADE;

-- Drop Messaging System tables
DROP TABLE IF EXISTS public.typing_indicators CASCADE;
DROP TABLE IF EXISTS public.message_analytics CASCADE;
DROP TABLE IF EXISTS public.message_reactions CASCADE;
DROP TABLE IF EXISTS public.message_templates CASCADE;
DROP TABLE IF EXISTS public.user_messages CASCADE;
DROP TABLE IF EXISTS public.message_threads CASCADE;

-- Drop Workflow Visualization table
DROP TABLE IF EXISTS public.saved_workflows CASCADE;

-- Drop AI Pattern Types table
DROP TABLE IF EXISTS public.ai_pattern_types CASCADE;

-- Drop custom types if no longer needed
DROP TYPE IF EXISTS public.priority_level CASCADE;
DROP TYPE IF EXISTS public.project_status CASCADE;