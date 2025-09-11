import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Clock, 
  Target, 
  Zap, 
  Shield, 
  Users, 
  Cpu, 
  Palette,
  Code,
  Search,
  MessageSquare,
  FileText,
  Star
} from 'lucide-react';
import { MESSAGING_ENHANCEMENTS, workflowProgress } from '@/lib/messagingEnhancements';
import { formatDistanceToNow } from 'date-fns';

export function EnhancementTracker() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'ux': return <Users className="h-4 w-4" />;
      case 'features': return <Star className="h-4 w-4" />;
      case 'architecture': return <Code className="h-4 w-4" />;
      default: return <Cpu className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const categorizedTasks = MESSAGING_ENHANCEMENTS.tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, typeof MESSAGING_ENHANCEMENTS.tasks>);

  const completedTasks = MESSAGING_ENHANCEMENTS.tasks.filter(t => t.status === 'completed').length;
  const totalTasks = MESSAGING_ENHANCEMENTS.tasks.length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  const totalHours = MESSAGING_ENHANCEMENTS.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const completedHours = MESSAGING_ENHANCEMENTS.tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, task) => sum + task.estimatedHours, 0);

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {MESSAGING_ENHANCEMENTS.title}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {MESSAGING_ENHANCEMENTS.description}
              </p>
            </div>
            <Badge variant="default" className="bg-green-500">
              {MESSAGING_ENHANCEMENTS.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedHours}h</div>
              <div className="text-sm text-muted-foreground">Hours Invested</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(categorizedTasks).length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{MESSAGING_ENHANCEMENTS.metrics?.userExperienceScore}</div>
              <div className="text-sm text-muted-foreground">UX Score</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-green-600">✅ Performance Gain</div>
              <div className="text-muted-foreground">{MESSAGING_ENHANCEMENTS.metrics?.performanceGain}</div>
            </div>
            <div>
              <div className="font-medium text-blue-600">🔒 Security Enhancement</div>
              <div className="text-muted-foreground">{MESSAGING_ENHANCEMENTS.metrics?.securityImprovement}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Workflow Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowProgress.map((phase, index) => (
              <div key={phase.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(phase.status)}
                    <h4 className="font-medium">{phase.phase}</h4>
                    <Badge variant="outline" className="text-xs">
                      {phase.estimatedDuration}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{phase.description}</p>
                  {phase.improvement && (
                    <div className="text-xs bg-green-50 text-green-700 p-2 rounded border border-green-200">
                      <strong>✨ Enhancement:</strong> {phase.improvement}
                    </div>
                  )}
                  {phase.completedAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Completed {formatDistanceToNow(new Date(phase.completedAt), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Breakdown */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All ({totalTasks})</TabsTrigger>
          {Object.entries(categorizedTasks).map(([category, tasks]) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category} ({tasks.length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4">
            {MESSAGING_ENHANCEMENTS.tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      {getCategoryIcon(task.category)}
                      <h4 className="font-medium">{task.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getImpactColor(task.impact)} className="text-xs">
                        {task.impact}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.estimatedHours}h
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-200">
                    <strong>💡 Implementation:</strong> {task.improvement}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {Object.entries(categorizedTasks).map(([category, tasks]) => (
          <TabsContent key={category} value={category}>
            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <h4 className="font-medium">{task.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getImpactColor(task.impact)} className="text-xs">
                          {task.impact}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.estimatedHours}h
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-200">
                      <strong>💡 Implementation:</strong> {task.improvement}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}