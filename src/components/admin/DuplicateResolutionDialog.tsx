import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Check, X, Edit3 } from 'lucide-react';

interface DuplicateProduct {
  import_item: any;
  existing_product?: any;
  duplicate_type: 'exact' | 'similar' | 'none';
  similarity_score?: number;
}

interface DuplicateResolution {
  duplicate: DuplicateProduct;
  action: 'skip' | 'publish' | 'update' | 'rename';
  new_name?: string;
}

interface DuplicateResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateProduct[];
  onResolve: (resolutions: DuplicateResolution[]) => Promise<void>;
}

export const DuplicateResolutionDialog: React.FC<DuplicateResolutionDialogProps> = ({
  open,
  onOpenChange,
  duplicates,
  onResolve,
}) => {
  const [resolutions, setResolutions] = useState<DuplicateResolution[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    // Initialize resolutions when duplicates change
    setResolutions(
      duplicates.map(duplicate => ({
        duplicate,
        action: 'skip', // Default action
      }))
    );
  }, [duplicates]);

  const updateResolution = (index: number, action: DuplicateResolution['action'], newName?: string) => {
    setResolutions(prev => prev.map((res, i) => 
      i === index 
        ? { ...res, action, new_name: newName }
        : res
    ));
  };

  const handleResolve = async () => {
    setIsProcessing(true);
    try {
      await onResolve(resolutions);
    } catch (error) {
      console.error('Error resolving duplicates:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'skip':
        return <Badge variant="secondary"><X className="h-3 w-3 mr-1" />Skip</Badge>;
      case 'publish':
        return <Badge variant="default" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Publish Anyway</Badge>;
      case 'update':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700"><Edit3 className="h-3 w-3 mr-1" />Update Existing</Badge>;
      case 'rename':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Edit3 className="h-3 w-3 mr-1" />Rename & Publish</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDuplicateTypeBadge = (type: string, score?: number) => {
    switch (type) {
      case 'exact':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Exact Match</Badge>;
      case 'similar':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Similar ({score?.toFixed(0)}%)
          </Badge>
        );
      default:
        return <Badge variant="outline">No Match</Badge>;
    }
  };

  const publishCount = resolutions.filter(r => r.action === 'publish' || r.action === 'update' || r.action === 'rename').length;
  const skipCount = resolutions.filter(r => r.action === 'skip').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Duplicate Products Detected
          </DialogTitle>
          <DialogDescription>
            We found {duplicates.length} potential duplicate products. Please choose how to handle each one.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Import Item</TableHead>
                <TableHead>Existing Product</TableHead>
                <TableHead>Duplicate Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>New Name (if renaming)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duplicates.map((duplicate, index) => (
                <TableRow key={duplicate.import_item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{duplicate.import_item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${duplicate.import_item.price?.toFixed(2)} • {duplicate.import_item.category_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {duplicate.existing_product ? (
                      <div>
                        <div className="font-medium">{duplicate.existing_product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ${duplicate.existing_product.price?.toFixed(2)} • {duplicate.existing_product.category_id}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No existing product</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getDuplicateTypeBadge(duplicate.duplicate_type, duplicate.similarity_score)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={resolutions[index]?.action || 'skip'}
                      onValueChange={(value: DuplicateResolution['action']) => updateResolution(index, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip</SelectItem>
                        <SelectItem value="publish">Publish Anyway</SelectItem>
                        {duplicate.existing_product && (
                          <SelectItem value="update">Update Existing</SelectItem>
                        )}
                        <SelectItem value="rename">Rename & Publish</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {resolutions[index]?.action === 'rename' && (
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        placeholder="Enter new name"
                        value={resolutions[index]?.new_name || ''}
                        onChange={(e) => updateResolution(index, 'rename', e.target.value)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex-col gap-4">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Will publish: {publishCount} products</span>
            <span>Will skip: {skipCount} products</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Resolve Duplicates'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};