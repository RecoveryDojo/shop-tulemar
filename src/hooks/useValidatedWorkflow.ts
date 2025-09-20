import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ValidatedWorkflowError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface WorkflowValidationResult {
  success: boolean;
  requestId?: string;
  executionTime?: number;
  error?: ValidatedWorkflowError;
}

export const useValidatedWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<ValidatedWorkflowError | null>(null);
  const { toast } = useToast();

  const executeValidatedAction = async (
    action: string,
    orderId: string,
    itemId?: string,
    data?: any,
    expectedCurrentStatus?: string,
    skipValidation = false
  ): Promise<WorkflowValidationResult> => {
    setLoading(true);
    setLastError(null);

    try {
      console.log(`Executing validated workflow action: ${action}`);
      
      const { data: result, error } = await supabase.functions.invoke('validated-workflow', {
        body: { 
          action, 
          orderId, 
          itemId, 
          data,
          expectedCurrentStatus,
          skipValidation 
        }
      });

      if (error) {
        const workflowError: ValidatedWorkflowError = {
          code: error.code || 'WORKFLOW_ERROR',
          message: error.message || 'Unknown workflow error',
          details: error.details,
          retryable: error.retryable || false,
          severity: error.severity || 'medium'
        };
        
        setLastError(workflowError);
        
        // Show appropriate toast based on error severity
        const toastVariant = workflowError.severity === 'critical' || workflowError.severity === 'high' 
          ? 'destructive' 
          : 'default';
          
        toast({
          title: getErrorTitle(workflowError),
          description: workflowError.message,
          variant: toastVariant,
        });

        return { success: false, error: workflowError };
      }

      // Success toast
      toast({
        title: "Action Completed",
        description: result.message || 'Workflow action completed successfully',
      });

      console.log(`Workflow action ${action} completed successfully in ${result.executionTime}ms`);

      return { 
        success: true, 
        requestId: result.requestId,
        executionTime: result.executionTime 
      };

    } catch (error: any) {
      console.error(`Error executing validated workflow action ${action}:`, error);
      
      const workflowError: ValidatedWorkflowError = {
        code: 'UNEXPECTED_ERROR',
        message: error.message || 'An unexpected error occurred',
        retryable: false,
        severity: 'critical'
      };
      
      setLastError(workflowError);
      
      toast({
        title: "Unexpected Error",
        description: workflowError.message,
        variant: "destructive",
      });

      return { success: false, error: workflowError };
    } finally {
      setLoading(false);
    }
  };

  // Specific workflow action methods with validation
  const confirmOrder = async (orderId: string, currentStatus = 'pending') => {
    return executeValidatedAction('confirm_order', orderId, undefined, undefined, currentStatus);
  };

  const acceptOrder = async (orderId: string, currentStatus = 'confirmed') => {
    return executeValidatedAction('accept_order', orderId, undefined, undefined, currentStatus);
  };

  const startShopping = async (orderId: string, currentStatus = 'assigned') => {
    return executeValidatedAction('start_shopping', orderId, undefined, undefined, currentStatus);
  };

  const markItemFound = async (itemId: string, foundQuantity: number, notes?: string, photoUrl?: string) => {
    return executeValidatedAction('mark_item_found', '', itemId, { foundQuantity, notes, photoUrl });
  };

  const requestSubstitution = async (itemId: string, reason: string, suggestedProduct?: string, notes?: string) => {
    return executeValidatedAction('request_substitution', '', itemId, { reason, suggestedProduct, notes });
  };

  const completeShopping = async (orderId: string, currentStatus = 'shopping') => {
    return executeValidatedAction('complete_shopping', orderId, undefined, undefined, currentStatus);
  };

  const startDelivery = async (orderId: string, currentStatus = 'packed') => {
    return executeValidatedAction('start_delivery', orderId, undefined, undefined, currentStatus);
  };

  const completeDelivery = async (orderId: string, currentStatus = 'in_transit') => {
    return executeValidatedAction('complete_delivery', orderId, undefined, undefined, currentStatus);
  };

  const rollbackStatus = async (orderId: string, targetStatus: string, reason?: string) => {
    return executeValidatedAction('rollback_status', orderId, undefined, { targetStatus, reason });
  };

  // Batch operations with validation
  const executeBatch = async (actions: Array<{
    action: string;
    orderId: string;
    itemId?: string;
    data?: any;
    expectedCurrentStatus?: string;
  }>) => {
    const results = [];
    
    for (const actionConfig of actions) {
      const result = await executeValidatedAction(
        actionConfig.action,
        actionConfig.orderId,
        actionConfig.itemId,
        actionConfig.data,
        actionConfig.expectedCurrentStatus
      );
      
      results.push(result);
      
      // Stop batch execution if a critical error occurs
      if (!result.success && result.error?.severity === 'critical') {
        break;
      }
    }
    
    return results;
  };

  // Error recovery methods
  const retryLastAction = async () => {
    if (!lastError || !lastError.retryable) {
      toast({
        title: "Cannot Retry",
        description: "The last action cannot be retried automatically",
        variant: "destructive",
      });
      return { success: false };
    }

    // Note: In a production system, you'd need to store the last action parameters
    // This is a simplified implementation for demo purposes
    toast({
      title: "Retry Not Implemented",
      description: "Retry functionality requires storing last action parameters",
    });
    
    return { success: false };
  };

  const clearError = () => {
    setLastError(null);
  };

  // Validation helpers
  const validateTransition = async (orderId: string, fromStatus: string, toStatus: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_workflow_transition', {
        p_order_id: orderId,
        p_current_status: fromStatus,
        p_new_status: toStatus,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_action: 'validate_only'
      });

      if (error) {
        console.error('Validation error:', error);
        return { valid: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      console.error('Validation exception:', error);
      return { valid: false, error: error.message };
    }
  };

  const checkOrderIntegrity = async (orderId: string) => {
    try {
      const { data, error } = await supabase.rpc('check_workflow_integrity');
      
      if (error) {
        console.error('Integrity check error:', error);
        return { valid: false, issues: [] };
      }

      const orderIssues = data?.filter((issue: any) => issue.order_id === orderId) || [];
      
      return { 
        valid: orderIssues.length === 0, 
        issues: orderIssues 
      };
    } catch (error: any) {
      console.error('Integrity check exception:', error);
      return { valid: false, issues: [] };
    }
  };

  // Helper functions
  function getErrorTitle(error: ValidatedWorkflowError): string {
    switch (error.code) {
      case 'VALIDATION_FAILED':
        return 'Validation Error';
      case 'AUTHENTICATION_FAILED':
        return 'Authentication Required';
      case 'ACTION_EXECUTION_FAILED':
        return 'Execution Failed';
      case 'STATUS_CONFLICT':
        return 'Status Conflict';
      default:
        return 'Workflow Error';
    }
  }

  return {
    loading,
    lastError,
    
    // Basic workflow actions
    confirmOrder,
    acceptOrder,
    startShopping,
    markItemFound,
    requestSubstitution,
    completeShopping,
    startDelivery,
    completeDelivery,
    rollbackStatus,
    
    // Advanced operations
    executeBatch,
    executeValidatedAction,
    
    // Error handling
    retryLastAction,
    clearError,
    
    // Validation helpers
    validateTransition,
    checkOrderIntegrity
  };
};