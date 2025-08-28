import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Users,
  Zap,
  Target
} from "lucide-react";

interface WorkflowPhase {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  status: string[];
  triggers: string[];
  actions: string[];
  stakeholders: string[];
}

interface Order {
  id: string;
  status: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
}

interface WorkflowPhaseDetailsProps {
  phases: WorkflowPhase[];
  orders: Order[];
}

export function WorkflowPhaseDetails({ phases, orders }: WorkflowPhaseDetailsProps) {
  const getOrdersForPhase = (phase: WorkflowPhase) => {
    return orders.filter(order => phase.status.includes(order.status));
  };

  const getPhaseCompletion = (phase: WorkflowPhase) => {
    const phaseOrders = getOrdersForPhase(phase);
    const totalOrders = orders.filter(o => !['cancelled'].includes(o.status)).length;
    return totalOrders > 0 ? (phaseOrders.length / totalOrders) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Complete Workflow Phase Details</h2>
        <p className="text-muted-foreground mt-2">
          Detailed breakdown of each phase in the order-to-kitchen workflow
        </p>
      </div>

      {/* Workflow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            9-Phase Workflow Timeline
          </CardTitle>
          <CardDescription>
            End-to-end process from order confirmation to guest satisfaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {phases.map((phase, index) => {
              const Icon = phase.icon;
              const orderCount = getOrdersForPhase(phase).length;
              
              return (
                <div key={phase.id} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[120px]">
                    <div className={`p-3 rounded-full ${phase.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-xs font-medium mt-2 text-center">
                      Phase {index + 1}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {phase.title.split(' ')[0]}
                    </div>
                    {orderCount > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        {orderCount}
                      </Badge>
                    )}
                  </div>
                  {index < phases.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Phase Cards */}
      <div className="grid gap-6">
        {phases.map((phase, index) => {
          const Icon = phase.icon;
          const phaseOrders = getOrdersForPhase(phase);
          const completion = getPhaseCompletion(phase);
          
          return (
            <Card key={phase.id} className="overflow-hidden">
              <CardHeader className={`${phase.color} text-white`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6" />
                    <div>
                      <CardTitle className="text-white">
                        Phase {index + 1}: {phase.title}
                      </CardTitle>
                      <CardDescription className="text-white/80">
                        {phase.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {phaseOrders.length} orders
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Phase Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4" />
                        Triggers
                      </h4>
                      <ul className="space-y-1">
                        {phase.triggers.map((trigger, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                            {trigger}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Actions
                      </h4>
                      <ul className="space-y-1">
                        {phase.actions.map((action, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4" />
                        Stakeholders Notified
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {phase.stakeholders.map((stakeholder, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {stakeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" />
                        Current Status
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Orders in Phase</span>
                          <span className="font-medium">{phaseOrders.length}</span>
                        </div>
                        <Progress value={completion} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {completion.toFixed(1)}% of total active orders
                        </div>
                      </div>
                    </div>

                    {phaseOrders.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-2">Recent Orders</h4>
                          <div className="space-y-2">
                            {phaseOrders.slice(0, 3).map((order) => (
                              <div key={order.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                <div>
                                  <div className="text-sm font-medium">{order.customer_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    ${order.total_amount.toFixed(2)}
                                  </div>
                                </div>
                                <Badge className={`text-xs ${phase.color} text-white`}>
                                  {order.status}
                                </Badge>
                              </div>
                            ))}
                            {phaseOrders.length > 3 && (
                              <div className="text-xs text-muted-foreground text-center">
                                +{phaseOrders.length - 3} more orders
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {phaseOrders.length === 0 && (
                      <div className="text-center py-4">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <div className="text-sm text-muted-foreground">No orders currently in this phase</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Breakdown */}
                {phase.status.length > 1 && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-semibold mb-2">Status Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {phase.status.map((status) => {
                        const statusOrders = orders.filter(o => o.status === status);
                        return (
                          <div key={status} className="text-center p-2 bg-muted rounded">
                            <div className="font-medium">{statusOrders.length}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {status.replace('_', ' ')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Roadmap</CardTitle>
          <CardDescription>
            Current development status of each workflow phase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div key={phase.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${phase.color} text-white`}>
                    <phase.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{phase.title}</div>
                    <div className="text-sm text-muted-foreground">Phase {index + 1}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {index === 0 ? "In Progress" : "Planned"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}