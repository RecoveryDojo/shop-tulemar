import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  ShoppingCart, 
  Truck, 
  Bell,
  ArrowDown,
  MapPin
} from 'lucide-react';

interface SwimlaneOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: number;
  created_at: string;
  assigned_shopper_id?: string;
}

interface DebuggingSwimlaneChartProps {
  orders: SwimlaneOrder[];
  title?: string;
}

const WORKFLOW_LANES = [
  {
    id: 'customer',
    name: 'Customer',
    icon: User,
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700'
  },
  {
    id: 'system',
    name: 'System',
    icon: Bell,
    color: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-700'
  },
  {
    id: 'shopper',
    name: 'Shopper',
    icon: ShoppingCart,
    color: 'bg-green-50 border-green-200',
    textColor: 'text-green-700'
  },
  {
    id: 'driver',
    name: 'Driver',
    icon: Truck,
    color: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-700'
  }
];

const WORKFLOW_STEPS = [
  {
    phase: 'Order Placement',
    steps: [
      { lane: 'customer', action: 'Places Order', status: 'placed', icon: ShoppingCart },
      { lane: 'system', action: 'Payment Processed', status: 'placed', icon: CheckCircle2 },
    ]
  },
  {
    phase: 'Shopping Assignment',
    steps: [
      { lane: 'system', action: 'Finds Available Shopper', status: 'placed', icon: Bell },
      { lane: 'shopper', action: 'Accepts Order', status: 'claimed', icon: CheckCircle2 },
      { lane: 'shopper', action: 'Starts Shopping', status: 'shopping', icon: ShoppingCart },
    ]
  },
  {
    phase: 'Shopping Process',
    steps: [
      { lane: 'shopper', action: 'Gathering Items', status: 'shopping', icon: ShoppingCart },
      { lane: 'shopper', action: 'Shopping Complete', status: 'ready', icon: CheckCircle2 },
      { lane: 'system', action: 'Ready for Delivery', status: 'ready', icon: Bell },
    ]
  },
  {
    phase: 'Delivery Process',
    steps: [
      { lane: 'driver', action: 'Picks Up Order', status: 'ready', icon: Truck },
      { lane: 'driver', action: 'Out for Delivery', status: 'delivered', icon: MapPin },
      { lane: 'driver', action: 'Delivered', status: 'delivered', icon: CheckCircle2 },
      { lane: 'system', action: 'Order Completed', status: 'closed', icon: CheckCircle2 },
    ]
  }
];

export const DebuggingSwimlaneChart = ({ orders, title = "Workflow Debugging - Swimlane View" }: DebuggingSwimlaneChartProps) => {
  // Focus on Jessica's order for debugging
  const jessicaOrder = orders.find(order => 
    order.customer_email === 'babeslovesdaisies@gmail.com' || 
    order.customer_name.toLowerCase().includes('jessica')
  );

  const getCurrentPhase = (orderStatus: string) => {
    for (const phase of WORKFLOW_STEPS) {
      if (phase.steps.some(step => step.status === orderStatus)) {
        return phase.phase;
      }
    }
    return 'Unknown Phase';
  };

  const getStepStatus = (stepStatus: string, orderStatus: string) => {
    const statusOrder = ['placed', 'claimed', 'shopping', 'ready', 'delivered', 'closed'];
    const currentIndex = statusOrder.indexOf(orderStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            {title}
          </CardTitle>
          {jessicaOrder && (
            <div className="text-sm text-muted-foreground">
              Tracking: {jessicaOrder.customer_name} | Status: 
              <Badge variant="outline" className="ml-1">{jessicaOrder.status}</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {jessicaOrder ? (
          <div className="space-y-6">
            {/* Current Status Summary */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Debug Focus: Jessica's Order</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order ID:</span>
                  <div className="text-yellow-700">{jessicaOrder.id.slice(0, 8)}...</div>
                </div>
                <div>
                  <span className="font-medium">Current Phase:</span>
                  <div className="text-yellow-700">{getCurrentPhase(jessicaOrder.status)}</div>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <div className="text-yellow-700 capitalize">{jessicaOrder.status.replace('_', ' ')}</div>
                </div>
                <div>
                  <span className="font-medium">Total:</span>
                  <div className="text-yellow-700">${jessicaOrder.total_amount}</div>
                </div>
              </div>
            </div>

            {/* Swimlane Diagram */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Lane Headers */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <div className="font-semibold text-center text-sm p-2">Phase</div>
                  {WORKFLOW_LANES.map(lane => {
                    const Icon = lane.icon;
                    return (
                      <div key={lane.id} className={`${lane.color} rounded-lg p-3 text-center`}>
                        <div className={`flex items-center justify-center gap-2 ${lane.textColor} font-semibold`}>
                          <Icon className="w-4 h-4" />
                          {lane.name}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Workflow Steps */}
                {WORKFLOW_STEPS.map((phase, phaseIndex) => (
                  <div key={phase.phase} className="mb-6">
                    <div className="grid grid-cols-5 gap-2 items-start">
                      {/* Phase Label */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="font-medium text-sm text-center">{phase.phase}</div>
                        <div className="text-xs text-gray-500 text-center mt-1">Phase {phaseIndex + 1}</div>
                      </div>

                      {/* Lane Columns */}
                      {WORKFLOW_LANES.map(lane => {
                        const laneSteps = phase.steps.filter(step => step.lane === lane.id);
                        
                        return (
                          <div key={lane.id} className={`${lane.color} rounded-lg p-2 min-h-[80px]`}>
                            {laneSteps.map((step, stepIndex) => {
                              const status = getStepStatus(step.status, jessicaOrder.status);
                              const Icon = step.icon;
                              
                              return (
                                <div key={stepIndex} className="mb-2 last:mb-0">
                                  <div className={`rounded p-2 border-2 transition-all ${
                                    status === 'completed' 
                                      ? 'bg-green-100 border-green-400 text-green-700' 
                                      : status === 'current'
                                      ? 'bg-yellow-100 border-yellow-400 text-yellow-700 shadow-lg scale-105'
                                      : 'bg-white border-gray-300 text-gray-500'
                                  }`}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="w-3 h-3" />
                                      <span className="text-xs font-medium">{step.action}</span>
                                    </div>
                                    {status === 'current' && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-xs">Active</span>
                                      </div>
                                    )}
                                  </div>
                                  {stepIndex < laneSteps.length - 1 && (
                                    <ArrowDown className="w-3 h-3 mx-auto text-gray-400 my-1" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Debug Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" size="sm">
                📋 Export Debug State
              </Button>
              <Button variant="outline" size="sm">
                🔄 Refresh Status
              </Button>
              <Button variant="outline" size="sm">
                📧 View Notifications
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Debug Target Found</h3>
            <p className="text-gray-500 mb-4">
              Jessica's order not found in current order set.
            </p>
            <Button variant="outline" size="sm">
              🔍 Search All Orders
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};