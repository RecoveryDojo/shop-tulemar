import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Target, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  client_name: string;
  created_at: string;
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
  const calculateOverallProgress = () => {
    if (!features.length) return 0;
    const totalCompletion = features.reduce((sum, feature) => sum + feature.completion_percentage, 0);
    return Math.round(totalCompletion / features.length);
  };

  const getTotalEstimatedHours = () => {
    return features.reduce((sum, feature) => sum + feature.estimated_hours, 0);
  };

  const getTotalActualHours = () => {
    return features.reduce((sum, feature) => sum + feature.actual_hours, 0);
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
    return Math.round((estimated / actual) * 100);
  };

  const getVelocity = () => {
    const completedTasks = getTasksByStatus("done").length;
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateOverallProgress()}%</div>
            <Progress value={calculateOverallProgress()} className="mt-2" />
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
            <div className="text-2xl font-bold">{getTimeEfficiency()}%</div>
            <p className="text-xs text-muted-foreground">
              {getTotalActualHours()}h / {getTotalEstimatedHours()}h estimated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Velocity</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getVelocity()}%</div>
            <p className="text-xs text-muted-foreground">
              {getTasksByStatus("done").length} of {tasks.length} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{getOverdueTasks().length}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
          <CardDescription>Current state of all project tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { status: "backlog", label: "Backlog", color: "bg-gray-500" },
              { status: "todo", label: "To Do", color: "bg-blue-500" },
              { status: "in_progress", label: "In Progress", color: "bg-yellow-500" },
              { status: "review", label: "Review", color: "bg-purple-500" },
              { status: "testing", label: "Testing", color: "bg-orange-500" },
              { status: "done", label: "Done", color: "bg-green-500" },
              { status: "blocked", label: "Blocked", color: "bg-red-500" },
            ].map((item) => (
              <div key={item.status} className="text-center">
                <div className={`${item.color} text-white rounded-lg p-4 mb-2`}>
                  <div className="text-2xl font-bold">{getTasksByStatus(item.status).length}</div>
                </div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Task Priority Analysis</CardTitle>
          <CardDescription>Distribution of tasks by priority level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { priority: "critical", label: "Critical", color: "bg-red-500" },
              { priority: "high", label: "High", color: "bg-orange-500" },
              { priority: "medium", label: "Medium", color: "bg-yellow-500" },
              { priority: "low", label: "Low", color: "bg-green-500" },
            ].map((item) => (
              <div key={item.priority} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-2xl font-bold">{getTasksByPriority(item.priority).length}</p>
                </div>
                <Badge className={`${item.color} text-white`}>
                  {Math.round((getTasksByPriority(item.priority).length / tasks.length) * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Progress</CardTitle>
          <CardDescription>Individual feature completion status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {features.map((feature) => (
              <div key={feature.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{feature.name}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  <Badge className={`${
                    feature.priority === "critical" ? "bg-red-500" :
                    feature.priority === "high" ? "bg-orange-500" :
                    feature.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                  } text-white`}>
                    {feature.priority}
                  </Badge>
                </div>
                <Progress value={feature.completion_percentage} className="mb-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{feature.completion_percentage}% complete</span>
                  <span>{feature.actual_hours}h / {feature.estimated_hours}h</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}