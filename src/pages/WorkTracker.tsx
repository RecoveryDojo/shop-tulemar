import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop/ShopLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckCircle2, Clock, AlertCircle, Target, Users, Calendar, TrendingUp, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateProjectDialog } from "@/components/work-tracker/CreateProjectDialog";
import { TaskKanbanBoard } from "@/components/work-tracker/TaskKanbanBoard";
import { ProjectAnalytics } from "@/components/work-tracker/ProjectAnalytics";
import { GanttChart } from "@/components/work-tracker/GanttChart";
import { TimeTracker } from "@/components/work-tracker/TimeTracker";
import { WorkTrackerHeader } from "@/components/work-tracker/WorkTrackerHeader";
import { FeatureTracking } from "@/components/work-tracker/FeatureTracking";
import { DocumentationManager } from "@/components/work-tracker/DocumentationManager";
import { AutomatedWorkTracker } from "@/components/work-tracker/AutomatedWorkTracker";
import { DailyWorkSummary } from "@/components/work-tracker/DailyWorkSummary";
import { WorkHistoryBackfill } from "@/components/work-tracker/WorkHistoryBackfill";
import { WorkItemBrowser } from "@/components/work-tracker/WorkItemBrowser";
import { AutomatedDailyTracker } from "@/components/work-tracker/AutomatedDailyTracker";

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

function WorkTrackerContent() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [activeView, setActiveView] = useState("overview");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject.id);
    }
  }, [selectedProject]);

  // Realtime updates for features and tasks in the selected project
  useEffect(() => {
    if (!selectedProject) return;
    console.log('[Realtime] Subscribing to project changes', selectedProject.id);

    const channel = supabase
      .channel(`work-tracker-${selectedProject.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'features', filter: `project_id=eq.${selectedProject.id}` },
        () => {
          console.log('[Realtime] features changed');
          loadProjectData(selectedProject.id);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${selectedProject.id}` },
        () => {
          console.log('[Realtime] tasks changed');
          loadProjectData(selectedProject.id);
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime] Unsubscribing channel');
      supabase.removeChannel(channel);
    };
  }, [selectedProject]);
  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
      
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async (projectId: string) => {
    try {
      const [featuresData, tasksData] = await Promise.all([
        supabase.from("features").select("*").eq("project_id", projectId),
        supabase.from("tasks").select("*").eq("project_id", projectId)
      ]);

      if (featuresData.error) throw featuresData.error;
      if (tasksData.error) throw tasksData.error;

      setFeatures(featuresData.data || []);
      setTasks(tasksData.data || []);
    } catch (error) {
      console.error("Error loading project data:", error);
    }
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

  if (loading) {
    return (
      <ShopLayout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Work Tracker</h1>
            <p className="text-muted-foreground mt-2">
              Project management for development tracking
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/feature-showcase")}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Feature Showcase
            </Button>
            <Button onClick={() => setShowCreateProject(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {projects.map((project) => (
              <Button
                key={project.id}
                variant={selectedProject?.id === project.id ? "default" : "outline"}
                onClick={() => setSelectedProject(project)}
                className="whitespace-nowrap"
              >
                {project.name}
              </Button>
            ))}
          </div>
        )}

        {selectedProject ? (
          <>
            <WorkTrackerHeader 
              project={selectedProject}
              features={features}
              tasks={tasks}
              onBackToHome={() => window.location.href = "/"}
            />

            {/* Navigation Tabs */}
            <Tabs value={activeView} onValueChange={setActiveView}>
              <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
                <TabsTrigger value="overview" className="gap-2">
                  <Target className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="browser" className="gap-2">
                  <Target className="h-4 w-4" />
                  All Work
                </TabsTrigger>
                <TabsTrigger value="features" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Features
                </TabsTrigger>
                <TabsTrigger value="kanban" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="gantt" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="time" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Time
                </TabsTrigger>
                <TabsTrigger value="docs" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Documentation
                </TabsTrigger>
                <TabsTrigger value="automation" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Automation
                </TabsTrigger>
                <TabsTrigger value="daily" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Daily
                </TabsTrigger>
                <TabsTrigger value="auto-tracker" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Auto-Tracker
                </TabsTrigger>
                <TabsTrigger value="backfill" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Backfill
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Real Projects Summary */}
                <div className="grid gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Your Active Projects</h3>
                    <Badge variant="outline">{projects.length} Projects Total</Badge>
                  </div>
                  
                  {projects.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {projects.map((project) => {
                        const projectFeatures = features.filter(f => f.project_id === project.id);
                        const projectTasks = tasks.filter(t => t.project_id === project.id);
                        const completedTasks = projectTasks.filter(t => t.status === "done").length;
                        const avgProgress = projectFeatures.length > 0 ? 
                          Math.round(projectFeatures.reduce((sum, f) => sum + f.completion_percentage, 0) / projectFeatures.length) : 0;
                        
                        return (
                          <Card key={project.id} className={selectedProject?.id === project.id ? "ring-2 ring-primary" : ""}>
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
                                <Progress value={avgProgress} className="mb-2" />
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="text-center">
                                    <div className="font-bold text-blue-600">{projectFeatures.length}</div>
                                    <div className="text-muted-foreground">Features</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold text-green-600">{completedTasks}</div>
                                    <div className="text-muted-foreground">Tasks Done</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold text-purple-600">{avgProgress}%</div>
                                    <div className="text-muted-foreground">Complete</div>
                                  </div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Total Tasks: {projectTasks.length}</span>
                                  <span>
                                    {projectFeatures.reduce((sum, f) => sum + (f.actual_hours || 0), 0).toFixed(1)}h logged
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <p className="text-muted-foreground">No projects found</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Current Project Features Overview */}
                {selectedProject && features.length > 0 && (
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Features in {selectedProject.name}</h3>
                      <Badge variant="outline">{features.length} Features</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {features.slice(0, 6).map((feature) => (
                        <Card key={feature.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-sm">{feature.name}</CardTitle>
                              <Badge className={`${getPriorityColor(feature.priority)} text-white text-xs`}>
                                {feature.priority}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
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
                              <span>{feature.actual_hours}h / {feature.estimated_hours}h</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {features.length > 6 && (
                      <div className="text-center">
                        <Button variant="outline" onClick={() => setActiveView("features")}>
                          View All {features.length} Features
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="features">
                <FeatureTracking 
                  projectId={selectedProject.id}
                  features={features}
                  tasks={tasks}
                  onUpdate={() => loadProjectData(selectedProject.id)}
                />
              </TabsContent>

              <TabsContent value="kanban">
                <TaskKanbanBoard 
                  tasks={tasks} 
                  onTaskUpdate={() => loadProjectData(selectedProject.id)}
                />
              </TabsContent>

              <TabsContent value="gantt">
                <GanttChart tasks={tasks} features={features} />
              </TabsContent>

              <TabsContent value="analytics">
                <ProjectAnalytics 
                  project={selectedProject}
                  features={features}
                  tasks={tasks}
                />
              </TabsContent>

              <TabsContent value="time">
                <TimeTracker 
                  projectId={selectedProject.id}
                  tasks={tasks}
                />
              </TabsContent>

              <TabsContent value="docs">
                <DocumentationManager 
                  projectId={selectedProject.id}
                />
              </TabsContent>

              <TabsContent value="automation">
                <AutomatedWorkTracker 
                  projects={projects}
                  selectedProject={selectedProject}
                />
              </TabsContent>

              <TabsContent value="daily">
                <DailyWorkSummary />
              </TabsContent>

              <TabsContent value="backfill">
                <WorkHistoryBackfill />
              </TabsContent>

              <TabsContent value="browser">
                <WorkItemBrowser />
              </TabsContent>

              <TabsContent value="auto-tracker">
                <AutomatedDailyTracker />
              </TabsContent>

            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Create your first project to start tracking development progress
              </p>
              <Button onClick={() => setShowCreateProject(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        )}

        <CreateProjectDialog
          open={showCreateProject}
          onOpenChange={setShowCreateProject}
          onProjectCreated={loadProjects}
        />
      </div>
    </ShopLayout>
  );
}

export default function WorkTracker() {
  return (
    <ProtectedRoute requireAuth={true}>
      <WorkTrackerContent />
    </ProtectedRoute>
  );
}