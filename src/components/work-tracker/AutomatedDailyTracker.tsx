import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, FileText, Brain, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AutomatedDailyTracker() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  const [dailySummaries, setDailySummaries] = useState<any[]>([]);
  const [workSessions, setWorkSessions] = useState<any[]>([]);
  const [isCreatingLog, setIsCreatingLog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDailySummaries();
    loadWorkSessions();
  }, []);

  const loadDailySummaries = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .order("date", { ascending: false })
        .limit(7);
      
      if (error) throw error;
      setDailySummaries(data || []);
    } catch (error) {
      console.error("Error loading daily summaries:", error);
    }
  };

  const loadWorkSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("work_sessions")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setWorkSessions(data || []);
    } catch (error) {
      console.error("Error loading work sessions:", error);
    }
  };

  const runDailyAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-work-analyzer', {
        body: { 
          manual: true, 
          trigger: 'user-initiated',
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;
      
      setLastAnalysis(data);
      
      toast({
        title: "Analysis Complete",
        description: "Daily work analysis has been completed successfully.",
      });
      
      // Reload summaries after analysis
      loadDailySummaries();
      loadWorkSessions();
    } catch (error) {
      console.error("Error running daily analysis:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to run daily work analysis.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createDailyWorkLog = async () => {
    setIsCreatingLog(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's completed tasks and features for ALL projects
      const { data: projects } = await supabase.from("projects").select("*");
      const { data: features } = await supabase.from("features").select("*, projects(name)");
      const { data: tasks } = await supabase.from("tasks").select("*, features(name), projects(name)").eq("status", "done");
      const { data: timeEntries } = await supabase.from("time_entries").select("*, tasks(title)").gte("created_at", today);
      
      let workDescription = `DAILY WORK SUMMARY - ${new Date().toLocaleDateString()}\n\n`;
      
      // Add executive summary
      const totalHours = tasks?.reduce((sum, t) => sum + (t.actual_hours || 0), 0) || 0;
      const timeHours = timeEntries?.reduce((sum, t) => sum + (t.hours || 0), 0) || 0;
      const completedFeatures = features?.filter(f => f.completion_percentage === 100) || [];
      
      workDescription += `📊 EXECUTIVE SUMMARY:\n`;
      workDescription += `• Tasks Completed: ${tasks?.length || 0}\n`;
      workDescription += `• Features Completed: ${completedFeatures.length}\n`;
      workDescription += `• Hours from Tasks: ${totalHours.toFixed(1)}h\n`;
      workDescription += `• Hours from Time Entries: ${timeHours.toFixed(1)}h\n`;
      workDescription += `• Projects Active: ${projects?.length || 0}\n\n`;
      
      // Add completed features
      if (completedFeatures.length > 0) {
        workDescription += `🎯 COMPLETED FEATURES:\n`;
        completedFeatures.forEach(feature => {
          workDescription += `• ${feature.name}\n`;
          workDescription += `  Project: ${feature.projects?.name || 'Unknown'}\n`;
          workDescription += `  Description: ${feature.description || 'No description'}\n`;
          workDescription += `  Hours: ${feature.actual_hours}/${feature.estimated_hours}\n`;
          workDescription += `  Progress: ${feature.completion_percentage}%\n\n`;
        });
      }
      
      // Add completed tasks by project
      if (tasks && tasks.length > 0) {
        workDescription += `✅ COMPLETED TASKS BY PROJECT:\n`;
        const tasksByProject = tasks.reduce((acc, task) => {
          const projectName = task.projects?.name || 'Unknown Project';
          if (!acc[projectName]) acc[projectName] = [];
          acc[projectName].push(task);
          return acc;
        }, {});
        
        Object.entries(tasksByProject).forEach(([projectName, projectTasks]: [string, any[]]) => {
          workDescription += `\n📁 ${projectName}:\n`;
          projectTasks.forEach(task => {
            workDescription += `  • ${task.title}\n`;
            workDescription += `    Feature: ${task.features?.name || 'No feature'}\n`;
            workDescription += `    Description: ${task.description || 'No description'}\n`;
            workDescription += `    Hours: ${task.actual_hours}/${task.estimated_hours}\n`;
            workDescription += `    Priority: ${task.priority}\n\n`;
          });
        });
      }
      
      // Add time entries
      if (timeEntries && timeEntries.length > 0) {
        workDescription += `⏰ TIME ENTRIES TODAY:\n`;
        timeEntries.forEach(entry => {
          workDescription += `• ${entry.hours}h - ${entry.description || 'No description'}\n`;
          workDescription += `  Task: ${entry.tasks?.title || 'Manual entry'}\n`;
          workDescription += `  Date: ${new Date(entry.date).toLocaleDateString()}\n\n`;
        });
      }
      
      // Add project breakdown
      if (projects && projects.length > 0) {
        workDescription += `📋 PROJECT STATUS:\n`;
        projects.forEach(project => {
          const projectFeatures = features?.filter(f => f.project_id === project.id) || [];
          const projectTasks = tasks?.filter(t => t.project_id === project.id) || [];
          const avgProgress = projectFeatures.length > 0 ? 
            Math.round(projectFeatures.reduce((sum, f) => sum + f.completion_percentage, 0) / projectFeatures.length) : 0;
          
          workDescription += `• ${project.name} - ${project.status}\n`;
          workDescription += `  Features: ${projectFeatures.length} (${avgProgress}% avg completion)\n`;
          workDescription += `  Tasks: ${projectTasks.length} completed today\n`;
          workDescription += `  Budget: $${project.budget || 0}\n\n`;
        });
      }
      
      workDescription += `\n⭐ Generated automatically by Daily Work Tracker\n`;
      workDescription += `Timestamp: ${new Date().toISOString()}\n`;
      
      // Create documentation entry for the most active project or first project
      const targetProject = projects?.[0];
      if (!targetProject) {
        throw new Error("No projects found to attach documentation to");
      }
      
      const { error } = await supabase
        .from("documentation")
        .insert([{
          project_id: targetProject.id,
          title: `Daily Work Log - ${new Date().toLocaleDateString()}`,
          description: `Comprehensive daily work summary: ${tasks?.length || 0} tasks completed, ${completedFeatures.length} features finished, ${(totalHours + timeHours).toFixed(1)} hours logged`,
          type: "feature",
          status: "completed",
          priority: "medium",
          tags: ["daily-log", "auto-generated", "work-summary", "comprehensive"],
          notes: workDescription
        }]);
        
      if (error) throw error;
      
      toast({
        title: "Daily Work Log Created",
        description: `Comprehensive daily log added to documentation for ${targetProject.name}`,
      });
      
    } catch (error) {
      console.error("Error creating daily work log:", error);
      toast({
        title: "Error Creating Daily Log",
        description: error.message || "Failed to create daily work log.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Automated Daily Tracker</h2>
          <p className="text-muted-foreground">AI-powered daily work analysis and consolidated work logging</p>
        </div>
      </div>

      {/* Manual Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Work Analysis & Logging
          </CardTitle>
          <CardDescription>
            Automated analysis runs daily at midnight. Create comprehensive daily work logs from all completed work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runDailyAnalysis} 
              disabled={isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
              <TrendingUp className="h-4 w-4" />
              {isAnalyzing ? "Analyzing..." : "Run Daily Analysis"}
            </Button>
            
            <Button 
              onClick={createDailyWorkLog}
              disabled={isCreatingLog}
              variant="outline"
              className="gap-2"
            >
              {isCreatingLog && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
              <FileText className="h-4 w-4" />
              {isCreatingLog ? "Creating..." : "Create Comprehensive Daily Log"}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            The daily log will capture ALL completed tasks, features, time entries, and project status across all projects.
          </div>
          
          {lastAnalysis && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Last Analysis Result:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Projects:</span>
                  <div className="font-medium">{lastAnalysis.metrics?.projectsProcessed || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Features:</span>
                  <div className="font-medium">{lastAnalysis.metrics?.featuresAnalyzed || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tasks:</span>
                  <div className="font-medium">{lastAnalysis.metrics?.tasksReviewed || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Sessions:</span>
                  <div className="font-medium">{lastAnalysis.metrics?.workSessionsTracked || 0}</div>
                </div>
              </div>
              {lastAnalysis.analysis && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {lastAnalysis.analysis}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Summaries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Daily Summaries
          </CardTitle>
          <CardDescription>AI-generated daily work summaries and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {dailySummaries.length > 0 ? (
            <div className="space-y-4">
              {dailySummaries.map((summary) => (
                <div key={summary.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{new Date(summary.date).toLocaleDateString()}</h4>
                    <Badge variant="outline">{summary.productivity_score}/10</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Hours:</span>
                      <div className="font-medium">{summary.total_hours}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sessions:</span>
                      <div className="font-medium">{summary.session_count}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tasks:</span>
                      <div className="font-medium">{summary.tasks_completed}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Features:</span>
                      <div className="font-medium">{summary.features_completed}</div>
                    </div>
                  </div>
                  {summary.notes && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {summary.notes}
                    </div>
                  )}
                  {summary.highlights && summary.highlights.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-medium mb-1">Highlights:</div>
                      <div className="text-sm text-muted-foreground">
                        {summary.highlights.join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No daily summaries yet. Run daily analysis to generate summaries.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Recent Work Sessions
          </CardTitle>
          <CardDescription>Detailed work session tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {workSessions.length > 0 ? (
            <div className="space-y-3">
              {workSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{session.activity_summary || "Work Session"}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(session.start_time).toLocaleDateString()} - {session.session_type}
                    </div>
                    {session.features_worked_on && session.features_worked_on.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Features: {session.features_worked_on.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {session.end_time ? 
                        `${((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60 * 60)).toFixed(1)}h` :
                        "Active"
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.commits_made || 0} commits, {session.lines_added || 0} lines
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No work sessions tracked yet. Start tracking to see sessions here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            System Status
          </CardTitle>
          <CardDescription>Automated daily tracking system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="font-medium text-sm">Scheduled</div>
              <div className="text-xs text-muted-foreground">Daily at 00:00 UTC</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Brain className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="font-medium text-sm">AI Analysis</div>
              <div className="text-xs text-muted-foreground">GPT-5 Powered</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="font-medium text-sm">Database</div>
              <div className="text-xs text-muted-foreground">Connected</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="font-medium text-sm">Edge Function</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}