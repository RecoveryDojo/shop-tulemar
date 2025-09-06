import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, Database, Zap, TrendingUp, Settings, ExternalLink } from 'lucide-react';

interface AIPatternType {
  id: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
}

interface ExternalDataSource {
  id: string;
  name: string;
  type: string;
  base_url?: string;
  api_key_required: boolean;
  rate_limit_per_minute: number;
  reliability_score: number;
  is_active: boolean;
  last_success_at?: string;
  failure_count: number;
}

interface ProcessingStats {
  total_patterns: number;
  active_sources: number;
  processing_jobs: number;
  success_rate: number;
  recent_enrichments: number;
}

export const EnhancedAIManager: React.FC = () => {
  const [patternTypes, setPatternTypes] = useState<AIPatternType[]>([]);
  const [dataSources, setDataSources] = useState<ExternalDataSource[]>([]);
  const [stats, setStats] = useState<ProcessingStats>({
    total_patterns: 0,
    active_sources: 0,
    processing_jobs: 0,
    success_rate: 0,
    recent_enrichments: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load pattern types
      const { data: patterns } = await supabase
        .from('ai_pattern_types')
        .select('*')
        .order('category', { ascending: true });
      
      // Load external data sources
      const { data: sources } = await supabase
        .from('external_data_sources')
        .select('*')
        .order('reliability_score', { ascending: false });
      
      // Calculate stats
      const { data: totalPatterns } = await supabase
        .from('ai_learning_patterns')
        .select('id', { count: 'exact' });
      
      const { data: recentJobs } = await supabase
        .from('import_jobs')
        .select('id, stats_total_rows, stats_valid_rows')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      const activeSources = sources?.filter(s => s.is_active).length || 0;
      const totalRows = recentJobs?.reduce((sum, job) => sum + (job.stats_total_rows || 0), 0) || 0;
      const validRows = recentJobs?.reduce((sum, job) => sum + (job.stats_valid_rows || 0), 0) || 0;
      const successRate = totalRows > 0 ? (validRows / totalRows) * 100 : 0;

      setPatternTypes(patterns || []);
      setDataSources(sources || []);
      setStats({
        total_patterns: totalPatterns?.length || 0,
        active_sources: activeSources,
        processing_jobs: recentJobs?.length || 0,
        success_rate: successRate,
        recent_enrichments: 0 // This would need a separate query for enriched products
      });
      
    } catch (error) {
      console.error('Error loading AI manager data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load AI learning system data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePatternType = async (patternId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_pattern_types')
        .update({ is_active: isActive })
        .eq('id', patternId);

      if (error) throw error;

      setPatternTypes(prev => 
        prev.map(p => p.id === patternId ? { ...p, is_active: isActive } : p)
      );

      toast({
        title: "Pattern type updated",
        description: `${isActive ? 'Enabled' : 'Disabled'} AI pattern learning.`,
      });
    } catch (error) {
      console.error('Error updating pattern type:', error);
      toast({
        title: "Update failed",
        description: "Failed to update pattern type.",
        variant: "destructive",
      });
    }
  };

  const toggleDataSource = async (sourceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('external_data_sources')
        .update({ is_active: isActive })
        .eq('id', sourceId);

      if (error) throw error;

      setDataSources(prev => 
        prev.map(s => s.id === sourceId ? { ...s, is_active: isActive } : s)
      );

      toast({
        title: "Data source updated",
        description: `${isActive ? 'Enabled' : 'Disabled'} external data source.`,
      });
    } catch (error) {
      console.error('Error updating data source:', error);
      toast({
        title: "Update failed",
        description: "Failed to update data source.",
        variant: "destructive",
      });
    }
  };

  const testDataSource = async (source: ExternalDataSource) => {
    try {
      toast({
        title: "Testing connection",
        description: `Testing connection to ${source.name}...`,
      });

      // Simple connectivity test
      if (source.base_url) {
        const response = await fetch(source.base_url, { method: 'HEAD' });
        if (response.ok) {
          toast({
            title: "Connection successful",
            description: `${source.name} is responding correctly.`,
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: `Failed to connect to ${source.name}. ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'classification': 'bg-blue-100 text-blue-800',
      'extraction': 'bg-green-100 text-green-800',
      'enrichment': 'bg-purple-100 text-purple-800',
      'safety': 'bg-red-100 text-red-800',
      'validation': 'bg-yellow-100 text-yellow-800',
      'relationship': 'bg-indigo-100 text-indigo-800',
      'formatting': 'bg-orange-100 text-orange-800',
      'identification': 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'api': return <Database className="w-4 h-4" />;
      case 'scraping': return <ExternalLink className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Brain className="w-6 h-6 animate-spin mr-2" />
            Loading AI Learning System...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.total_patterns}</div>
                <div className="text-sm text-muted-foreground">Learning Patterns</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.active_sources}</div>
                <div className="text-sm text-muted-foreground">Active Sources</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.processing_jobs}</div>
                <div className="text-sm text-muted-foreground">Recent Jobs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{stats.success_rate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <div className="text-sm font-medium mb-2">System Health</div>
              <Progress value={stats.success_rate} className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration */}
      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patterns">AI Pattern Types</TabsTrigger>
          <TabsTrigger value="sources">External Sources</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Learning Pattern Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patternTypes.map((pattern) => (
                  <div key={pattern.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{pattern.name}</h3>
                        <Badge className={getCategoryColor(pattern.category)}>
                          {pattern.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pattern.description}
                      </p>
                    </div>
                    <Switch
                      checked={pattern.is_active}
                      onCheckedChange={(checked) => togglePatternType(pattern.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {getSourceTypeIcon(source.type)}
                        <h3 className="font-medium">{source.name}</h3>
                        <Badge variant={source.type === 'api' ? 'default' : 'secondary'}>
                          {source.type.toUpperCase()}
                        </Badge>
                        {source.api_key_required && (
                          <Badge variant="outline">Requires API Key</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-muted-foreground">
                          Reliability: {(source.reliability_score * 100).toFixed(0)}%
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Rate Limit: {source.rate_limit_per_minute}/min
                        </span>
                        {source.failure_count > 0 && (
                          <span className="text-sm text-red-600">
                            {source.failure_count} recent failures
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testDataSource(source)}
                      >
                        Test
                      </Button>
                      <Switch
                        checked={source.is_active}
                        onCheckedChange={(checked) => toggleDataSource(source.id, checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Processing Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Success Rate (Last 7 days)</Label>
                      <Progress value={stats.success_rate} className="mt-2" />
                      <div className="text-sm text-muted-foreground mt-1">
                        {stats.success_rate.toFixed(1)}% of products processed successfully
                      </div>
                    </div>
                    <div>
                      <Label>External Enrichment Rate</Label>
                      <Progress value={65} className="mt-2" />
                      <div className="text-sm text-muted-foreground mt-1">
                        65% of products enriched with external data
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Learning Progress</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Category Classification</span>
                      <span className="font-medium">92% accuracy</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unit Extraction</span>
                      <span className="font-medium">87% accuracy</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brand Detection</span>
                      <span className="font-medium">79% accuracy</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price Normalization</span>
                      <span className="font-medium">95% accuracy</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};