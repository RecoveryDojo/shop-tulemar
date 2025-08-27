import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckCircle2, Clock, AlertCircle, Target, Users, Calendar, TrendingUp } from "lucide-react";
import { CreateProjectDialog } from "@/components/work-tracker/CreateProjectDialog";
import { TaskKanbanBoard } from "@/components/work-tracker/TaskKanbanBoard";
import { ProjectAnalytics } from "@/components/work-tracker/ProjectAnalytics";
import { GanttChart } from "@/components/work-tracker/GanttChart";
import { TimeTracker } from "@/components/work-tracker/TimeTracker";
import { WorkTrackerHeader } from "@/components/work-tracker/WorkTrackerHeader";
import { FeatureTracking } from "@/components/work-tracker/FeatureTracking";

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

export default function WorkTracker() {
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
          <Button onClick={() => setShowCreateProject(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
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
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview" className="gap-2">
                  <Target className="h-4 w-4" />
                  Overview
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
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Features Overview */}
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Features & Modules</h3>
                  {features.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {features.map((feature) => (
                        <Card key={feature.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-sm">{feature.name}</CardTitle>
                              <Badge className={`${getPriorityColor(feature.priority)} text-white text-xs`}>
                                {feature.priority}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
                              {feature.description}
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
                  ) : (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <p className="text-muted-foreground">No features created yet</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
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