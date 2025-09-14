import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Download, Trash2, Search, Calendar, Tag, Filter } from 'lucide-react';
import { useSavedWorkflows, SavedWorkflow } from '@/hooks/useSavedWorkflows';
import { formatDistanceToNow } from 'date-fns';

export default function WorkflowDocumentation() {
  const { workflows, loading, deleteWorkflow } = useSavedWorkflows();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'order_count'>('created_at');

  // Get all unique tags
  const allTags = Array.from(
    new Set(workflows.flatMap(w => w.tags))
  ).filter(Boolean);

  // Filter and sort workflows
  const filteredWorkflows = workflows
    .filter(workflow => {
      const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !selectedTag || workflow.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'order_count':
          return b.order_count - a.order_count;
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const exportWorkflowData = (workflow: SavedWorkflow) => {
    const exportData = {
      ...workflow,
      exported_at: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}-workflow.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderWorkflowCard = (workflow: SavedWorkflow) => (
    <Card key={workflow.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {workflow.name}
              {workflow.is_template && <Badge variant="outline">Template</Badge>}
            </CardTitle>
            {workflow.description && (
              <p className="text-sm text-muted-foreground mt-2">{workflow.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportWorkflowData(workflow)}
            >
              <Download className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{workflow.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteWorkflow(workflow.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {workflow.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Orders:</span>
              <div className="text-muted-foreground">{workflow.order_count}</div>
            </div>
            <div>
              <span className="font-medium">Phases:</span>
              <div className="text-muted-foreground">
                {Object.keys(workflow.phase_distribution).length}
              </div>
            </div>
            <div>
              <span className="font-medium">Created:</span>
              <div className="text-muted-foreground">
                {formatDistanceToNow(new Date(workflow.created_at), { addSuffix: true })}
              </div>
            </div>
            <div>
              <span className="font-medium">Updated:</span>
              <div className="text-muted-foreground">
                {formatDistanceToNow(new Date(workflow.updated_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          {workflow.metadata && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <strong>Metadata:</strong> {JSON.stringify(workflow.metadata, null, 2)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workflow Documentation</h1>
        <p className="text-muted-foreground">
          Archive and manage your saved workflow visualizations and templates.
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'created_at' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('created_at')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Date
            </Button>
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('name')}
            >
              Name
            </Button>
            <Button
              variant={sortBy === 'order_count' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('order_count')}
            >
              Orders
            </Button>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTag(null)}
            >
              <Filter className="w-4 h-4 mr-1" />
              All
            </Button>
            {allTags.map(tag => (
              <Button
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(tag)}
              >
                <Tag className="w-4 h-4 mr-1" />
                {tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Workflows ({workflows.length})</TabsTrigger>
          <TabsTrigger value="templates">
            Templates ({workflows.filter(w => w.is_template).length})
          </TabsTrigger>
          <TabsTrigger value="recent">
            Recent ({workflows.filter(w => 
              new Date(w.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <div className="text-center py-8">Loading workflows...</div>
          ) : filteredWorkflows.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedTag 
                    ? "Try adjusting your search criteria"
                    : "Save your first workflow visualization from the Order Workflow Dashboard"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map(renderWorkflowCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-4">
            {filteredWorkflows
              .filter(w => w.is_template)
              .map(renderWorkflowCard)}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="space-y-4">
            {filteredWorkflows
              .filter(w => new Date(w.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
              .map(renderWorkflowCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}