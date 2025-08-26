import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, MoreHorizontal, Edit, Trash2, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface FeatureTrackingProps {
  projectId: string;
  features: Feature[];
  tasks: Task[];
  onUpdate: () => void;
}

export function FeatureTracking({ projectId, features, tasks, onUpdate }: FeatureTrackingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [filteredFeatures, setFilteredFeatures] = useState<Feature[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    filterFeatures();
  }, [features, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  const filterFeatures = () => {
    let filtered = [...features];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(feature => 
        feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(feature => {
        if (statusFilter === "completed") return feature.completion_percentage === 100;
        if (statusFilter === "in_progress") return feature.completion_percentage > 0 && feature.completion_percentage < 100;
        if (statusFilter === "not_started") return feature.completion_percentage === 0;
        return true;
      });
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(feature => feature.priority === priorityFilter);
    }

    // Category filter (based on feature name patterns)
    if (categoryFilter !== "all") {
      filtered = filtered.filter(feature => {
        const category = getFeatureCategory(feature.name);
        return category === categoryFilter;
      });
    }

    setFilteredFeatures(filtered);
  };

  const getFeatureCategory = (featureName: string) => {
    if (featureName.includes("Guest") || featureName.includes("Shopping") || featureName.includes("Catalog")) {
      return "Guest Experience";
    } else if (featureName.includes("Driver") || featureName.includes("Route") || featureName.includes("Mobile")) {
      return "Driver Dashboard";
    } else if (featureName.includes("Admin") || featureName.includes("Management") || featureName.includes("Analytics")) {
      return "Admin Portal";
    } else if (featureName.includes("Integration") || featureName.includes("API") || featureName.includes("WordPress")) {
      return "Integrations";
    } else if (featureName.includes("Architecture") || featureName.includes("Security") || featureName.includes("Performance")) {
      return "Technical Infrastructure";
    } else if (featureName.includes("Testing") || featureName.includes("Documentation")) {
      return "Quality Assurance";
    }
    return "Core Platform";
  };

  const getStatusBadge = (completion: number) => {
    if (completion === 100) {
      return <Badge className="bg-green-500 text-white">Completed</Badge>;
    } else if (completion > 0) {
      return <Badge className="bg-blue-500 text-white">In Progress</Badge>;
    } else {
      return <Badge className="bg-gray-500 text-white">Not Started</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-600 font-bold";
      case "high": return "text-orange-600 font-semibold";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const getFeatureTasks = (featureId: string) => {
    return tasks.filter(task => task.feature_id === featureId);
  };

  const getActionRequired = (feature: Feature) => {
    const featureTasks = getFeatureTasks(feature.id);
    const incompleteTasks = featureTasks.filter(task => task.status !== "done");
    
    if (feature.completion_percentage === 100) {
      return "Feature complete - monitor and maintain";
    } else if (feature.completion_percentage === 0) {
      return "Begin development - start with foundational tasks";
    } else {
      const nextTask = incompleteTasks.find(task => task.status === "in_progress") || 
                     incompleteTasks.find(task => task.status === "todo") ||
                     incompleteTasks[0];
      return nextTask ? `Continue with: ${nextTask.title}` : "Review progress and plan next steps";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
  };

  const categories = [...new Set(features.map(f => getFeatureCategory(f.name)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Feature Tracking</CardTitle>
          <CardDescription>
            Detailed breakdown of all Tulemar Instacart platform features
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
            <p className="text-sm text-muted-foreground">
              Showing {filteredFeatures.length} of {features.length} features
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Tracking Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">Build</TableHead>
                  <TableHead className="min-w-[200px]">Feature</TableHead>
                  <TableHead className="min-w-[150px]">Category</TableHead>
                  <TableHead className="min-w-[250px]">Description</TableHead>
                  <TableHead className="min-w-[200px]">Action Required</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-24">Priority</TableHead>
                  <TableHead className="w-24">Progress</TableHead>
                  <TableHead className="min-w-[200px]">Notes</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeatures.map((feature) => {
                  const category = getFeatureCategory(feature.name);
                  const featureTasks = getFeatureTasks(feature.id);
                  const completedTasks = featureTasks.filter(task => task.status === "done").length;
                  
                  return (
                    <TableRow key={feature.id} className="border-b hover:bg-muted/30">
                      <TableCell>
                        {feature.completion_percentage === 100 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : feature.completion_percentage > 0 ? (
                          <Clock className="h-4 w-4 text-blue-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{feature.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {feature.actual_hours}h / {feature.estimated_hours}h
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm max-w-[250px]">
                          {feature.description.length > 150 
                            ? `${feature.description.substring(0, 150)}...` 
                            : feature.description
                          }
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm max-w-[200px]">
                          {getActionRequired(feature)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(feature.completion_percentage)}
                      </TableCell>
                      
                      <TableCell>
                        <span className={`text-sm font-medium ${getPriorityColor(feature.priority)}`}>
                          {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs font-medium">{feature.completion_percentage}%</div>
                          <Progress value={feature.completion_percentage} className="h-2 w-16" />
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-xs text-muted-foreground max-w-[200px]">
                          {feature.completion_percentage === 100 && (
                            <span className="text-green-600 font-medium">
                              COMPLETED - {completedTasks}/{featureTasks.length} tasks finished. 
                              Core functionality implemented and tested.
                            </span>
                          )}
                          {feature.completion_percentage > 0 && feature.completion_percentage < 100 && (
                            <span className="text-blue-600">
                              IN PROGRESS - {completedTasks}/{featureTasks.length} tasks completed. 
                              {feature.actual_hours > feature.estimated_hours ? 
                                `Over estimate by ${((feature.actual_hours / feature.estimated_hours - 1) * 100).toFixed(0)}%.` :
                                `On track with ${((feature.actual_hours / feature.estimated_hours) * 100).toFixed(0)}% of estimated hours used.`
                              }
                            </span>
                          )}
                          {feature.completion_percentage === 0 && (
                            <span className="text-gray-600">
                              NOT STARTED - {featureTasks.length} tasks planned. 
                              Awaiting resource allocation and development start.
                            </span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredFeatures.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Features Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}