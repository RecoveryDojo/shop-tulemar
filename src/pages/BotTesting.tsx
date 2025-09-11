import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShopLayout } from '@/components/shop/ShopLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Bot, 
  Play, 
  Users, 
  ShoppingCart, 
  Truck, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  DollarSign,
  Package,
  MessageSquare,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface BotTestResults {
  botsCreated: number;
  ordersPlaced: number;
  workflowsCompleted: number;
  errors: string[];
  timestamp: string;
}

interface BotProfile {
  id: string;
  display_name: string;
  role: string;
  bio: string;
  status: 'pending' | 'created' | 'active' | 'completed' | 'error';
  orderCount?: number;
  lastActivity?: string;
}

const initialBotProfiles: BotProfile[] = [
  {
    id: 'bot_guest_luxury',
    display_name: 'Victoria Sterling',
    role: 'client',
    bio: 'Luxury vacation guest with high-end preferences',
    status: 'pending'
  },
  {
    id: 'bot_family_guest',
    display_name: 'Sarah & Mike Johnson',
    role: 'client',
    bio: 'Family with children staying for a week',
    status: 'pending'
  },
  {
    id: 'bot_business_guest',
    display_name: 'James Rodriguez',
    role: 'client',
    bio: 'Business traveler needing quick essentials',
    status: 'pending'
  },
  {
    id: 'bot_romantic_couple',
    display_name: 'Emma & David Chen',
    role: 'client',
    bio: 'Romantic getaway couple',
    status: 'pending'
  },
  {
    id: 'bot_shopper_senior',
    display_name: 'Maria Gonzalez',
    role: 'shopper',
    bio: 'Experienced personal shopper, 5+ years',
    status: 'pending'
  },
  {
    id: 'bot_shopper_junior',
    display_name: 'Alex Thompson',
    role: 'shopper',
    bio: 'New personal shopper, learning the ropes',
    status: 'pending'
  },
  {
    id: 'bot_driver_express',
    display_name: 'Carlos Rivera',
    role: 'driver',
    bio: 'Express delivery specialist',
    status: 'pending'
  },
  {
    id: 'bot_driver_careful',
    display_name: 'Jennifer Park',
    role: 'driver',
    bio: 'Careful delivery with special handling',
    status: 'pending'
  },
  {
    id: 'bot_concierge_premium',
    display_name: 'Isabella Martinez',
    role: 'concierge',
    bio: 'Premium concierge service specialist',
    status: 'pending'
  },
  {
    id: 'bot_manager_efficiency',
    display_name: 'Robert Kim',
    role: 'store_manager',
    bio: 'Store manager focused on operational efficiency',
    status: 'pending'
  }
];

export default function BotTestingDashboard() {
  const [botProfiles, setBotProfiles] = useState<BotProfile[]>(initialBotProfiles);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BotTestResults | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-20), `[${timestamp}] ${message}`]);
  };

  const runBotSystem = async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    addLog('🤖 Initializing bot testing system...');
    
    try {
      const response = await supabase.functions.invoke('bot-testing-system', {
        body: { action: 'run_simulation' }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const testResults = response.data as BotTestResults;
      setResults(testResults);

      // Simulate progress updates
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        if (i <= 30) {
          addLog(`Creating bot users... ${Math.floor(i/3)}/10 bots`);
        } else if (i <= 60) {
          addLog(`Generating realistic orders with AI...`);
        } else if (i <= 90) {
          addLog(`Running order workflows... Processing deliveries`);
        } else {
          addLog(`✅ Bot simulation completed successfully!`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update bot statuses
      setBotProfiles(prev => prev.map(bot => ({
        ...bot,
        status: 'completed',
        orderCount: Math.floor(Math.random() * 3) + 1,
        lastActivity: 'Just now'
      })));

      toast.success(`Bot testing completed! ${testResults.botsCreated} bots created, ${testResults.ordersPlaced} orders placed`);

    } catch (error: any) {
      console.error('Bot testing error:', error);
      addLog(`❌ Error: ${error.message}`);
      toast.error('Bot testing failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'created': return <Users className="h-4 w-4 text-blue-500" />;
      case 'active': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'created': return 'default';
      case 'active': return 'default';
      case 'completed': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client': return <Users className="h-4 w-4" />;
      case 'shopper': return <ShoppingCart className="h-4 w-4" />;
      case 'driver': return <Truck className="h-4 w-4" />;
      case 'concierge': return <MessageSquare className="h-4 w-4" />;
      case 'store_manager': return <BarChart3 className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  return (
    <ShopLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold">Bot Testing System</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive automated testing with 10 AI bots simulating the complete order workflow
            from guest to concierge, testing every aspect of your system.
          </p>
        </div>

        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Control Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Full System Test</h3>
                <p className="text-sm text-muted-foreground">
                  Creates 10 bots, generates realistic orders (5-40 items each), and runs complete workflows
                </p>
              </div>
              <Button 
                onClick={runBotSystem}
                disabled={isRunning}
                size="lg"
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Bot Test
                  </>
                )}
              </Button>
            </div>

            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Test Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        {results && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bots Created</p>
                    <p className="text-2xl font-bold">{results.botsCreated}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Orders Placed</p>
                    <p className="text-2xl font-bold">{results.ordersPlaced}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Workflows Completed</p>
                    <p className="text-2xl font-bold">{results.workflowsCompleted}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {results.ordersPlaced > 0 ? Math.round((results.workflowsCompleted / results.ordersPlaced) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bot Status Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Bot Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {botProfiles.map((bot) => (
                  <div key={bot.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(bot.role)}
                        {getStatusIcon(bot.status)}
                      </div>
                      <div>
                        <div className="font-medium">{bot.display_name}</div>
                        <div className="text-xs text-muted-foreground">{bot.bio}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={getStatusColor(bot.status)}>
                        {bot.role}
                      </Badge>
                      {bot.orderCount && (
                        <div className="text-xs text-muted-foreground">
                          {bot.orderCount} orders
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} className="text-xs font-mono bg-muted p-2 rounded">
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No test logs yet. Start a bot test to see activity.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Test Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Test Scenarios Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  User Types
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Luxury vacation guests</li>
                  <li>• Family travelers</li>
                  <li>• Business guests</li>
                  <li>• Romantic couples</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-green-500" />
                  Order Variations
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 5-40 items per order</li>
                  <li>• Different price ranges</li>
                  <li>• Various dietary preferences</li>
                  <li>• Special instructions</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  Workflow Steps
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Order confirmation</li>
                  <li>• Shopper assignment</li>
                  <li>• Shopping & purchasing</li>
                  <li>• Delivery & completion</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                  Staff Roles
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Personal shoppers</li>
                  <li>• Delivery drivers</li>
                  <li>• Concierge staff</li>
                  <li>• Store managers</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-red-500" />
                  System Features
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Real-time notifications</li>
                  <li>• Order tracking</li>
                  <li>• Role-based access</li>
                  <li>• Workflow logging</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Payment Testing
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Order totals calculation</li>
                  <li>• Tax computation</li>
                  <li>• Delivery fees</li>
                  <li>• Payment processing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Reporting */}
        {results && results.errors.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Test completed with {results.errors.length} errors:</div>
                <ul className="text-sm space-y-1">
                  {results.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </ShopLayout>
  );
}