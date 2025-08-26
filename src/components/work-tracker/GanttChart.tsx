import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

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

interface GanttChartProps {
  tasks: Task[];
  features: Feature[];
}

export function GanttChart({ tasks, features }: GanttChartProps) {
  const getTasksByFeature = (featureId: string) => {
    return tasks.filter(task => task.feature_id === featureId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "review": return "bg-purple-500";
      case "testing": return "bg-orange-500";
      case "blocked": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (!dueDate || status === "done") return false;
    return new Date(dueDate) < new Date();
  };

  // Generate timeline months for the next 6 months
  const generateTimelineMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push(month.toLocaleString('default', { month: 'short', year: 'numeric' }));
    }
    return months;
  };

  const timelineMonths = generateTimelineMonths();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
          <CardDescription>
            Visual timeline of all features and tasks with their progress and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Timeline Header */}
          <div className="grid grid-cols-12 gap-2 mb-4 text-sm font-medium text-muted-foreground">
            <div className="col-span-4">Task/Feature</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-2">Progress</div>
          </div>

          {/* Timeline Content */}
          <div className="space-y-4">
            {features.map((feature) => (
              <div key={feature.id} className="border rounded-lg p-4 bg-muted/50">
                {/* Feature Row */}
                <div className="grid grid-cols-12 gap-2 items-center mb-3">
                  <div className="col-span-4">
                    <div className="font-medium text-sm">{feature.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {feature.description}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-xs">
                      Feature
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Badge className={`${getPriorityColor(feature.priority)} text-white text-xs`}>
                      {feature.priority}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {feature.estimated_hours}h est.
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium">{feature.completion_percentage}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${feature.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Feature Tasks */}
                <div className="ml-4 space-y-2">
                  {getTasksByFeature(feature.id).map((task) => (
                    <div key={task.id} className="grid grid-cols-12 gap-2 items-center py-2 border-l-2 border-muted pl-4">
                      <div className="col-span-4">
                        <div className="text-sm">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {task.description}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Badge className={`${getStatusColor(task.status)} text-white text-xs`}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className={`col-span-2 text-sm ${
                        isOverdue(task.due_date, task.status) ? "text-red-500 font-medium" : "text-muted-foreground"
                      }`}>
                        {formatDate(task.due_date)}
                      </div>
                      <div className="col-span-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{task.actual_hours}h / {task.estimated_hours}h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {getTasksByFeature(feature.id).length === 0 && (
                    <div className="text-sm text-muted-foreground italic pl-4">
                      No tasks yet for this feature
                    </div>
                  )}
                </div>
              </div>
            ))}

            {features.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Features to Display</h3>
                <p className="text-sm">Create features and tasks to see the timeline visualization</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Tasks due in the next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks
              .filter(task => {
                if (!task.due_date || task.status === "done") return false;
                const dueDate = new Date(task.due_date);
                const today = new Date();
                const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                return dueDate <= thirtyDaysFromNow;
              })
              .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
              .slice(0, 10)
              .map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getStatusColor(task.status)} text-white text-xs`}>
                        {task.status.replace("_", " ")}
                      </Badge>
                      <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    isOverdue(task.due_date, task.status) ? "text-red-500" : "text-muted-foreground"
                  }`}>
                    {formatDate(task.due_date)}
                  </div>
                </div>
              ))}
            
            {tasks.filter(task => {
              if (!task.due_date || task.status === "done") return false;
              const dueDate = new Date(task.due_date);
              const today = new Date();
              const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
              return dueDate <= thirtyDaysFromNow;
            }).length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming deadlines in the next 30 days</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}