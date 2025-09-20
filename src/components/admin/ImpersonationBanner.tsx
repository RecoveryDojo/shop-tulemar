import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ImpersonationBanner() {
  const { toast } = useToast();
  
  // Check if we're in impersonation mode
  const impersonationData = localStorage.getItem('admin_impersonation');
  
  if (!impersonationData) {
    return null;
  }

  const data = JSON.parse(impersonationData);

  const handleReturnToAdmin = () => {
    localStorage.removeItem('admin_impersonation');
    window.location.href = '/admin';
    
    toast({
      title: "Returned to Admin",
      description: "Impersonation session ended",
    });
  };

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <div className="flex items-center justify-between w-full">
        <AlertDescription className="text-orange-800">
          <strong>Admin Impersonation Active:</strong> You are viewing as {data.impersonatingName} ({data.impersonatingEmail})
        </AlertDescription>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReturnToAdmin}
          className="ml-4 border-orange-200 text-orange-700 hover:bg-orange-100"
        >
          <LogOut className="h-3 w-3 mr-1" />
          Return to Admin
        </Button>
      </div>
    </Alert>
  );
}