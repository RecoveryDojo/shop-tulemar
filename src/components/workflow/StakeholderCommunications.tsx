import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Send,
  Eye,
  Filter
} from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface StakeholderAssignment {
  id: string;
  order_id: string;
  role: string;
  user_id: string;
  status: string;
  assigned_at: string;
}

interface WorkflowLog {
  id: string;
  order_id: string;
  phase: string;
  action: string;
  actor_role: string;
  timestamp: string;
  notes: string;
}

interface StakeholderCommunicationsProps {
  orders: Order[];
  assignments: StakeholderAssignment[];
  workflowLogs: WorkflowLog[];
}

// Mock notification data - in real implementation this would come from order_notifications table
const mockNotifications = [
  {
    id: '1',
    order_id: 'order-1',
    notification_type: 'order_confirmed',
    recipient_type: 'client',
    recipient_identifier: 'john@example.com',
    channel: 'email',
    status: 'delivered',
    message_content: 'Your grocery order has been confirmed and we are assigning a shopper.',
    sent_at: new Date(Date.now() - 3600000).toISOString(),
    delivered_at: new Date(Date.now() - 3500000).toISOString()
  },
  {
    id: '2',
    order_id: 'order-1',
    notification_type: 'shopper_assigned',
    recipient_type: 'shopper',
    recipient_identifier: '+1234567890',
    channel: 'sms',
    status: 'sent',
    message_content: 'New order assigned! Please accept within 15 minutes.',
    sent_at: new Date(Date.now() - 3000000).toISOString()
  },
  {
    id: '3',
    order_id: 'order-2',
    notification_type: 'substitution_request',
    recipient_type: 'client',
    recipient_identifier: 'jane@example.com',
    channel: 'sms',
    status: 'delivered',
    message_content: 'Organic bananas unavailable. Can we substitute with regular bananas?',
    sent_at: new Date(Date.now() - 1800000).toISOString(),
    delivered_at: new Date(Date.now() - 1700000).toISOString()
  }
];

const COMMUNICATION_TEMPLATES = [
  {
    phase: 'Order Confirmation',
    triggers: ['Order submitted', 'Payment confirmed'],
    communications: [
      {
        type: 'SMS',
        recipient: 'Client',
        timing: 'Immediate',
        template: 'Order confirmed! Your groceries will be ready before your arrival on [DATE]. Order #[ORDER_ID]'
      },
      {
        type: 'Email',
        recipient: 'Client',
        timing: 'Within 5 minutes',
        template: 'Detailed order confirmation with itemized list and delivery details'
      },
      {
        type: 'Push',
        recipient: 'Available Shoppers',
        timing: 'Immediate',
        template: 'New order available in your area. Estimated time: [EST_TIME]'
      }
    ]
  },
  {
    phase: 'Shopping Process',
    triggers: ['Item unavailable', 'Substitution needed'],
    communications: [
      {
        type: 'SMS + Photo',
        recipient: 'Client',
        timing: 'Real-time',
        template: '[ITEM] unavailable. Suggested substitute: [ALT_ITEM]. Photo attached. Reply YES/NO'
      },
      {
        type: 'Push',
        recipient: 'Shopper',
        timing: 'Real-time',
        template: 'Customer approved substitution for [ITEM]'
      }
    ]
  },
  {
    phase: 'Delivery & Transit',
    triggers: ['Order out for delivery', 'ETA updates'],
    communications: [
      {
        type: 'SMS',
        recipient: 'Client',
        timing: 'When departing',
        template: 'Your groceries are on the way! ETA: [TIME]. Track: [LINK]'
      },
      {
        type: 'SMS',
        recipient: 'Concierge',
        timing: '15 min before arrival',
        template: 'Grocery delivery arriving in 15 minutes for [PROPERTY]'
      }
    ]
  },
  {
    phase: 'Kitchen Stocked',
    triggers: ['Stocking completed'],
    communications: [
      {
        type: 'SMS',
        recipient: 'Client',
        timing: 'Upon completion',
        template: '🏠 Your kitchen is fully stocked and ready! Welcome to paradise. 🌴'
      },
      {
        type: 'Email',
        recipient: 'All Stakeholders',
        timing: 'Upon completion',
        template: 'Order completion summary with photos and satisfaction survey'
      }
    ]
  }
];

const CHANNEL_ICONS = {
  sms: Smartphone,
  email: Mail,
  push: Bell,
  'in-app': MessageSquare
};

const STATUS_COLORS = {
  pending: 'bg-yellow-500',
  sent: 'bg-blue-500',
  delivered: 'bg-green-500',
  failed: 'bg-red-500'
};

export function StakeholderCommunications({ orders, assignments, workflowLogs }: StakeholderCommunicationsProps) {
  const [selectedPhase, setSelectedPhase] = useState("all");

  const getNotificationStats = () => {
    const stats = {
      total: mockNotifications.length,
      sent: mockNotifications.filter(n => n.status === 'sent' || n.status === 'delivered').length,
      delivered: mockNotifications.filter(n => n.status === 'delivered').length,
      failed: mockNotifications.filter(n => n.status === 'failed').length,
      pending: mockNotifications.filter(n => n.status === 'pending').length
    };
    return stats;
  };

  const stats = getNotificationStats();

  return (
    <div className="space-y-6">
      {/* Communication Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All channels</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Delivery failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="templates">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Clock className="h-4 w-4" />
            Message Logs
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-2">
            <Send className="h-4 w-4" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="stakeholders" className="gap-2">
            <Users className="h-4 w-4" />
            Stakeholders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Templates by Workflow Phase</CardTitle>
              <CardDescription>
                Automated messaging templates for each stage of the order workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {COMMUNICATION_TEMPLATES.map((phase, index) => (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{phase.phase}</h3>
                      <Badge variant="outline">
                        {phase.communications.length} templates
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Triggers:</h4>
                      <div className="flex flex-wrap gap-1">
                        {phase.triggers.map((trigger, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Communications:</h4>
                      {phase.communications.map((comm, i) => {
                        const ChannelIcon = CHANNEL_ICONS[comm.type.toLowerCase().split(' ')[0] as keyof typeof CHANNEL_ICONS] || MessageSquare;
                        return (
                          <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                            <div className="p-2 bg-background rounded">
                              <ChannelIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {comm.type}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  To: {comm.recipient}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {comm.timing}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {comm.template}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Message Delivery Logs</CardTitle>
              <CardDescription>
                Real-time tracking of all notifications sent to stakeholders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockNotifications.map((notification) => {
                    const ChannelIcon = CHANNEL_ICONS[notification.channel as keyof typeof CHANNEL_ICONS];
                    return (
                      <TableRow key={notification.id}>
                        <TableCell className="text-sm">
                          {new Date(notification.sent_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ChannelIcon className="h-4 w-4" />
                            <span className="text-sm capitalize">{notification.channel}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium capitalize">
                              {notification.recipient_type}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {notification.recipient_identifier}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {notification.notification_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_COLORS[notification.status as keyof typeof STATUS_COLORS]} text-white text-xs`}>
                            {notification.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm truncate">
                            {notification.message_content}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SMS Channel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  SMS Communications
                </CardTitle>
                <CardDescription>
                  Immediate notifications via Twilio integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold">
                        {mockNotifications.filter(n => n.channel === 'sms').length}
                      </div>
                      <div className="text-xs text-muted-foreground">SMS Sent</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold text-green-600">98.5%</div>
                      <div className="text-xs text-muted-foreground">Delivery Rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Use Cases:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Order confirmations</li>
                      <li>• Delivery updates</li>
                      <li>• Substitution requests</li>
                      <li>• Arrival notifications</li>
                      <li>• Kitchen ready alerts</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Channel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Communications
                </CardTitle>
                <CardDescription>
                  Detailed communications via Resend integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold">
                        {mockNotifications.filter(n => n.channel === 'email').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Emails Sent</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold text-green-600">94.2%</div>
                      <div className="text-xs text-muted-foreground">Delivery Rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Use Cases:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Detailed order confirmations</li>
                      <li>• Photo documentation</li>
                      <li>• Completion summaries</li>
                      <li>• Satisfaction surveys</li>
                      <li>• Receipt delivery</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>
                  Real-time app notifications for immediate updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold">
                        {mockNotifications.filter(n => n.channel === 'push').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Push Sent</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold text-green-600">89.7%</div>
                      <div className="text-xs text-muted-foreground">Delivery Rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Use Cases:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Order assignments</li>
                      <li>• Status updates</li>
                      <li>• Substitution approvals</li>
                      <li>• Real-time tracking</li>
                      <li>• Urgent notifications</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* In-App Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  In-App Messaging
                </CardTitle>
                <CardDescription>
                  Direct communication within the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold">
                        {mockNotifications.filter(n => n.channel === 'in-app').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Messages</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold text-green-600">100%</div>
                      <div className="text-xs text-muted-foreground">Delivery Rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Use Cases:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Chat between stakeholders</li>
                      <li>• Photo sharing</li>
                      <li>• Status updates</li>
                      <li>• Task assignments</li>
                      <li>• Internal communications</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stakeholders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stakeholder Communication Matrix</CardTitle>
              <CardDescription>
                Communication preferences and contact methods for each stakeholder type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {[
                  {
                    role: 'Client',
                    description: 'Vacation rental guests placing orders',
                    count: orders.length,
                    primaryChannels: ['SMS', 'Email'],
                    notifications: ['Order confirmations', 'Substitution requests', 'Delivery updates', 'Kitchen ready alerts']
                  },
                  {
                    role: 'Shopper',
                    description: 'Personal shoppers handling grocery selection',
                    count: assignments.filter(a => a.role === 'shopper').length,
                    primaryChannels: ['Push', 'SMS'],
                    notifications: ['Order assignments', 'Customer approvals', 'Substitution guidelines', 'Quality checks']
                  },
                  {
                    role: 'Driver',
                    description: 'Delivery personnel transporting orders',
                    count: assignments.filter(a => a.role === 'driver').length,
                    primaryChannels: ['Push', 'In-App'],
                    notifications: ['Delivery assignments', 'Route optimization', 'Arrival confirmations', 'Handoff protocols']
                  },
                  {
                    role: 'Concierge',
                    description: 'Property staff handling kitchen stocking',
                    count: assignments.filter(a => a.role === 'concierge').length,
                    primaryChannels: ['Push', 'SMS'],
                    notifications: ['Delivery arrivals', 'Stocking protocols', 'Quality verification', 'Completion confirmations']
                  },
                  {
                    role: 'Admin',
                    description: 'Operations team overseeing workflow',
                    count: 1,
                    primaryChannels: ['Email', 'Push', 'In-App'],
                    notifications: ['All system alerts', 'Escalations', 'Performance metrics', 'Issue resolution']
                  }
                ].map((stakeholder) => (
                  <div key={stakeholder.role} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{stakeholder.role}</h3>
                        <p className="text-sm text-muted-foreground">{stakeholder.description}</p>
                      </div>
                      <Badge variant="secondary">
                        {stakeholder.count} active
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Primary Channels:</h4>
                        <div className="flex flex-wrap gap-1">
                          {stakeholder.primaryChannels.map((channel) => (
                            <Badge key={channel} variant="outline" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Notification Types:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {stakeholder.notifications.map((notification, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                              {notification}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}