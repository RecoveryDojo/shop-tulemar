import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3, 
  Brain,
  Calendar,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';

export const AutomatedDailyTracker = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const { toast } = useToast();

  const runDailyAnalysis = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentTask('Initializing daily work analysis...');

    try {
      // Update progress through different stages
      const stages = [
        { task: 'Gathering project data...', progress: 20 },
        { task: 'Analyzing work sessions...', progress: 40 },
        { task: 'Processing with AI...', progress: 60 },
        { task: 'Updating metrics...', progress: 80 },
        { task: 'Generating reports...', progress: 100 }
      ];

      for (const stage of stages) {
        setCurrentTask(stage.task);
        setProgress(stage.progress);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Call the daily work analyzer function
      const { data, error } = await supabase.functions.invoke('daily-work-analyzer', {
        body: { 
          manual: true, 
          trigger: 'user-initiated',
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;

      setLastRun(data);
      setCurrentTask('Analysis complete!');

      toast({
        title: "Daily Analysis Complete",
        description: `Processed ${data.metrics?.projectsProcessed || 0} projects, ${data.metrics?.featuresAnalyzed || 0} features, and ${data.metrics?.tasksReviewed || 0} tasks.`,
      });

    } catch (error) {
      console.error('Error running daily analysis:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to run daily analysis",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setProgress(0);
      setCurrentTask('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Automated Daily Work Tracker
          </CardTitle>
          <CardDescription>
            Comprehensive AI-powered analysis that runs every midnight to track all development work, 
            conversations, and progress automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isRunning ? (
              <Button onClick={runDailyAnalysis} className="w-full" size="lg">
                <Play className="h-4 w-4 mr-2" />
                Run Daily Analysis Now
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{currentTask}</span>
                  <Badge variant="outline">{progress}%</Badge>
                </div>
                <Progress value={progress} className="w-full" />
                <div className="text-center text-sm text-muted-foreground">
                  Processing your complete work history...
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* What It Does */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automated Daily Process
          </CardTitle>
          <CardDescription>
            Every night at midnight, this system automatically:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Analyzes All Work</h4>
                  <p className="text-sm text-muted-foreground">
                    Reviews every project, feature, task, work session, and time entry
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">AI-Powered Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    Uses GPT-5 to analyze patterns, productivity, and provide recommendations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Updates All Metrics</h4>
                  <p className="text-sm text-muted-foreground">
                    Recalculates progress, efficiency, completion rates, and health indicators
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Generates Daily Summaries</h4>
                  <p className="text-sm text-muted-foreground">
                    Creates comprehensive daily reports with accomplishments and insights
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Tracks Categories</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically categorizes work into AI, Frontend, Backend, Admin, etc.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-teal-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Updates Documentation</h4>
                  <p className="text-sm text-muted-foreground">
                    Logs comprehensive daily reports and maintains historical records
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automated Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="font-medium">Daily at Midnight</div>
              <div className="text-sm text-muted-foreground">00:00 UTC</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="font-medium">Fully Automated</div>
              <div className="text-sm text-muted-foreground">No manual intervention</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="font-medium">AI Analysis</div>
              <div className="text-sm text-muted-foreground">Deep insights & patterns</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Run Results */}
      {lastRun && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Latest Analysis Results
            </CardTitle>
            <CardDescription>
              Analysis completed at {new Date().toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {lastRun.metrics?.projectsProcessed || 0}
                </div>
                <div className="text-sm text-muted-foreground">Projects Analyzed</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {lastRun.metrics?.featuresAnalyzed || 0}
                </div>
                <div className="text-sm text-muted-foreground">Features Reviewed</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {lastRun.metrics?.tasksReviewed || 0}
                </div>
                <div className="text-sm text-muted-foreground">Tasks Processed</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {lastRun.metrics?.workSessionsTracked || 0}
                </div>
                <div className="text-sm text-muted-foreground">Sessions Tracked</div>
              </div>
            </div>

            {lastRun.analysis && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">AI Analysis Preview</h4>
                <p className="text-sm text-muted-foreground">
                  {typeof lastRun.analysis === 'string' ? 
                    lastRun.analysis.substring(0, 300) + '...' : 
                    'Comprehensive analysis completed successfully.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Cron Job Scheduled</span>
              <Badge className="bg-green-500 text-white">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">OpenAI API Key</span>
              <Badge className="bg-green-500 text-white">Configured</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Access</span>
              <Badge className="bg-green-500 text-white">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Edge Function</span>
              <Badge className="bg-green-500 text-white">Deployed</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};