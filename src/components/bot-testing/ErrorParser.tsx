import { DetailedError } from './ErrorManagement';

export function parseErrors(errorList: string[]): DetailedError[] {
  return errorList.map((errorMessage, index) => {
    const errorId = `error_${Date.now()}_${index}`;
    
    // Parse error type and details from message
    const parsed = analyzeErrorMessage(errorMessage);
    
    return {
      id: errorId,
      type: parsed.type,
      severity: parsed.severity,
      title: parsed.title,
      message: errorMessage,
      botProfile: parsed.botProfile,
      timestamp: new Date().toISOString(),
      stackTrace: parsed.stackTrace,
      context: parsed.context,
      fixable: parsed.fixable,
      fixAttempts: 0,
      fixStatus: 'none'
    };
  });
}

function analyzeErrorMessage(message: string) {
  const result = {
    type: 'system_error' as 'auth_error' | 'order_error' | 'workflow_error' | 'api_error' | 'database_error' | 'system_error',
    severity: 'warning' as 'critical' | 'warning' | 'info',
    title: 'Unknown Error',
    botProfile: undefined as string | undefined,
    stackTrace: undefined as string | undefined,
    context: {} as any,
    fixable: false
  };

  // Extract bot profile name
  const botMatch = message.match(/Bot ([\w\s&]+?):/);
  if (botMatch) {
    result.botProfile = botMatch[1];
  }

  // Failed to create user
  if (message.includes('Failed to create user')) {
    result.type = 'auth_error';
    result.severity = 'critical';
    result.title = 'User Creation Failed';
    result.fixable = true;
    result.context = { action: 'recreate_user', botProfile: result.botProfile };
  }
  
  // Failed to create order
  else if (message.includes('Failed to create order')) {
    result.type = 'order_error';
    result.severity = 'critical';
    result.title = 'Order Creation Failed';
    result.fixable = true;
    result.context = { action: 'recreate_order', botProfile: result.botProfile };
  }
  
  // Workflow failed
  else if (message.includes('Workflow failed')) {
    result.type = 'workflow_error';
    result.severity = 'warning';
    result.title = 'Workflow Failed';
    result.fixable = true;
    result.context = { action: 'restart_workflow', botProfile: result.botProfile };
  }
  
  // Auth errors
  else if (message.includes('Auth') || message.includes('authentication') || message.includes('permission')) {
    result.type = 'auth_error';
    result.severity = 'critical';
    result.title = 'Authentication Error';
    result.fixable = true;
    result.context = { action: 'fix_auth', botProfile: result.botProfile };
  }
  
  // Database errors
  else if (message.includes('database') || message.includes('constraint') || message.includes('foreign key')) {
    result.type = 'database_error';
    result.severity = 'critical';
    result.title = 'Database Error';
    result.fixable = true;
    result.context = { action: 'fix_database', botProfile: result.botProfile };
  }
  
  // API errors
  else if (message.includes('API') || message.includes('fetch') || message.includes('timeout')) {
    result.type = 'api_error';
    result.severity = 'warning';
    result.title = 'API Error';
    result.fixable = true;
    result.context = { action: 'retry_api', botProfile: result.botProfile };
  }

  // Extract stack trace if available
  if (message.includes('Error:') && message.includes('at ')) {
    const parts = message.split('Error:');
    if (parts.length > 1) {
      result.stackTrace = parts[1].trim();
    }
  }

  return result;
}