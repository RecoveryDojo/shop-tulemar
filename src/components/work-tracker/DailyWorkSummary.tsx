import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, CheckCircle, FileText, TrendingUp, Edit3 } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  total_hours: number;
  session_count: number;
  tasks_completed: number;
  tasks_created: number;
  features_completed: number;
  documentation_created: number;
  productivity_score: number;
  highlights?: string[];
  blockers?: string[];
  notes?: string;
}

export const DailyWorkSummary: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [recentSummaries, setRecentSummaries] = useState<DailySummary[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [highlights, setHighlights] = useState('');
  const [blockers, setBlockers] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const loadDailySummary = async (date: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = date.toISOString().split('T')[0];
      
      const { data: summary } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .maybeSingle();

      setDailySummary(summary);
      
      if (summary) {
        setHighlights(summary.highlights?.join('\n') || '');
        setBlockers(summary.blockers?.join('\n') || '');
        setNotes(summary.notes || '');
      } else {
        setHighlights('');
        setBlockers('');
        setNotes('');
      }
    } catch (error) {
      console.error('Error loading daily summary:', error);
    }
  };

  const loadRecentSummaries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: summaries } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(7);

      setRecentSummaries(summaries || []);
    } catch (error) {
      console.error('Error loading recent summaries:', error);
    }
  };

  const saveSummaryNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = selectedDate.toISOString().split('T')[0];
      const highlightsArray = highlights.split('\n').filter(h => h.trim());
      const blockersArray = blockers.split('\n').filter(b => b.trim());

      if (dailySummary) {
        // Update existing summary
        const { error } = await supabase
          .from('daily_summaries')
          .update({
            highlights: highlightsArray,
            blockers: blockersArray,
            notes: notes,
          })
          .eq('id', dailySummary.id);

        if (error) throw error;
      } else {
        // Create new summary
        const { error } = await supabase
          .from('daily_summaries')
          .insert({
            user_id: user.id,
            date: dateStr,
            total_hours: 0,
            session_count: 0,
            tasks_completed: 0,
            tasks_created: 0,
            features_completed: 0,
            documentation_created: 0,
            productivity_score: 0,
            highlights: highlightsArray,
            blockers: blockersArray,
            notes: notes,
          });

        if (error) throw error;
      }

      setIsEditing(false);
      await loadDailySummary(selectedDate);
      await loadRecentSummaries();
      
      toast({
        title: "Summary saved",
        description: "Your daily work summary has been updated.",
      });
    } catch (error) {
      console.error('Error saving summary:', error);
      toast({
        title: "Error saving summary",
        description: "Failed to save your daily summary.",
        variant: "destructive",
      });
    }
  };

  const generateAutoSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('generate_daily_summary', {
        summary_date: dateStr,
        summary_user_id: user.id,
      });

      if (error) throw error;

      await loadDailySummary(selectedDate);
      await loadRecentSummaries();
      
      toast({
        title: "Summary generated",
        description: "Automatic daily summary has been created.",
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error generating summary",
        description: "Failed to generate automatic summary.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadDailySummary(selectedDate);
    loadRecentSummaries();
  }, [selectedDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subDays(selectedDate, 1)
      : addDays(selectedDate, 1);
    setSelectedDate(newDate);
  };

  const getProductivityColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Work Summary
              </CardTitle>
              <CardDescription>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                ←
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                →
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Daily Metrics */}
      {dailySummary ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Daily Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{dailySummary.total_hours.toFixed(1)}h</div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </div>
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{dailySummary.tasks_completed}</div>
                <div className="text-sm text-muted-foreground">Tasks Done</div>
              </div>
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{dailySummary.documentation_created}</div>
                <div className="text-sm text-muted-foreground">Docs Created</div>
              </div>
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className={`text-2xl font-bold ${getProductivityColor(dailySummary.productivity_score)}`}>
                  {Math.round(dailySummary.productivity_score)}/10
                </div>
                <div className="text-sm text-muted-foreground">Productivity</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No data for this date</p>
            <Button onClick={generateAutoSummary}>
              Generate Summary
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Daily Notes
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Highlights</label>
                <Textarea
                  placeholder="What went well today? (one per line)"
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Blockers</label>
                <Textarea
                  placeholder="What challenges did you face? (one per line)"
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Additional notes or thoughts..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={saveSummaryNotes} className="w-full">
                Save Notes
              </Button>
            </>
          ) : (
            <>
              {dailySummary?.highlights && dailySummary.highlights.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-green-700">Highlights</h4>
                  <ul className="space-y-1">
                    {dailySummary.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {dailySummary?.blockers && dailySummary.blockers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-700">Blockers</h4>
                  <ul className="space-y-1">
                    {dailySummary.blockers.map((blocker, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>{blocker}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {dailySummary?.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {dailySummary.notes}
                  </p>
                </div>
              )}
              
              {(!dailySummary?.highlights?.length && !dailySummary?.blockers?.length && !dailySummary?.notes) && (
                <div className="text-center text-muted-foreground py-4">
                  <p>No notes for this date. Click Edit to add some!</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your work summary for the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSummaries.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <p>No recent activity to display</p>
              </div>
            ) : (
              recentSummaries.map((summary) => (
                <div key={summary.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {format(new Date(summary.date), 'MMM d')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {summary.total_hours.toFixed(1)}h
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {summary.tasks_completed} tasks • {summary.session_count} sessions
                    </div>
                  </div>
                  <div className={`text-right font-medium ${getProductivityColor(summary.productivity_score)}`}>
                    {Math.round(summary.productivity_score)}/10
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