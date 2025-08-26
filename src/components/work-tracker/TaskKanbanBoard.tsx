import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Clock, AlertCircle } from "lucide-react";
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

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
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
                    <Badge 
                      className={`${getPriorityColor(task.priority)} text-white text-xs ml-2`}
                    >
                      {task.priority}
                    </Badge>
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
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{task.actual_hours}h / {task.estimated_hours}h</span>
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
  );
}