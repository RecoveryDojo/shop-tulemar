import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Play, Square, Activity, Target, TrendingUp, FileText } from 'lucide-react';
import { useAutomatedWorkTracker } from '@/hooks/useAutomatedWorkTracker';
import { format } from 'date-fns';

interface AutomatedWorkTrackerProps {
  projects: any[];
  selectedProject?: any;
}

export const AutomatedWorkTracker: React.FC<AutomatedWorkTrackerProps> = ({
  projects,
  selectedProject,
}) => {
  const {
    currentSession,
    isTracking,
    dailySummary,
    workSessions,
    startSession,
    endSession,
    logActivity,
    loadTodaysSummary,
  } = useAutomatedWorkTracker();

  const [sessionSummary, setSessionSummary] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState('development');

  useEffect(() => {
    loadTodaysSummary();
  }, [loadTodaysSummary]);

  const handleStartSession = async () => {
    await startSession(selectedProject?.id, selectedSessionType);
  };

  const handleEndSession = async () => {
    await endSession(sessionSummary);
    setSessionSummary('');
  };

  const getSessionDuration = (session: any) => {
    if (!session) return '0m';
    
    const start = new Date(session.start_time);
    const end = session.end_time ? new Date(session.end_time) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Current Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Work Session
          </CardTitle>
          <CardDescription>
            Track your current development work automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isTracking ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session Type</label>
                  <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="debugging">Debugging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <div className="p-2 border rounded-md bg-muted text-sm">
                    {selectedProject?.name || 'No project selected'}
                  </div>
                </div>
              </div>
              <Button onClick={handleStartSession} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Work Session
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">
                      <Activity className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {currentSession?.session_type}
                    </span>
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {getSessionDuration(currentSession)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Started at {currentSession ? format(new Date(currentSession.start_time), 'HH:mm') : ''}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Summary (optional)</label>
                <Textarea
                  placeholder="What did you work on in this session?"
                  value={sessionSummary}
                  onChange={(e) => setSessionSummary(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button onClick={handleEndSession} variant="destructive" className="w-full">
                <Square className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Summary */}
      {dailySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Today's Summary
            </CardTitle>
            <CardDescription>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {dailySummary.total_hours.toFixed(1)}h
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {dailySummary.session_count}
                </div>
                <div className="text-sm text-muted-foreground">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {dailySummary.tasks_completed}
                </div>
                <div className="text-sm text-muted-foreground">Tasks Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(dailySummary.productivity_score)}
                </div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Work Sessions
          </CardTitle>
          <CardDescription>
            Your latest work activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workSessions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No work sessions recorded yet.</p>
                <p className="text-sm">Start a session to begin tracking your work!</p>
              </div>
            ) : (
              workSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {session.session_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(session.start_time), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <div className="text-sm mt-1">
                      {session.activity_summary || 'No summary provided'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{getSessionDuration(session)}</div>
                    <div className="text-xs text-muted-foreground">
                      {session.end_time ? 'Completed' : 'Active'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};