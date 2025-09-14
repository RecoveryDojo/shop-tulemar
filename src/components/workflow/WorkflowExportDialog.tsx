import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Save, FileImage, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSavedWorkflows } from '@/hooks/useSavedWorkflows';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface WorkflowExportDialogProps {
  workflowData: any;
  phaseDistribution: any;
  orderCount: number;
  elementId: string;
}

export const WorkflowExportDialog = ({ 
  workflowData, 
  phaseDistribution, 
  orderCount, 
  elementId 
}: WorkflowExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [exporting, setExporting] = useState(false);
  const { saveWorkflow } = useSavedWorkflows();
  const { toast } = useToast();

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const exportAsImage = async (format: 'png' | 'jpeg') => {
    setExporting(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Workflow element not found');
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `workflow-${Date.now()}.${format}`;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();

      toast({
        title: "Success",
        description: `Workflow exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const exportAsPDF = async () => {
    setExporting(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Workflow element not found');
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`workflow-${Date.now()}.pdf`);

      toast({
        title: "Success",
        description: "Workflow exported as PDF",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const exportAsJSON = () => {
    const exportData = {
      workflow_data: workflowData,
      phase_distribution: phaseDistribution,
      order_count: orderCount,
      exported_at: new Date().toISOString(),
      metadata: {
        export_type: 'json',
        version: '1.0',
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Workflow data exported as JSON",
    });
  };

  const saveWorkflowToDatabase = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the workflow",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveWorkflow({
        name: name.trim(),
        description: description.trim() || undefined,
        workflow_data: workflowData,
        visual_config: { elementId },
        order_count: orderCount,
        phase_distribution: phaseDistribution,
        metadata: {
          saved_at: new Date().toISOString(),
          export_capabilities: ['png', 'jpeg', 'pdf', 'json'],
        },
        tags,
      });

      setOpen(false);
      setName('');
      setDescription('');
      setTags([]);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Save className="w-4 h-4 mr-2" />
          Save & Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Save & Export Workflow</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Save to Database Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Save Workflow</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Jessica's Order Workflow"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of this workflow state..."
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={saveWorkflowToDatabase} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Workflow
            </Button>
          </div>

          <Separator />

          {/* Export Options Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Export Options</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => exportAsImage('png')}
                disabled={exporting}
              >
                <FileImage className="w-4 h-4 mr-2" />
                PNG Image
              </Button>
              <Button
                variant="outline"
                onClick={() => exportAsImage('jpeg')}
                disabled={exporting}
              >
                <FileImage className="w-4 h-4 mr-2" />
                JPEG Image
              </Button>
              <Button
                variant="outline"
                onClick={exportAsPDF}
                disabled={exporting}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF Document
              </Button>
              <Button
                variant="outline"
                onClick={exportAsJSON}
                disabled={exporting}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                JSON Data
              </Button>
            </div>
          </div>

          {/* Workflow Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current Workflow Summary</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Total Orders: {orderCount}</p>
              <p>Timestamp: {new Date().toLocaleString()}</p>
              <p>Phases: {Object.keys(phaseDistribution).length} workflow phases</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};