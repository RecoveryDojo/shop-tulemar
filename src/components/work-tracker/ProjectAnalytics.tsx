import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Users,
  Code,
  Zap,
  BarChart3,
  Timer
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

interface ProjectAnalyticsProps {
  project: Project;
  features: Feature[];
  tasks: Task[];
}

export function ProjectAnalytics({ project, features, tasks }: ProjectAnalyticsProps) {
  const [workSessions, setWorkSessions] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [dailySummaries, setDailySummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [project.id]);

  const loadAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load work sessions for this project
      const { data: sessions } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('project_id', project.id)
        .order('start_time', { ascending: false });

      // Load time entries for project tasks
      const taskIds = tasks.map(t => t.id);
      const { data: entries } = await supabase
        .from('time_entries')
        .select('*')
        .in('task_id', taskIds)
        .order('date', { ascending: false });

      // Load recent daily summaries
      const { data: summaries } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);

      setWorkSessions(sessions || []);
      setTimeEntries(entries || []);
      setDailySummaries(summaries || []);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallProgress = () => {
    if (!features.length) return 0;
    const totalCompletion = features.reduce((sum, feature) => sum + feature.completion_percentage, 0);
    return Math.round(totalCompletion / features.length);
  };

  const getTotalEstimatedHours = () => {
    return features.reduce((sum, feature) => sum + (feature.estimated_hours || 0), 0);
  };

  const getTotalActualHours = () => {
    // Combine all time sources
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

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getTasksByPriority = (priority: string) => {
    return tasks.filter(task => task.priority === priority);
  };

  const getOverdueTasks = () => {
    return tasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== "done"
    );
  };

  const getTimeEfficiency = () => {
    const estimated = getTotalEstimatedHours();
    const actual = getTotalActualHours();
    if (estimated === 0) return 100;
    if (actual === 0) return 0;
    return Math.round((estimated / actual) * 100);
  };

  const getVelocity = () => {
    const completedTasks = getTasksByStatus("done").length;
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const getProductivityTrend = () => {
    if (dailySummaries.length < 2) return { trend: 'stable', change: 0 };
    
    const recent = dailySummaries.slice(0, 7);
    const previous = dailySummaries.slice(7, 14);
    
    const recentAvg = recent.reduce((sum, day) => sum + (day.productivity_score || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, day) => sum + (day.productivity_score || 0), 0) / previous.length;
    
    const change = Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
    
    return {
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      change: Math.abs(change)
    };
  };

  const getBurndownData = () => {
    const totalTasks = tasks.length;
    const completedTasks = getTasksByStatus("done").length;
    const inProgressTasks = getTasksByStatus("in_progress").length;
    const remaining = totalTasks - completedTasks;
    
    return {
      completed: completedTasks,
      inProgress: inProgressTasks,
      remaining: remaining,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  const getFeatureCategoryStats = () => {
    const categories = features.reduce((acc, feature) => {
      let category = 'Core Platform';
      const text = (feature.name + ' ' + feature.description).toLowerCase();
      
      if (text.includes('ui') || text.includes('frontend')) category = 'Frontend';
      else if (text.includes('api') || text.includes('backend')) category = 'Backend';
      else if (text.includes('mobile')) category = 'Mobile';
      else if (text.includes('test') || text.includes('qa')) category = 'QA';
      else if (text.includes('admin')) category = 'Admin';
      
      if (!acc[category]) {
        acc[category] = { count: 0, completed: 0, avgProgress: 0, totalHours: 0 };
      }
      
      acc[category].count++;
      if (feature.completion_percentage === 100) acc[category].completed++;
      acc[category].avgProgress += feature.completion_percentage;
      acc[category].totalHours += feature.actual_hours || 0;
      
      return acc;
    }, {} as Record<string, any>);
    
    Object.keys(categories).forEach(cat => {
      categories[cat].avgProgress = Math.round(categories[cat].avgProgress / categories[cat].count);
    });
    
    return categories;
  };

  const productivity = getProductivityTrend();
  const burndown = getBurndownData();
  const categoryStats = getFeatureCategoryStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateOverallProgress()}%</div>
            <Progress value={calculateOverallProgress()} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {features.filter(f => f.completion_percentage === 100).length} of {features.length} features complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Efficiency</CardTitle>
            {getTimeEfficiency() >= 100 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTimeEfficiency() >= 100 ? 'text-green-600' : 'text-red-600'}`}>
              {getTimeEfficiency()}%
            </div>
            <p className="text-xs text-muted-foreground">
              {getTotalActualHours().toFixed(1)}h spent / {getTotalEstimatedHours()}h estimated
            </p>
            <p className="text-xs text-muted-foreground">
              {getTimeEfficiency() >= 100 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Velocity</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getVelocity()}%</div>
            <p className="text-xs text-muted-foreground">
              {burndown.completed} of {tasks.length} tasks completed
            </p>
            <div className="flex gap-1 mt-2">
              <div className="h-2 bg-green-500 rounded" style={{ width: `${(burndown.completed / tasks.length) * 100}%` }}></div>
              <div className="h-2 bg-blue-500 rounded" style={{ width: `${(burndown.inProgress / tasks.length) * 100}%` }}></div>
              <div className="h-2 bg-gray-300 rounded" style={{ width: `${(burndown.remaining / tasks.length) * 100}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Trend</CardTitle>
            {productivity.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : productivity.trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <BarChart3 className="h-4 w-4 text-blue-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              productivity.trend === 'up' ? 'text-green-600' : 
              productivity.trend === 'down' ? 'text-red-600' : 'text-blue-600'
            }`}>
              {productivity.trend === 'stable' ? 'Stable' : `${productivity.change}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {productivity.trend === 'up' ? 'Increasing' : 
               productivity.trend === 'down' ? 'Decreasing' : 'Consistent'} vs last week
            </p>
            <p className="text-xs text-muted-foreground">
              Avg: {dailySummaries.length > 0 ? (dailySummaries.slice(0, 7).reduce((sum, day) => sum + (day.productivity_score || 0), 0) / Math.min(7, dailySummaries.length)).toFixed(1) : '0'}/10
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Task Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
          <CardDescription>Real-time project task pipeline with detailed metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { status: "backlog", label: "Backlog", color: "bg-gray-500", icon: Calendar },
              { status: "todo", label: "To Do", color: "bg-blue-500", icon: Target },
              { status: "in_progress", label: "In Progress", color: "bg-yellow-500", icon: Clock },
              { status: "review", label: "Review", color: "bg-purple-500", icon: Users },
              { status: "testing", label: "Testing", color: "bg-orange-500", icon: CheckCircle2 },
              { status: "done", label: "Done", color: "bg-green-500", icon: CheckCircle2 },
              { status: "blocked", label: "Blocked", color: "bg-red-500", icon: AlertTriangle },
            ].map((item) => {
              const count = getTasksByStatus(item.status).length;
              const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
              const IconComponent = item.icon;
              
              return (
                <div key={item.status} className="text-center">
                  <div className={`${item.color} text-white rounded-lg p-4 mb-2 relative overflow-hidden`}>
                    <IconComponent className="h-6 w-6 mx-auto mb-2 opacity-80" />
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs opacity-90">{percentage}%</div>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feature Category Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Development Category Breakdown</CardTitle>
          <CardDescription>Progress and resource allocation by development area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{category}</h4>
                    <p className="text-sm text-muted-foreground">
                      {stats.count} features • {stats.completed} completed • {stats.totalHours.toFixed(1)}h spent
                    </p>
                  </div>
                  <Badge className={`${
                    stats.avgProgress === 100 ? "bg-green-500" :
                    stats.avgProgress >= 75 ? "bg-blue-500" :
                    stats.avgProgress >= 50 ? "bg-yellow-500" :
                    stats.avgProgress >= 25 ? "bg-orange-500" : "bg-red-500"
                  } text-white`}>
                    {stats.avgProgress}% avg
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate</span>
                    <span>{Math.round((stats.completed / stats.count) * 100)}%</span>
                  </div>
                  <Progress value={(stats.completed / stats.count) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Analysis with Time Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Priority & Resource Analysis</CardTitle>
          <CardDescription>Task distribution and time allocation by priority level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { priority: "critical", label: "Critical", color: "bg-red-500" },
              { priority: "high", label: "High", color: "bg-orange-500" },
              { priority: "medium", label: "Medium", color: "bg-yellow-500" },
              { priority: "low", label: "Low", color: "bg-green-500" },
            ].map((item) => {
              const priorityTasks = getTasksByPriority(item.priority);
              const completedCount = priorityTasks.filter(t => t.status === "done").length;
              const totalHours = priorityTasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0);
              
              return (
                <div key={item.priority} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{item.label}</h4>
                    <Badge className={`${item.color} text-white`}>
                      {priorityTasks.length}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span>{completedCount}/{priorityTasks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours:</span>
                      <span>{totalHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion:</span>
                      <span>{priorityTasks.length > 0 ? Math.round((completedCount / priorityTasks.length) * 100) : 0}%</span>
                    </div>
                  </div>
                  <Progress 
                    value={priorityTasks.length > 0 ? (completedCount / priorityTasks.length) * 100 : 0} 
                    className="h-2 mt-2" 
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Work Sessions & Time Analytics */}
      {workSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Work Session Analytics</CardTitle>
            <CardDescription>Time tracking and productivity insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Timer className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{workSessions.length}</div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
              
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">
                  {workSessions.length > 0 ? (getTotalActualHours() / workSessions.length).toFixed(1) : '0'}h
                </div>
                <p className="text-sm text-muted-foreground">Avg Session Length</p>
              </div>
              
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">
                  {workSessions.filter(s => !s.end_time).length}
                </div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
              </div>
            </div>
            
            {workSessions.slice(0, 3).length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Recent Sessions</h4>
                <div className="space-y-2">
                  {workSessions.slice(0, 3).map((session, index) => (
                    <div key={session.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <div>
                        <p className="text-sm font-medium">
                          {session.activity_summary || 'Development work'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.start_time).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {session.end_time ? 
                          `${((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60 * 60)).toFixed(1)}h` :
                          'Active'
                        }
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Risk & Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Project Health Indicators</CardTitle>
          <CardDescription>Risk assessment and project health metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`text-center p-4 rounded-lg ${getOverdueTasks().length === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <AlertTriangle className={`h-8 w-8 mx-auto mb-2 ${getOverdueTasks().length === 0 ? 'text-green-500' : 'text-red-500'}`} />
              <div className={`text-2xl font-bold ${getOverdueTasks().length === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {getOverdueTasks().length}
              </div>
              <p className="text-sm text-muted-foreground">Overdue Tasks</p>
              <p className="text-xs text-muted-foreground">
                {getOverdueTasks().length === 0 ? 'All on track' : 'Require attention'}
              </p>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${getTasksByStatus("blocked").length === 0 ? 'bg-green-50' : 'bg-orange-50'}`}>
              <AlertTriangle className={`h-8 w-8 mx-auto mb-2 ${getTasksByStatus("blocked").length === 0 ? 'text-green-500' : 'text-orange-500'}`} />
              <div className={`text-2xl font-bold ${getTasksByStatus("blocked").length === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {getTasksByStatus("blocked").length}
              </div>
              <p className="text-sm text-muted-foreground">Blocked Items</p>
              <p className="text-xs text-muted-foreground">
                {getTasksByStatus("blocked").length === 0 ? 'No blockers' : 'Need resolution'}
              </p>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${getTimeEfficiency() >= 90 ? 'bg-green-50' : getTimeEfficiency() >= 70 ? 'bg-yellow-50' : 'bg-red-50'}`}>
              <Target className={`h-8 w-8 mx-auto mb-2 ${getTimeEfficiency() >= 90 ? 'text-green-500' : getTimeEfficiency() >= 70 ? 'text-yellow-500' : 'text-red-500'}`} />
              <div className={`text-2xl font-bold ${getTimeEfficiency() >= 90 ? 'text-green-600' : getTimeEfficiency() >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {getTimeEfficiency() >= 90 ? 'Good' : getTimeEfficiency() >= 70 ? 'Fair' : 'Poor'}
              </div>
              <p className="text-sm text-muted-foreground">Time Management</p>
              <p className="text-xs text-muted-foreground">
                {getTimeEfficiency()}% efficiency
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}