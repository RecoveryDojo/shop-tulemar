import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Target,
  BarChart3,
  Layers,
  FolderOpen,
  Calendar
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
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

export const WorkItemBrowser = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("overview");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [projectsRes, featuresRes, tasksRes] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("features").select("*").order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").order("created_at", { ascending: false })
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (featuresRes.error) throw featuresRes.error;
      if (tasksRes.error) throw tasksRes.error;

      setProjects(projectsRes.data || []);
      setFeatures(featuresRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    let filteredProjects = projects;
    let filteredFeatures = features;
    let filteredTasks = tasks;

    // Project filter
    if (projectFilter !== "all") {
      filteredFeatures = features.filter(f => f.project_id === projectFilter);
      filteredTasks = tasks.filter(t => t.project_id === projectFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "completed") {
        filteredFeatures = filteredFeatures.filter(f => f.completion_percentage === 100);
        filteredTasks = filteredTasks.filter(t => t.status === "done");
      } else if (statusFilter === "in_progress") {
        filteredFeatures = filteredFeatures.filter(f => f.completion_percentage > 0 && f.completion_percentage < 100);
        filteredTasks = filteredTasks.filter(t => t.status === "in_progress");
      } else if (statusFilter === "not_started") {
        filteredFeatures = filteredFeatures.filter(f => f.completion_percentage === 0);
        filteredTasks = filteredTasks.filter(t => t.status === "todo" || t.status === "backlog");
      }
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredProjects = filteredProjects.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term)
      );
      filteredFeatures = filteredFeatures.filter(f => 
        f.name.toLowerCase().includes(term) || 
        f.description.toLowerCase().includes(term)
      );
      filteredTasks = filteredTasks.filter(t => 
        t.title.toLowerCase().includes(term) || 
        t.description.toLowerCase().includes(term)
      );
    }

    return { filteredProjects, filteredFeatures, filteredTasks };
  };

  const getProjectStats = (projectId: string) => {
    const projectFeatures = features.filter(f => f.project_id === projectId);
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const completedFeatures = projectFeatures.filter(f => f.completion_percentage === 100);
    const completedTasks = projectTasks.filter(t => t.status === "done");
    const totalHours = projectFeatures.reduce((sum, f) => sum + (f.actual_hours || 0), 0);
    const avgProgress = projectFeatures.length > 0 ? 
      Math.round(projectFeatures.reduce((sum, f) => sum + f.completion_percentage, 0) / projectFeatures.length) : 0;

    return {
      totalFeatures: projectFeatures.length,
      completedFeatures: completedFeatures.length,
      totalTasks: projectTasks.length,
      completedTasks: completedTasks.length,
      totalHours,
      avgProgress
    };
  };

  const { filteredProjects, filteredFeatures, filteredTasks } = getFilteredData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Complete Work Portfolio
          </CardTitle>
          <CardDescription>
            Your comprehensive work history and current projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
              <p className="text-sm text-muted-foreground">Total Projects</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{features.length}</div>
              <p className="text-sm text-muted-foreground">Features Built</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{tasks.length}</div>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {features.reduce((sum, f) => sum + (f.actual_hours || 0), 0).toFixed(0)}h
              </div>
              <p className="text-sm text-muted-foreground">Hours Logged</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects, features, tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
              </SelectContent>
            </Select>

            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger>
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="features">Features</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Overview */}
      {(viewMode === "overview" || viewMode === "projects") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Projects ({filteredProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => {
                const stats = getProjectStats(project.id);
                return (
                  <Card key={project.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm">{project.name}</CardTitle>
                        <Badge className={`text-white text-xs ${
                          project.status === 'completed' ? 'bg-green-500' :
                          project.status === 'active' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}>
                          {project.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {project.description.length > 100 ? 
                          `${project.description.substring(0, 100)}...` : 
                          project.description
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Progress value={stats.avgProgress} className="mb-2" />
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="font-medium">Features: {stats.completedFeatures}/{stats.totalFeatures}</div>
                            <div className="font-medium">Tasks: {stats.completedTasks}/{stats.totalTasks}</div>
                          </div>
                          <div>
                            <div className="font-medium">Progress: {stats.avgProgress}%</div>
                            <div className="font-medium">Hours: {stats.totalHours.toFixed(1)}h</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Started: {new Date(project.start_date || project.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features View */}
      {(viewMode === "overview" || viewMode === "features") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Features ({filteredFeatures.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFeatures.slice(0, viewMode === "features" ? filteredFeatures.length : 9).map((feature) => {
                const project = projects.find(p => p.id === feature.project_id);
                return (
                  <Card key={feature.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm">{feature.name}</CardTitle>
                        <Badge className={`text-white text-xs ${
                          feature.priority === "critical" ? "bg-red-500" :
                          feature.priority === "high" ? "bg-orange-500" :
                          feature.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                        }`}>
                          {feature.priority}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {project?.name && (
                          <Badge variant="outline" className="text-xs mb-1">{project.name}</Badge>
                        )}
                        <br />
                        {feature.description.length > 80 ? 
                          `${feature.description.substring(0, 80)}...` : 
                          feature.description
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={feature.completion_percentage} className="mb-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{feature.completion_percentage}% complete</span>
                        <span>{feature.actual_hours || 0}h / {feature.estimated_hours || 0}h</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(feature.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {viewMode === "overview" && filteredFeatures.length > 9 && (
              <div className="text-center mt-4">
                <Button variant="outline" onClick={() => setViewMode("features")}>
                  View All {filteredFeatures.length} Features
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tasks View */}
      {(viewMode === "overview" || viewMode === "tasks") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tasks ({filteredTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTasks.slice(0, viewMode === "tasks" ? filteredTasks.length : 15).map((task) => {
                const project = projects.find(p => p.id === task.project_id);
                const feature = features.find(f => f.id === task.feature_id);
                
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {task.status === "done" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : task.status === "in_progress" ? (
                          <Clock className="h-4 w-4 text-blue-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="font-medium text-sm">{task.title}</span>
                        <Badge className={`text-white text-xs ${
                          task.status === "done" ? "bg-green-500" :
                          task.status === "in_progress" ? "bg-blue-500" :
                          task.status === "blocked" ? "bg-red-500" : "bg-gray-500"
                        }`}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {project?.name && <span className="font-medium">{project.name}</span>}
                        {feature?.name && <span> • {feature.name}</span>}
                        <span> • {task.actual_hours || 0}h / {task.estimated_hours || 0}h</span>
                      </div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.description.length > 100 ? 
                            `${task.description.substring(0, 100)}...` : 
                            task.description
                          }
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{new Date(task.created_at).toLocaleDateString()}</div>
                      {task.due_date && (
                        <div className={new Date(task.due_date) < new Date() && task.status !== "done" ? "text-red-500" : ""}>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {viewMode === "overview" && filteredTasks.length > 15 && (
              <div className="text-center mt-4">
                <Button variant="outline" onClick={() => setViewMode("tasks")}>
                  View All {filteredTasks.length} Tasks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {filteredProjects.length === 0 && filteredFeatures.length === 0 && filteredTasks.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Items Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};