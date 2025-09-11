import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Bug,
  Wrench,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Database,
  Workflow,
  Users,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp
} from 'lucide-react';

export interface DetailedError {
  id: string;
  type: 'auth_error' | 'order_error' | 'workflow_error' | 'api_error' | 'database_error' | 'system_error';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  botProfile?: string;
  timestamp: string;
  stackTrace?: string;
  context?: any;
  fixable: boolean;
  fixAttempts: number;
  lastFixAttempt?: string;
  fixStatus?: 'none' | 'attempting' | 'success' | 'failed';
}

interface ErrorManagementProps {
  errors: DetailedError[];
  onErrorFixed: (errorId: string) => void;
  onErrorRetry: (errorId: string) => void;
  onClearErrors: () => void;
}

export function ErrorManagement({ errors, onErrorFixed, onErrorRetry, onClearErrors }: ErrorManagementProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [fixingErrors, setFixingErrors] = useState<Set<string>>(new Set());

  const toggleErrorExpansion = (errorId: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedErrors(newExpanded);
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'auth_error': return <Users className="h-4 w-4" />;
      case 'order_error': return <ShoppingCart className="h-4 w-4" />;
      case 'workflow_error': return <Workflow className="h-4 w-4" />;
      case 'api_error': return <Bug className="h-4 w-4" />;
      case 'database_error': return <Database className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'secondary';
    }
  };

  const getFixStatusIcon = (status?: string) => {
    switch (status) {
      case 'attempting': return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'success': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed': return <XCircle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  const handleFixError = async (error: DetailedError) => {
    if (!error.fixable || fixingErrors.has(error.id)) return;

    setFixingErrors(prev => new Set(prev).add(error.id));
    
    try {
      const response = await supabase.functions.invoke('bot-testing-system', {
        body: { 
          action: 'fix_error',
          errorId: error.id,
          errorType: error.type,
          context: error.context
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`Fixed error: ${error.title}`);
      onErrorFixed(error.id);
    } catch (err: any) {
      console.error('Fix error failed:', err);
      toast.error(`Failed to fix error: ${err.message}`);
    } finally {
      setFixingErrors(prev => {
        const next = new Set(prev);
        next.delete(error.id);
        return next;
      });
    }
  };

  const handleRetryError = async (error: DetailedError) => {
    setFixingErrors(prev => new Set(prev).add(error.id));
    
    try {
      const response = await supabase.functions.invoke('bot-testing-system', {
        body: { 
          action: 'retry_operation',
          errorId: error.id,
          context: error.context
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`Retried operation for: ${error.title}`);
      onErrorRetry(error.id);
    } catch (err: any) {
      console.error('Retry failed:', err);
      toast.error(`Retry failed: ${err.message}`);
    } finally {
      setFixingErrors(prev => {
        const next = new Set(prev);
        next.delete(error.id);
        return next;
      });
    }
  };

  const errorStats = {
    total: errors.length,
    critical: errors.filter(e => e.severity === 'critical').length,
    fixable: errors.filter(e => e.fixable).length,
    fixed: errors.filter(e => e.fixStatus === 'success').length
  };

  if (errors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            No Errors Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">All bot operations completed successfully!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold text-red-500">{errorStats.total}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-orange-500">{errorStats.critical}</p>
              </div>
              <Bug className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-Fixable</p>
                <p className="text-2xl font-bold text-blue-500">{errorStats.fixable}</p>
              </div>
              <Wrench className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-500">
                  {errorStats.total > 0 ? Math.round((errorStats.fixed / errorStats.total) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Management Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Error Management ({errors.length} errors)
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedErrors(errors.length > expandedErrors.size ? new Set(errors.map(e => e.id)) : new Set())}
            >
              {errors.length > expandedErrors.size ? 'Expand All' : 'Collapse All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearErrors}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {errors.map((error) => (
                <Collapsible
                  key={error.id}
                  open={expandedErrors.has(error.id)}
                  onOpenChange={() => toggleErrorExpansion(error.id)}
                >
                  <Card className={`border-l-4 ${
                    error.severity === 'critical' ? 'border-l-red-500' : 
                    error.severity === 'warning' ? 'border-l-yellow-500' : 
                    'border-l-blue-500'
                  }`}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getErrorIcon(error.type)}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{error.title}</h4>
                                <Badge variant={getSeverityColor(error.severity)}>
                                  {error.severity}
                                </Badge>
                                {error.fixStatus && getFixStatusIcon(error.fixStatus)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {error.botProfile && `Bot: ${error.botProfile} • `}
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(error.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {expandedErrors.has(error.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Error Details */}
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-2">
                                <p className="font-medium">Error Message:</p>
                                <p className="text-sm font-mono bg-muted p-2 rounded">
                                  {error.message}
                                </p>
                              </div>
                            </AlertDescription>
                          </Alert>

                          {/* Context Information */}
                          {error.context && (
                            <div>
                              <p className="font-medium mb-2">Context:</p>
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(error.context, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Stack Trace */}
                          {error.stackTrace && (
                            <div>
                              <p className="font-medium mb-2">Stack Trace:</p>
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                                {error.stackTrace}
                              </pre>
                            </div>
                          )}

                          {/* Fix Attempts */}
                          {error.fixAttempts > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Wrench className="h-3 w-3" />
                              <span>Fix attempts: {error.fixAttempts}</span>
                              {error.lastFixAttempt && (
                                <span>• Last attempt: {new Date(error.lastFixAttempt).toLocaleTimeString()}</span>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            {error.fixable && (
                              <Button
                                size="sm"
                                onClick={() => handleFixError(error)}
                                disabled={fixingErrors.has(error.id)}
                                className="gap-2"
                              >
                                {fixingErrors.has(error.id) ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Wrench className="h-3 w-3" />
                                )}
                                Auto Fix
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryError(error)}
                              disabled={fixingErrors.has(error.id)}
                              className="gap-2"
                            >
                              {fixingErrors.has(error.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              Retry Operation
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}