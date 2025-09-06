import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Target,
  Users,
  Code,
  TestTube,
  Database,
  Smartphone,
  Settings
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  client_name: string;
  created_at: string;
  budget?: number;
}

interface Feature {
  id: string;
  project_id: string;
  name: string;
  description: string;
  priority: string;
  estimated_hours: number;
  actual_hours: number;
  completion_percentage: number;
  created_at: string;
}

interface Task {
  id: string;
  feature_id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  estimated_hours: number;
  actual_hours: number;
  due_date: string;
  created_at: string;
}

interface WorkTrackerHeaderProps {
  project: Project;
  features: Feature[];
  tasks: Task[];
  onBackToHome: () => void;
}

export function WorkTrackerHeader({ project, features, tasks, onBackToHome }: WorkTrackerHeaderProps) {
  const [workSessions, setWorkSessions] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState<any>(null);

  useEffect(() => {
    loadWorkData();
  }, [project.id]);

  const loadWorkData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load work sessions for this project
      const { data: sessions } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('project_id', project.id)
        .eq('user_id', user.id);

      // Load time entries for project tasks
      const taskIds = tasks.map(t => t.id);
      const { data: entries } = await supabase
        .from('time_entries')
        .select('*')
        .in('task_id', taskIds)
        .eq('user_id', user.id);

      // Load today's summary
      const today = new Date().toISOString().split('T')[0];
      const { data: summary } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      setWorkSessions(sessions || []);
      setTimeEntries(entries || []);
      setDailySummary(summary);
    } catch (error) {
      console.error('Error loading work data:', error);
    }
  };

  // Enhanced calculations using real data
  const calculateOverallProgress = () => {
    if (!features.length) return 0;
    const totalCompletion = features.reduce((sum, feature) => sum + feature.completion_percentage, 0);
    return Math.round(totalCompletion / features.length);
  };

  const getTotalEstimatedHours = () => {
    return features.reduce((sum, feature) => sum + (feature.estimated_hours || 0), 0);
  };

  const getTotalActualHours = () => {
    const featureHours = features.reduce((sum, feature) => sum + (feature.actual_hours || 0), 0);
    const sessionHours = workSessions.reduce((sum, session) => {
      if (session.end_time) {
        const duration = new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
        return sum + (duration / (1000 * 60 * 60));
      }
      return sum;
    }, 0);
    const timeEntryHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    
    return Math.max(featureHours, sessionHours, timeEntryHours);
  };

  const getTaskCounts = () => {
    const completed = tasks.filter(task => task.status === "done").length;
    const inProgress = tasks.filter(task => task.status === "in_progress").length;
    const notStarted = tasks.filter(task => task.status === "backlog" || task.status === "todo").length;
    const blocked = tasks.filter(task => task.status === "blocked").length;
    const testing = tasks.filter(task => task.status === "testing" || task.status === "review").length;
    
    return { completed, inProgress, notStarted, blocked, testing };
  };

  const getTimeEfficiency = () => {
    const estimated = getTotalEstimatedHours();
    const actual = getTotalActualHours();
    if (estimated === 0) return 100;
    return Math.round((estimated / actual) * 100);
  };

  const getBudgetProgress = () => {
    if (!project.budget) return null;
    const hourlyRate = 75; // Default rate
    const spentAmount = getTotalActualHours() * hourlyRate;
    const percentage = Math.round((spentAmount / project.budget) * 100);
    return { spent: spentAmount, total: project.budget, percentage };
  };

  const getFeatureCategories = () => {
    const categories = features.reduce((acc, feature) => {
      let category = determineCategory(feature.name, feature.description);
      if (!acc[category]) {
        acc[category] = { 
          features: [], 
          totalEstimated: 0, 
          totalActual: 0, 
          avgCompletion: 0,
          icon: getCategoryIcon(category)
        };
      }
      acc[category].features.push(feature);
      acc[category].totalEstimated += feature.estimated_hours || 0;
      acc[category].totalActual += feature.actual_hours || 0;
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.keys(categories).forEach(cat => {
      const categoryData = categories[cat];
      categoryData.avgCompletion = Math.round(
        categoryData.features.reduce((sum: number, f: Feature) => sum + f.completion_percentage, 0) / 
        categoryData.features.length
      );
    });

    return categories;
  };

  const determineCategory = (name: string, description: string) => {
    const text = (name + ' ' + description).toLowerCase();
    
    if (text.includes('ui') || text.includes('frontend') || text.includes('component') || text.includes('interface')) {
      return 'Frontend Development';
    } else if (text.includes('api') || text.includes('backend') || text.includes('server') || text.includes('database')) {
      return 'Backend Development';
    } else if (text.includes('mobile') || text.includes('app') || text.includes('ios') || text.includes('android')) {
      return 'Mobile Development';
    } else if (text.includes('test') || text.includes('qa') || text.includes('quality')) {
      return 'Quality Assurance';
    } else if (text.includes('devops') || text.includes('deploy') || text.includes('infrastructure')) {
      return 'DevOps & Infrastructure';
    } else if (text.includes('admin') || text.includes('management') || text.includes('dashboard')) {
      return 'Admin & Management';
    } else if (text.includes('integration') || text.includes('third-party') || text.includes('external')) {
      return 'Integrations';
    } else if (text.includes('security') || text.includes('auth') || text.includes('permission')) {
      return 'Security & Authentication';
    }
    return 'Core Platform';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Frontend Development': return Code;
      case 'Backend Development': return Database;
      case 'Mobile Development': return Smartphone;
      case 'Quality Assurance': return TestTube;
      case 'DevOps & Infrastructure': return Settings;
      case 'Admin & Management': return Users;
      case 'Integrations': return Target;
      case 'Security & Authentication': return AlertTriangle;
      default: return FileText;
    }
  };

  const taskCounts = getTaskCounts();
  const budgetProgress = getBudgetProgress();
  const categories = getFeatureCategories();
  const efficiency = getTimeEfficiency();

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBackToHome} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {features.length} Features • {tasks.length} Tasks
          </Badge>
          <Badge className={`text-white text-sm ${
            calculateOverallProgress() >= 90 ? "bg-green-500" :
            calculateOverallProgress() >= 70 ? "bg-blue-500" :
            calculateOverallProgress() >= 50 ? "bg-yellow-500" : "bg-orange-500"
          }`}>
            {calculateOverallProgress()}% Complete
          </Badge>
        </div>
      </div>

      {/* Main Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">{project.name}</h1>
        <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
          {project.description}
        </p>
        {project.client_name && (
          <Badge variant="outline" className="text-sm">
            Client: {project.client_name}
          </Badge>
        )}
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-500">{taskCounts.completed}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-500">{taskCounts.inProgress}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-500">{taskCounts.notStarted}</div>
            <p className="text-sm text-muted-foreground">Not Started</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${efficiency >= 100 ? 'text-green-600' : 'text-orange-600'} flex items-center justify-center gap-1`}>
              {efficiency >= 100 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {efficiency}%
            </div>
            <p className="text-sm text-muted-foreground">Time Efficiency</p>
            <p className="text-xs text-muted-foreground">{getTotalActualHours().toFixed(1)}h / {getTotalEstimatedHours()}h</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{taskCounts.testing}</div>
            <p className="text-sm text-muted-foreground">In QA/Review</p>
            <p className="text-xs text-muted-foreground">
              {Math.round((taskCounts.testing / tasks.length) * 100)}% of tasks
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{calculateOverallProgress()}%</div>
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            {budgetProgress && (
              <p className="text-xs text-muted-foreground">
                ${budgetProgress.spent.toLocaleString()} / ${budgetProgress.total.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Development Categories with Real Data */}
      <Card>
        <CardHeader>
          <CardTitle>Development Categories</CardTitle>
          <CardDescription>
            Progress breakdown by functional areas with real-time data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Object.entries(categories).map(([categoryName, categoryData]) => {
              const IconComponent = categoryData.icon;
              const isOnTrack = categoryData.totalActual <= categoryData.totalEstimated;
              
              return (
                <div key={categoryName} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-6 w-6 text-primary" />
                    <div>
                      <h4 className="font-medium">{categoryName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {categoryData.features.length} features • {categoryData.totalActual.toFixed(1)}h spent
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {categoryData.totalActual.toFixed(1)}h / {categoryData.totalEstimated}h
                      </div>
                      <div className={`text-xs ${isOnTrack ? 'text-green-600' : 'text-orange-600'}`}>
                        {isOnTrack ? 'On track' : `${Math.round(((categoryData.totalActual / categoryData.totalEstimated) - 1) * 100)}% over`}
                      </div>
                    </div>
                    <Badge 
                      className={`text-white ${
                        categoryData.avgCompletion === 100 ? "bg-green-500" :
                        categoryData.avgCompletion >= 75 ? "bg-blue-500" :
                        categoryData.avgCompletion >= 50 ? "bg-yellow-500" :
                        categoryData.avgCompletion >= 25 ? "bg-orange-500" : "bg-red-500"
                      }`}
                    >
                      {categoryData.avgCompletion}% complete
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Project Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Project Health Dashboard</CardTitle>
          <CardDescription>
            Real-time project metrics and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500 mb-2 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                {taskCounts.blocked === 0 ? 'Zero' : taskCounts.blocked}
              </div>
              <p className="text-sm text-muted-foreground">
                {taskCounts.blocked === 0 ? 'Blocked Items' : 'Blocked Tasks'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-medium text-muted-foreground mb-1">Active Sessions</div>
              <div className="text-3xl font-bold">
                {workSessions.filter(s => !s.end_time).length}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-medium text-muted-foreground mb-1">Today's Hours</div>
              <div className="text-3xl font-bold text-blue-500">
                {dailySummary?.total_hours?.toFixed(1) || '0'}h
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-medium text-muted-foreground mb-1">Velocity</div>
              <div className="text-3xl font-bold text-purple-500">
                {Math.round((taskCounts.completed / tasks.length) * 100)}%
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Feature Completion</span>
                <span>{calculateOverallProgress()}% ({features.filter(f => f.completion_percentage === 100).length}/{features.length} features)</span>
              </div>
              <Progress value={calculateOverallProgress()} className="h-3" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Time Progress</span>
                <span>
                  {getTotalActualHours().toFixed(1)}h / {getTotalEstimatedHours()}h 
                  ({Math.round((getTotalActualHours() / getTotalEstimatedHours()) * 100)}%)
                </span>
              </div>
              <Progress value={Math.min(100, (getTotalActualHours() / getTotalEstimatedHours()) * 100)} className="h-3" />
            </div>

            {budgetProgress && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Budget Utilization</span>
                  <span>
                    ${budgetProgress.spent.toLocaleString()} / ${budgetProgress.total.toLocaleString()} 
                    ({budgetProgress.percentage}%)
                  </span>
                </div>
                <Progress value={budgetProgress.percentage} className="h-3" />
              </div>
            )}
          </div>

          {workSessions.length > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Recent Activity</h4>
              <p className="text-sm text-muted-foreground">
                Last session: {workSessions[workSessions.length - 1]?.activity_summary || 'Development work'}
              </p>
              <p className="text-sm text-muted-foreground">
                Total sessions: {workSessions.length} • Average session: {
                  workSessions.length > 0 ? 
                  (getTotalActualHours() / workSessions.length).toFixed(1) : '0'
                }h
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}