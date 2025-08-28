import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useWorkflowAutomation } from "@/hooks/useWorkflowAutomation";
import { 
  Zap, 
  Settings, 
  Play,
  Pause,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity
} from "lucide-react";

export function WorkflowAutomationPanel() {
  const { rules, isProcessing, triggerManualAutomation, toggleRule } = useWorkflowAutomation();
  const { toast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const handleToggleRule = (ruleId: string) => {
    toggleRule(ruleId);
    const rule = rules.find(r => r.id === ruleId);
    toast({
      title: "Automation Rule Updated",
      description: `${rule?.id} is now ${rule?.enabled ? 'disabled' : 'enabled'}`,
    });
  };

  const handleManualTrigger = async (ruleId: string) => {
    if (!selectedOrderId) {
      toast({
        title: "Order Required",
        description: "Please enter an order ID to test automation",
        variant: "destructive"
      });
      return;
    }

    await triggerManualAutomation(selectedOrderId, ruleId);
  };

  const getRuleStatusColor = (enabled: boolean) => {
    return enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Workflow Automation</h2>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <Badge variant="secondary" className="animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              Processing
            </Badge>
          )}
          <Badge variant="outline">
            {rules.filter(r => r.enabled).length} / {rules.length} Active
          </Badge>
        </div>
      </div>

      {/* Automation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rules.filter(r => r.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {isProcessing ? '1' : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">0ms</div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Automation Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-medium">{rule.id.replace(/_/g, ' ').toUpperCase()}</div>
                      <Badge className={getRuleStatusColor(rule.enabled)}>
                        {rule.enabled ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Disabled
                          </>
                        )}
                      </Badge>
                      {rule.delay_minutes && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {rule.delay_minutes}m delay
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground mb-3">
                      <div>
                        <strong>Trigger:</strong> When status changes to "{rule.trigger_status}"
                      </div>
                      {rule.target_status !== rule.trigger_status && (
                        <div>
                          <strong>Action:</strong> Update status to "{rule.target_status}"
                        </div>
                      )}
                      <div>
                        <strong>Actions:</strong> {rule.actions.join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => handleToggleRule(rule.id)}
                      />
                      <span className="text-sm">
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManualTrigger(rule.id)}
                      disabled={!rule.enabled || isProcessing}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Manual Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Test Order ID</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Enter order ID to test automation rules"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Enter an order ID and click "Test" on any automation rule above to manually trigger the workflow automation for testing purposes.
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> Manual testing will execute actual automation actions. 
                  Use with caution in production environment.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}