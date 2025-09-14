import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Send, CheckCircle, Clock } from 'lucide-react';
import { triggerRetroactiveNotifications } from '@/utils/triggerRetroactiveNotifications';

export const NotificationTester = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTriggerNotifications = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await triggerRetroactiveNotifications(
        '93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7', // Jessica's order ID
        'c0656059-7095-440e-a6f2-9889128866c2', // Scott's user ID  
        'fc09480b-370d-4748-9a23-148b9ed2227a'  // Jessica's user ID
      );
      
      setResult(response);
    } catch (error) {
      setResult({ success: false, error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Manual Notification Trigger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Scott was assigned to Jessica at 5:15 PM but no notifications were sent. 
            This will manually trigger the missing notifications.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-semibold">Will trigger:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>📧 Email notification to Scott about assignment</li>
            <li>📧 Email notification to Jessica about her shopper</li>
            <li>💬 Initial message from Scott to Jessica</li>
            <li>🔔 App notifications for both users</li>
          </ul>
        </div>

        <Button 
          onClick={handleTriggerNotifications}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Triggering Notifications...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Trigger Missing Notifications
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? "border-green-500" : "border-red-500"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription>
              {result.success ? (
                <div>
                  <strong>✅ Notifications triggered successfully!</strong>
                  <div className="mt-2 text-sm">
                    Check your email and the messages tab to see the notifications.
                  </div>
                </div>
              ) : (
                <div>
                  <strong>❌ Error triggering notifications:</strong>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Order ID:</strong> 93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7</p>
          <p><strong>Scott ID:</strong> c0656059-7095-440e-a6f2-9889128866c2</p>
          <p><strong>Jessica ID:</strong> fc09480b-370d-4748-9a23-148b9ed2227a</p>
          <p><strong>Assignment Time:</strong> 2025-09-14 23:15:27</p>
        </div>
      </CardContent>
    </Card>
  );
};