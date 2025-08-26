import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertTriangle, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface WorkTrackerHeaderProps {
  project: Project;
  features: Feature[];
  tasks: Task[];
  onBackToHome: () => void;
}

export function WorkTrackerHeader({ project, features, tasks, onBackToHome }: WorkTrackerHeaderProps) {
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

  const getCompletedTasks = () => {
    return tasks.filter(task => task.status === "done").length;
  };

  const getInProgressTasks = () => {
    return tasks.filter(task => task.status === "in_progress").length;
  };

  const getNotStartedTasks = () => {
    return tasks.filter(task => task.status === "backlog" || task.status === "todo").length;
  };

  const getHoursProgress = () => {
    const estimated = getTotalEstimatedHours();
    const actual = getTotalActualHours();
    if (estimated === 0) return 0;
    return Math.round((actual / estimated) * 100);
  };

  const getQAProgress = () => {
    const testingTasks = tasks.filter(task => task.status === "testing" || task.status === "review").length;
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;
    return Math.round((testingTasks / totalTasks) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBackToHome} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            View Documentation
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Update Documentation
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {features.length} / {features.length} Features
          </Badge>
          <Badge className="bg-green-500 text-white text-sm">
            {calculateOverallProgress()}% Complete
          </Badge>
        </div>
      </div>

      {/* Main Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">{project.name} Development Tracker</h1>
        <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
          {project.description}
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-500">{getCompletedTasks()}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-500">{getInProgressTasks()}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-500">{getNotStartedTasks()}</div>
            <p className="text-sm text-muted-foreground">Not Started</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{getHoursProgress()}%</div>
            <p className="text-sm text-muted-foreground">Dev Hours Complete</p>
            <p className="text-xs text-muted-foreground">{getTotalActualHours()}h / {getTotalEstimatedHours()}h</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{getQAProgress()}%</div>
            <p className="text-sm text-muted-foreground">QA Hours Complete</p>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => t.status === "testing" || t.status === "review").length}h / {Math.round(getTotalEstimatedHours() * 0.2)}h
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{calculateOverallProgress()}%</div>
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            <p className="text-xs text-muted-foreground">Complete Project Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Development Categories Header */}
      <Card>
        <CardHeader>
          <CardTitle>Development Categories</CardTitle>
          <CardDescription>Progress breakdown by major functional areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Group features by category */}
            {Object.entries(
              features.reduce((acc, feature) => {
                // Group features by their category (derived from name patterns)
                let category = "Core Platform";
                if (feature.name.includes("Guest") || feature.name.includes("Shopping") || feature.name.includes("Catalog")) {
                  category = "Guest Experience";
                } else if (feature.name.includes("Driver") || feature.name.includes("Route") || feature.name.includes("Mobile")) {
                  category = "Driver Dashboard";
                } else if (feature.name.includes("Admin") || feature.name.includes("Management") || feature.name.includes("Analytics")) {
                  category = "Admin Portal";
                } else if (feature.name.includes("Integration") || feature.name.includes("API") || feature.name.includes("WordPress")) {
                  category = "Integrations";
                } else if (feature.name.includes("Architecture") || feature.name.includes("Security") || feature.name.includes("Performance")) {
                  category = "Technical Infrastructure";
                } else if (feature.name.includes("Testing") || feature.name.includes("Documentation")) {
                  category = "Quality Assurance";
                }
                
                if (!acc[category]) acc[category] = [];
                acc[category].push(feature);
                return acc;
              }, {} as Record<string, Feature[]>)
            ).map(([categoryName, categoryFeatures]) => {
              const avgCompletion = Math.round(
                categoryFeatures.reduce((sum, f) => sum + f.completion_percentage, 0) / categoryFeatures.length
              );
              
              return (
                <div key={categoryName} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{categoryName}</h4>
                    <p className="text-sm text-muted-foreground">Core platform functionality</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {categoryFeatures.length} features
                    </div>
                    <Badge 
                      className={`text-white ${
                        avgCompletion === 100 ? "bg-green-500" :
                        avgCompletion >= 75 ? "bg-blue-500" :
                        avgCompletion >= 50 ? "bg-yellow-500" :
                        avgCompletion >= 25 ? "bg-orange-500" : "bg-red-500"
                      }`}
                    >
                      {avgCompletion}% complete
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Project Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>
            {getTotalActualHours()} of {getTotalEstimatedHours()} estimated hours completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500 mb-2">
                <CheckCircle2 className="h-6 w-6 inline mr-2" />
                Zero Deadends
              </div>
              <p className="text-sm text-muted-foreground">No blocked items</p>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-medium text-muted-foreground mb-1">Total Features</div>
              <div className="text-3xl font-bold">{features.length}</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-medium text-muted-foreground mb-1">Completed</div>
              <div className="text-3xl font-bold text-green-500">{getCompletedTasks()}</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-medium text-muted-foreground mb-1">In Progress</div>
              <div className="text-3xl font-bold text-blue-500">{getInProgressTasks()}</div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Features Completed</span>
                <span>{calculateOverallProgress()}%</span>
              </div>
              <Progress value={calculateOverallProgress()} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Hours Completed</span>
                <span>{getHoursProgress()}%</span>
              </div>
              <Progress value={getHoursProgress()} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}