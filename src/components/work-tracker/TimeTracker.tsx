import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Clock, Plus, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  status: string;
  estimated_hours: number;
  actual_hours: number;
}

interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  description: string;
  hours: number;
  date: string;
  created_at: string;
}

interface TimeTrackerProps {
  projectId: string;
  tasks: Task[];
}

export function TimeTracker({ projectId, tasks }: TimeTrackerProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState("");
  const [manualHours, setManualHours] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTimeEntries();
  }, [projectId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  // Realtime updates for time entries and task hour changes
  useEffect(() => {
    console.log('[Realtime] Subscribing to time entry changes for project', projectId);
    const channel = supabase
      .channel(`time-entries-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_entries' },
        (payload) => {
          try {
            const changedTaskId = (payload.new as any)?.task_id || (payload.old as any)?.task_id;
            const taskIds = tasks.map(t => t.id);
            if (!changedTaskId || !taskIds.includes(changedTaskId)) return;
            console.log('[Realtime] time_entries changed for task', changedTaskId, payload.eventType);
            loadTimeEntries();
          } catch (e) {
            console.log('[Realtime] error handling time_entries change', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          const changedTaskId = (payload.new as any)?.id || (payload.old as any)?.id;
          const taskIds = tasks.map(t => t.id);
          if (!changedTaskId || !taskIds.includes(changedTaskId)) return;
          console.log('[Realtime] tasks changed; reloading time entries');
          loadTimeEntries();
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime] Unsubscribing time entry channel');
      supabase.removeChannel(channel);
    };
  }, [projectId, tasks]);
  const loadTimeEntries = async () => {
    try {
      const taskIds = tasks.map(task => task.id);
      if (taskIds.length === 0) return;

      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .in("task_id", taskIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error("Error loading time entries:", error);
    }
  };

  const startTimer = () => {
    if (!selectedTask) {
      toast({
        title: "Please select a task",
        description: "You need to select a task before starting the timer.",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(true);
    setStartTime(new Date());
    setElapsedTime(0);
  };

  const pauseTimer = () => {
    setIsTracking(false);
  };

  const stopTimer = async () => {
    if (!startTime || !selectedTask) return;

    const hours = elapsedTime / (1000 * 60 * 60);
    await logTime(selectedTask, hours, description);
    
    setIsTracking(false);
    setStartTime(null);
    setElapsedTime(0);
    setDescription("");
  };

  const logTime = async (taskId: string, hours: number, desc: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("time_entries")
        .insert([{
          task_id: taskId,
          user_id: "00000000-0000-0000-0000-000000000000", // Default user for demo
          description: desc,
          hours: Number(hours.toFixed(2)),
          date: new Date().toISOString().split('T')[0],
        }]);

      if (error) throw error;

      // Update task actual hours
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const newActualHours = task.actual_hours + Number(hours.toFixed(2));
        await supabase
          .from("tasks")
          .update({ actual_hours: newActualHours })
          .eq("id", taskId);
      }

      toast({
        title: "Time logged successfully",
        description: `${hours.toFixed(2)} hours logged for the task.`,
      });

      loadTimeEntries();
    } catch (error) {
      console.error("Error logging time:", error);
      toast({
        title: "Error logging time",
        description: "There was an error logging your time entry.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addManualEntry = async () => {
    if (!selectedTask || !manualHours) {
      toast({
        title: "Missing information",
        description: "Please select a task and enter hours.",
        variant: "destructive",
      });
      return;
    }

    await logTime(selectedTask, parseFloat(manualHours), manualDescription);
    setManualHours("");
    setManualDescription("");
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalHoursForTask = (taskId: string) => {
    return timeEntries
      .filter(entry => entry.task_id === taskId)
      .reduce((total, entry) => total + entry.hours, 0);
  };

  const getTotalProjectHours = () => {
    return timeEntries.reduce((total, entry) => total + entry.hours, 0);
  };

  const updateTaskHours = async (taskId: string, newHours: number) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ actual_hours: newHours })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Hours updated",
        description: "Task hours have been updated successfully.",
      });

      // Refresh data to reflect changes
      loadTimeEntries();
    } catch (error) {
      console.error("Error updating hours:", error);
      toast({
        title: "Error updating hours",
        description: "There was an error updating the task hours.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracker
          </CardTitle>
          <CardDescription>
            Track time spent on tasks in real-time or add manual entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-select">Select Task</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a task to track time" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                disabled={!selectedTask}
              />
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center py-6">
            <div className="text-4xl font-mono font-bold mb-4">
              {formatTime(elapsedTime)}
            </div>
            <div className="flex justify-center gap-2">
              {!isTracking ? (
                <Button onClick={startTimer} disabled={!selectedTask} className="gap-2">
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              ) : (
                <>
                  <Button onClick={pauseTimer} variant="outline" className="gap-2">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button onClick={stopTimer} variant="destructive" className="gap-2">
                    <Square className="h-4 w-4" />
                    Stop & Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Time Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Add Manual Time Entry</CardTitle>
          <CardDescription>
            Manually log time for tasks completed offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manual-hours">Hours</Label>
              <Input
                id="manual-hours"
                type="number"
                step="0.25"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
                placeholder="2.5"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="manual-description">Description</Label>
              <Input
                id="manual-description"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Description of work completed"
              />
            </div>
          </div>
          <Button 
            onClick={addManualEntry} 
            disabled={loading || !selectedTask || !manualHours}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </CardContent>
      </Card>

      {/* Time Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Time Summary</CardTitle>
          <CardDescription>
            Total time logged: {getTotalProjectHours().toFixed(2)} hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => {
              const loggedHours = getTotalHoursForTask(task.id);
              const progressPercentage = task.estimated_hours > 0 
                ? Math.min((task.actual_hours / task.estimated_hours) * 100, 100)
                : 0;

              return (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge variant="outline" className="mt-1">
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="font-medium">
                          {task.actual_hours.toFixed(1)}h / {task.estimated_hours}h
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {progressPercentage.toFixed(0)}% of estimate
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newHours = prompt(`Enter new actual hours for "${task.title}":`, task.actual_hours.toString());
                          if (newHours && !isNaN(parseFloat(newHours))) {
                            updateTaskHours(task.id, parseFloat(newHours));
                          }
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progressPercentage > 100 ? "bg-red-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                  {progressPercentage > 100 && (
                    <p className="text-sm text-red-500 mt-1">
                      Over estimate by {(progressPercentage - 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
          <CardDescription>Last 10 time entries for this project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timeEntries.slice(0, 10).map((entry) => {
              const task = tasks.find(t => t.id === entry.task_id);
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{task?.title || "Unknown Task"}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.description || "No description"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{entry.hours.toFixed(2)}h</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {timeEntries.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No time entries yet. Start tracking time to see entries here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}