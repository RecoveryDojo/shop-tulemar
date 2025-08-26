import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Clock, AlertCircle, Edit, Trash2, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: () => void;
}

const statusColumns = [
  { id: "backlog", title: "Backlog", color: "bg-gray-100" },
  { id: "todo", title: "To Do", color: "bg-blue-100" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-100" },
  { id: "review", title: "Review", color: "bg-purple-100" },
  { id: "testing", title: "Testing", color: "bg-orange-100" },
  { id: "done", title: "Done", color: "bg-green-100" },
  { id: "blocked", title: "Blocked", color: "bg-red-100" },
];

export function TaskKanbanBoard({ tasks, onTaskUpdate }: TaskKanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [trackingTime, setTrackingTime] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus as "backlog" | "todo" | "in_progress" | "review" | "testing" | "done" | "blocked" })
        .eq("id", draggedTask.id);

      if (error) throw error;

      toast({
        title: "Task updated",
        description: `Task moved to ${newStatus.replace("_", " ")}`,
      });

      onTaskUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error updating task",
        description: "There was an error updating the task status.",
        variant: "destructive",
      });
    } finally {
      setDraggedTask(null);
    }
  };

  const handleEditTask = async (updatedTask: Partial<Task>) => {
    if (!editingTask) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority as "low" | "medium" | "high" | "critical",
          estimated_hours: updatedTask.estimated_hours,
          due_date: updatedTask.due_date,
        })
        .eq("id", editingTask.id);

      if (error) throw error;

      toast({
        title: "Task updated",
        description: "Task details have been updated successfully.",
      });

      setIsEditDialogOpen(false);
      setEditingTask(null);
      onTaskUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error updating task",
        description: "There was an error updating the task.",
        variant: "destructive",
      });
    }
  };

  const handleTimeTracking = async (taskId: string, isStart: boolean) => {
    if (isStart) {
      setTrackingTime(taskId);
      setStartTime(new Date());
      toast({
        title: "Time tracking started",
        description: "Timer is now running for this task.",
      });
    } else {
      if (!startTime || !trackingTime) return;

      const elapsedHours = (Date.now() - startTime.getTime()) / (1000 * 60 * 60);
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        const newActualHours = task.actual_hours + elapsedHours;
        
        try {
          const { error } = await supabase
            .from("tasks")
            .update({ actual_hours: newActualHours })
            .eq("id", taskId);

          if (error) throw error;

          // Also add a time entry
          await supabase
            .from("time_entries")
            .insert({
              task_id: taskId,
              user_id: "00000000-0000-0000-0000-000000000000", // Default user for demo
              description: "Time tracked via Kanban board",
              hours: elapsedHours,
              date: new Date().toISOString().split('T')[0],
            });

          toast({
            title: "Time logged",
            description: `${elapsedHours.toFixed(2)} hours logged for this task.`,
          });

          onTaskUpdate();
        } catch (error) {
          console.error("Error updating time:", error);
          toast({
            title: "Error logging time",
            description: "There was an error logging the time.",
            variant: "destructive",
          });
        }
      }

      setTrackingTime(null);
      setStartTime(null);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 h-[calc(100vh-300px)] overflow-x-auto">
        {statusColumns.map((column) => (
          <div
            key={column.id}
            className={`${column.color} rounded-lg p-4 min-w-[280px]`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {getTasksByStatus(column.id).length}
                </Badge>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
              {getTasksByStatus(column.id).map((task) => (
                <Card
                  key={task.id}
                  className="cursor-move hover:shadow-md transition-shadow bg-white"
                  draggable
                  onDragStart={() => handleDragStart(task)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm leading-tight">{task.title}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge 
                          className={`${getPriorityColor(task.priority)} text-white text-xs`}
                        >
                          {task.priority}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={() => {
                            setEditingTask(task);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {task.description && (
                      <CardDescription className="text-xs leading-relaxed">
                        {task.description.length > 80 
                          ? `${task.description.substring(0, 80)}...` 
                          : task.description
                        }
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{task.actual_hours.toFixed(1)}h / {task.estimated_hours}h</span>
                        </div>
                        {task.due_date && (
                          <div className={`flex items-center gap-1 ${
                            isOverdue(task.due_date) ? "text-red-500" : ""
                          }`}>
                            {isOverdue(task.due_date) && <AlertCircle className="h-3 w-3" />}
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Time tracking buttons */}
                      <div className="flex items-center gap-1">
                        {trackingTime === task.id ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleTimeTracking(task.id, false)}
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Stop
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleTimeTracking(task.id, true)}
                            disabled={!!trackingTime}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getTasksByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No tasks in {column.title.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and tracking information.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <TaskEditForm
              task={editingTask}
              onSave={handleEditTask}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingTask(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface TaskEditFormProps {
  task: Task;
  onSave: (task: Partial<Task>) => void;
  onCancel: () => void;
}

function TaskEditForm({ task, onSave, onCancel }: TaskEditFormProps) {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    estimated_hours: task.estimated_hours.toString(),
    due_date: task.due_date || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      estimated_hours: parseFloat(formData.estimated_hours),
      due_date: formData.due_date,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="estimated_hours">Estimated Hours</Label>
          <Input
            id="estimated_hours"
            type="number"
            step="0.5"
            value={formData.estimated_hours}
            onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_date">Due Date</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  );
}