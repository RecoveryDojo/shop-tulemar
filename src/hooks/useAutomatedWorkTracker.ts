import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorkSession {
  id: string;
  user_id: string;
  project_id?: string;
  start_time: string;
  end_time?: string;
  session_type: string;
  activity_summary?: string;
  files_modified: any;
  lines_added: number;
  lines_removed: number;
  commits_made: number;
  features_worked_on: any;
}

interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  total_hours: number;
  session_count: number;
  projects_worked_on: any;
  tasks_completed: number;
  tasks_created: number;
  features_completed: number;
  documentation_created: number;
  productivity_score: number;
  highlights?: string[];
  blockers?: string[];
  notes?: string;
}

export const useAutomatedWorkTracker = () => {
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const { toast } = useToast();

  // Start a new work session
  const startSession = useCallback(async (projectId?: string, sessionType: string = 'development') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to start tracking work sessions.",
          variant: "destructive",
        });
        return;
      }

      const { data: session, error } = await supabase
        .from('work_sessions')
        .insert({
          user_id: user.id,
          project_id: projectId,
          session_type: sessionType,
          activity_summary: `Started ${sessionType} session`,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(session);
      setIsTracking(true);
      
      toast({
        title: "Work session started",
        description: `${sessionType} session is now being tracked.`,
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error starting session",
        description: "Failed to start work tracking session.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // End current work session
  const endSession = useCallback(async (summary?: string) => {
    if (!currentSession) return;

    try {
      const { error } = await supabase
        .from('work_sessions')
        .update({
          end_time: new Date().toISOString(),
          activity_summary: summary || currentSession.activity_summary,
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      setCurrentSession(null);
      setIsTracking(false);
      
      // Generate daily summary
      await generateDailySummary(new Date());
      
      toast({
        title: "Work session ended",
        description: "Session has been saved and daily summary updated.",
      });
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error ending session",
        description: "Failed to save work session.",
        variant: "destructive",
      });
    }
  }, [currentSession, toast]);

  // Log code activity
  const logActivity = useCallback(async (
    activityType: string,
    filePath?: string,
    componentName?: string,
    changeDescription?: string,
    impactLevel: 'minor' | 'moderate' | 'major' = 'minor'
  ) => {
    if (!currentSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('code_activity_log')
        .insert({
          user_id: user.id,
          session_id: currentSession.id,
          activity_type: activityType,
          file_path: filePath,
          component_name: componentName,
          change_description: changeDescription,
          impact_level: impactLevel,
          metadata: {
            session_type: currentSession.session_type,
            project_id: currentSession.project_id,
          }
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, [currentSession]);

  // Generate daily summary
  const generateDailySummary = useCallback(async (date: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('generate_daily_summary', {
        summary_date: date.toISOString().split('T')[0],
        summary_user_id: user.id,
      });

      if (error) throw error;

      // Fetch the updated summary
      const { data: summary } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date.toISOString().split('T')[0])
        .single();

      if (summary) {
        setDailySummary(summary);
      }
    } catch (error) {
      console.error('Error generating daily summary:', error);
    }
  }, []);

  // Load today's summary
  const loadTodaysSummary = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      const { data: summary } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      setDailySummary(summary);
    } catch (error) {
      console.error('Error loading today\'s summary:', error);
    }
  }, []);

  // Load recent work sessions
  const loadRecentSessions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(10);

      if (sessions) {
        setWorkSessions(sessions);
        
        // Check if there's an active session
        const activeSession = sessions.find(s => !s.end_time);
        if (activeSession) {
          setCurrentSession(activeSession);
          setIsTracking(true);
        }
      }
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    }
  }, []);

  // Auto-detect user activity and start session if needed
  const autoStartSession = useCallback(async (projectId?: string) => {
    if (!isTracking && !currentSession) {
      await startSession(projectId, 'development');
    }
  }, [isTracking, currentSession, startSession]);

  // Initialize on mount
  useEffect(() => {
    loadTodaysSummary();
    loadRecentSessions();
  }, [loadTodaysSummary, loadRecentSessions]);

  // Auto-end session after 2 hours of inactivity
  useEffect(() => {
    if (!currentSession || !isTracking) return;

    const inactivityTimer = setTimeout(() => {
      endSession('Session ended due to inactivity');
    }, 2 * 60 * 60 * 1000); // 2 hours

    return () => clearTimeout(inactivityTimer);
  }, [currentSession, isTracking, endSession]);

  return {
    currentSession,
    isTracking,
    dailySummary,
    workSessions,
    startSession,
    endSession,
    logActivity,
    generateDailySummary,
    loadTodaysSummary,
    autoStartSession,
  };
};