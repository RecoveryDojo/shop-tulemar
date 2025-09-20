import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';

interface ErrorDisplayProps {
  error: {
    message: string;
    code?: string;
    retryable?: boolean;
  } | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        Workflow Error
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-1 hover:bg-destructive/20"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>{error.message}</p>
          {error.code && (
            <p className="text-xs opacity-80">Error Code: {error.code}</p>
          )}
          {error.retryable && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2 border-destructive/50 hover:bg-destructive/20"
            >
              Try Again
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}