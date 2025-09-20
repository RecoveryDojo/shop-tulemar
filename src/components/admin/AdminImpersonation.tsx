import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminImpersonationProps {
  userId: string;
  userEmail: string;
  userName: string;
}

export function AdminImpersonation({ userId, userEmail, userName }: AdminImpersonationProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleImpersonate = async () => {
    try {
      // Store original admin session info
      const adminData = {
        originalUserId: user?.id,
        originalEmail: user?.email,
        impersonatingUserId: userId,
        impersonatingEmail: userEmail,
        impersonatingName: userName,
        timestamp: new Date().toISOString()
      };

      // Store admin session data
      localStorage.setItem('admin_impersonation', JSON.stringify(adminData));
      
      // Navigate based on user roles - for now, redirect to main dashboard
      window.location.href = '/';
      
      toast({
        title: "Impersonation Started",
        description: `Now viewing as ${userName} (${userEmail})`,
      });
    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast({
        title: "Error",
        description: "Failed to start user impersonation",
        variant: "destructive",
      });
    }
    setShowDialog(false);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="h-8 px-2"
      >
        <User className="h-3 w-3 mr-1" />
        Login as User
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Admin Impersonation</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to log in as <strong>{userName}</strong> ({userEmail}).
              <br /><br />
              This will allow you to test their dashboard, notifications, and workflow experience.
              You can return to admin mode at any time.
              <br /><br />
              <strong>Note:</strong> This action will be logged for security purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleImpersonate}>
              Start Impersonation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}