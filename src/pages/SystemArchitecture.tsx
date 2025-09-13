import { ShopLayout } from "@/components/shop/ShopLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Database, Globe, Server, Smartphone, Users, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function SystemArchitecture() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    technical: true,
    lifecycle: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const orderLifecycleStages = [
    { id: 'pending', name: 'Pending', description: 'Order submitted, awaiting payment', color: 'bg-yellow-500', icon: '📝' },
    { id: 'confirmed', name: 'Confirmed', description: 'Payment verified, order accepted', color: 'bg-green-500', icon: '✅' },
    { id: 'assigned', name: 'Assigned', description: 'Team members auto-assigned to roles', color: 'bg-blue-500', icon: '👥' },
    { id: 'shopping', name: 'Shopping', description: 'Shopper begins collecting groceries', color: 'bg-purple-500', icon: '🛒' },
    { id: 'packed', name: 'Packed', description: 'Items ready for delivery', color: 'bg-indigo-500', icon: '📦' },
    { id: 'out_for_delivery', name: 'Out for Delivery', description: 'Driver en route to property', color: 'bg-orange-500', icon: '🚚' },
    { id: 'arrived', name: 'Arrived', description: 'Delivery at property entrance', color: 'bg-teal-500', icon: '🏠' },
    { id: 'stocking', name: 'Stocking', description: 'Concierge stocks the kitchen', color: 'bg-pink-500', icon: '🍽️' },
    { id: 'completed', name: 'Completed', description: 'Order fully fulfilled', color: 'bg-emerald-500', icon: '🎉' },
  ];

  return (
    <ShopLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">System Architecture</h1>
          <p className="text-xl text-muted-foreground">
            Complete technical overview of the Tulemar Concierge platform architecture and order processing workflow.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical Stack</TabsTrigger>
            <TabsTrigger value="lifecycle">Order Lifecycle</TabsTrigger>
            <TabsTrigger value="flowchart">Simple Flowchart</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-6 w-6" />
                  Platform Overview
                </CardTitle>
                <CardDescription>
                  High-level architecture of the Tulemar Concierge grocery delivery platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
{`graph TB
    A[Customer Portal] --> B[Authentication Layer]
    B --> C[Role-Based Dashboards]
    C --> D[Order Management System]
    D --> E[Workflow Automation]
    E --> F[Notification System]
    F --> G[Real-time Updates]
    
    subgraph "Frontend Layer"
        A
        C
        H[Admin Panel]
        I[Shopper Dashboard]
        J[Driver Dashboard]
        K[Concierge Dashboard]
    end
    
    subgraph "Backend Services"
        B
        D
        E
        F
        L[Payment Processing]
        M[Inventory Management]
        N[Analytics Engine]
    end
    
    subgraph "Database Layer"
        O[Orders Table]
        P[Products Table]
        Q[Users & Profiles]
        R[Notifications]
        S[Analytics Data]
    end
    
    D --> O
    M --> P
    B --> Q
    F --> R
    N --> S`}
                    </pre>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Smartphone className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold">Frontend</h3>
                      <p className="text-sm text-muted-foreground">React + TypeScript + Tailwind</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Server className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold">Backend</h3>
                      <p className="text-sm text-muted-foreground">Supabase + Edge Functions</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold">Database</h3>
                      <p className="text-sm text-muted-foreground">PostgreSQL + Real-time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <Collapsible open={openSections.technical} onOpenChange={() => toggleSection('technical')}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Technical Architecture Details</span>
                      <ChevronDown className={`h-5 w-5 transition-transform ${openSections.technical ? 'rotate-180' : ''}`} />
                    </CardTitle>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Frontend Architecture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-6 rounded-lg mb-4">
                      <pre className="text-sm overflow-x-auto">
{`graph LR
    A[React App] --> B[React Router]
    B --> C[Authentication Context]
    C --> D[Role-Based Routing]
    D --> E[Protected Routes]
    
    F[UI Components] --> G[Shadcn/UI]
    G --> H[Tailwind CSS]
    H --> I[Design System]
    
    J[State Management] --> K[React Query]
    K --> L[Supabase Client]
    L --> M[Real-time Subscriptions]
    
    A --> F
    A --> J`}
                      </pre>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Badge variant="secondary">React 18</Badge>
                      <Badge variant="secondary">TypeScript</Badge>
                      <Badge variant="secondary">Vite</Badge>
                      <Badge variant="secondary">Tailwind CSS</Badge>
                      <Badge variant="secondary">React Router</Badge>
                      <Badge variant="secondary">React Query</Badge>
                      <Badge variant="secondary">Shadcn/UI</Badge>
                      <Badge variant="secondary">Lucide Icons</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Backend Architecture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-6 rounded-lg mb-4">
                      <pre className="text-sm overflow-x-auto">
{`graph TB
    A[Supabase Platform] --> B[PostgreSQL Database]
    A --> C[Authentication Service]
    A --> D[Real-time Engine]
    A --> E[Edge Functions]
    A --> F[Storage Service]
    
    B --> G[Row Level Security]
    B --> H[Database Functions]
    B --> I[Triggers & Policies]
    
    E --> J[Notification Orchestrator]
    E --> K[Payment Processing]
    E --> L[AI Product Processing]
    E --> M[Analytics Engine]
    
    C --> N[JWT Tokens]
    C --> O[Role Management]`}
                      </pre>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Badge variant="outline">PostgreSQL</Badge>
                      <Badge variant="outline">Row Level Security</Badge>
                      <Badge variant="outline">Edge Functions</Badge>
                      <Badge variant="outline">Real-time Subscriptions</Badge>
                      <Badge variant="outline">JWT Authentication</Badge>
                      <Badge variant="outline">File Storage</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Database Schema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-6 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
{`erDiagram
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o{ ORDER_NOTIFICATIONS : triggers
    ORDERS ||--o{ STAKEHOLDER_ASSIGNMENTS : assigns
    ORDERS ||--o{ ORDER_WORKFLOW_LOG : logs
    
    PRODUCTS ||--o{ ORDER_ITEMS : includes
    CATEGORIES ||--o{ PRODUCTS : contains
    
    USERS ||--o{ USER_ROLES : has
    USERS ||--o{ PROFILES : extends
    USERS ||--o{ USER_MESSAGES : sends
    USERS ||--o{ STAKEHOLDER_ASSIGNMENTS : assigned
    
    PROJECTS ||--o{ FEATURES : contains
    FEATURES ||--o{ TASKS : includes
    TASKS ||--o{ SUBTASKS : breaks_down
    TASKS ||--o{ TIME_ENTRIES : tracks`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          <TabsContent value="lifecycle" className="space-y-6">
            <Collapsible open={openSections.lifecycle} onOpenChange={() => toggleSection('lifecycle')}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Complete Order Lifecycle</span>
                      <ChevronDown className={`h-5 w-5 transition-transform ${openSections.lifecycle ? 'rotate-180' : ''}`} />
                    </CardTitle>
                    <CardDescription>
                      9-stage order processing workflow with automated transitions and stakeholder assignments
                    </CardDescription>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Complete Order Workflow System</CardTitle>
                    <CardDescription>
                      Comprehensive diagram showing automated workflow engine, stakeholder management, and real-time tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-6 rounded-lg mb-6">
                      <pre className="text-sm overflow-x-auto">
{`graph TB
    subgraph "Order Submission & Payment"
        A[Customer Places Order] --> B[Payment Processing]
        B --> C{Payment Success?}
        C -->|Yes| D[Order Confirmed]
        C -->|No| E[Payment Failed]
        E --> F[Customer Notified]
    end
    
    subgraph "Workflow Automation Engine"
        D --> G[Workflow Event Triggered]
        G --> H[Check Workflow Rules]
        H --> I[Execute Matching Actions]
        I --> J[Update Order Status]
        I --> K[Assign Stakeholders]
        I --> L[Send Notifications]
        I --> M[Schedule Follow-ups]
    end
    
    subgraph "Stakeholder Assignment System"
        K --> N[Auto-Assign Shopper]
        K --> O[Auto-Assign Driver]
        K --> P[Auto-Assign Concierge]
        N --> Q[15-min Acceptance Window]
        Q --> R{Accepted?}
        R -->|No| S[Auto-Reassign]
        R -->|Yes| T[Assignment Confirmed]
        S --> N
    end
    
    subgraph "Shopping Phase Workflow"
        T --> U[Shopper Starts Shopping]
        U --> V[Real-time Item Scanning]
        V --> W[Substitution Requests]
        W --> X[Customer Approval]
        X --> Y[Continue Shopping]
        Y --> Z[Quality Check Complete]
    end
    
    subgraph "Delivery & Handoff Workflow"
        Z --> AA[Driver Pickup]
        AA --> BB[GPS Tracking Active]
        BB --> CC[Route Optimization]
        CC --> DD[Arrival at Property]
        DD --> EE[Concierge Handoff]
    end
    
    subgraph "Final Stocking Workflow"
        EE --> FF[Kitchen Stocking]
        FF --> GG[Photo Documentation]
        GG --> HH[Completion Confirmation]
        HH --> II[Multi-Stakeholder Notification]
        II --> JJ[Customer Satisfaction Survey]
    end
    
    subgraph "Real-time Communication System"
        L --> KK[SMS Notifications]
        L --> LL[Email Updates]
        L --> MM[Push Notifications]
        L --> NN[In-App Alerts]
    end
    
    subgraph "Monitoring & Analytics"
        J --> OO[Real-time Status Tracker]
        J --> PP[Workflow Analytics]
        J --> QQ[Performance Metrics]
        J --> RR[Activity Logs]
    end
    
    classDef customer fill:#e1f5fe
    classDef automation fill:#f3e5f5
    classDef stakeholder fill:#e8f5e8
    classDef workflow fill:#fff3e0
    classDef communication fill:#fce4ec
    classDef monitoring fill:#f1f8e9
    
    class A,E,F,X,JJ customer
    class G,H,I,J,K,L,M automation
    class N,O,P,Q,R,S,T stakeholder
    class U,V,W,Y,Z,AA,BB,CC,DD,EE,FF,GG,HH,II workflow
    class KK,LL,MM,NN communication
    class OO,PP,QQ,RR monitoring`}
                      </pre>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-4">Automation Engine Features</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm">Event-driven workflow triggers</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm">Intelligent stakeholder assignment</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm">Automated status transitions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm">Multi-channel notifications</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm">Escalation management</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-4">Real-time Capabilities</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Live order status updates</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">GPS tracking & ETA calculation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Instant stakeholder notifications</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Live activity monitoring</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Performance analytics</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Order Processing Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-6 rounded-lg mb-4">
                      <pre className="text-sm overflow-x-auto">
{`graph LR
    A[📝 Pending] --> B[✅ Confirmed]
    B --> C[👥 Assigned]
    C --> D[🛒 Shopping]
    D --> E[📦 Packed]
    E --> F[🚚 Out for Delivery]
    F --> G[🏠 Arrived]
    G --> H[🍽️ Stocking]
    H --> I[🎉 Completed]
    
    subgraph "Automation Triggers"
        J[Payment Verification] --> B
        K[Team Assignment] --> C
        L[Shopping Complete] --> E
        M[Quality Check] --> F
        N[GPS Arrival] --> G
        O[Handoff Complete] --> H
        P[Stocking Done] --> I
    end
    
    subgraph "Stakeholder Actions"
        Q[Customer: Order & Pay]
        R[Shopper: Accept & Shop]
        S[Driver: Pick & Deliver]
        T[Concierge: Stock Kitchen]
        U[Admin: Monitor & Manage]
    end`}
                      </pre>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-4">Workflow Stage Breakdown</h3>
                      <div className="grid gap-4">
                        {orderLifecycleStages.map((stage, index) => (
                          <div key={stage.id} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="text-2xl">{stage.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{index + 1}</Badge>
                                <h4 className="font-semibold">{stage.name}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground">{stage.description}</p>
                            </div>
                            {index < orderLifecycleStages.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stakeholder Assignment & Communication Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-6 rounded-lg mb-4">
                      <pre className="text-sm overflow-x-auto">
{`sequenceDiagram
    participant C as Customer
    participant WE as Workflow Engine
    participant S as Shopper
    participant D as Driver
    participant Con as Concierge
    participant NS as Notification System
    
    C->>WE: Place Order
    WE->>WE: Validate Payment
    WE->>NS: Send Confirmation
    NS->>C: Order Confirmed (SMS/Email)
    
    WE->>S: Auto-Assign Order
    S->>WE: Accept Assignment (15min window)
    WE->>NS: Assignment Confirmed
    NS->>C: Shopper Assigned
    
    S->>WE: Start Shopping
    WE->>NS: Shopping Started
    S->>C: Substitution Request (if needed)
    C->>S: Approval/Rejection
    
    S->>WE: Shopping Complete
    WE->>D: Auto-Assign Delivery
    D->>WE: Accept & Pickup
    WE->>NS: Out for Delivery
    NS->>C: Delivery Started + GPS Link
    
    D->>WE: Arrived at Property
    WE->>Con: Handoff to Concierge
    Con->>WE: Kitchen Stocking Started
    
    Con->>WE: Stocking Complete + Photos
    WE->>NS: Multi-Stakeholder Notification
    NS->>C: Order Complete
    NS->>S: Order Complete
    NS->>D: Order Complete
    NS->>Con: Order Complete
    
    WE->>C: Satisfaction Survey (2hrs later)`}
                      </pre>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-3">Automatic Assignment Rules</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Order confirmed → Assign available shopper</li>
                          <li>• Shopping complete → Assign driver for pickup</li>
                          <li>• Delivery arrival → Notify concierge for handoff</li>
                          <li>• Assignment declined → Auto-reassign to next available</li>
                          <li>• 15-minute acceptance window for all assignments</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Communication Channels</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• <Badge variant="secondary" className="mr-1">SMS</Badge> Critical updates & confirmations</li>
                          <li>• <Badge variant="secondary" className="mr-1">Email</Badge> Detailed order information</li>
                          <li>• <Badge variant="secondary" className="mr-1">Push</Badge> Real-time app notifications</li>
                          <li>• <Badge variant="secondary" className="mr-1">In-App</Badge> Live status updates</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Automated Workflow Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-6 rounded-lg mb-4">
                      <pre className="text-sm overflow-x-auto">
{`graph TB
    A[Order Status Change] --> B[Workflow Engine]
    B --> C{Match Rules?}
    C -->|Yes| D[Execute Actions]
    C -->|No| E[Log Event]
    
    D --> F[Assign Stakeholders]
    D --> G[Send Notifications]
    D --> H[Update Status]
    D --> I[Schedule Follow-up]
    
    subgraph "Notification Channels"
        J[Email]
        K[SMS]
        L[Push Notifications]
        M[In-App Alerts]
    end
    
    G --> J
    G --> K
    G --> L
    G --> M`}
                      </pre>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Automatic Triggers</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Payment confirmation → Auto-assign team</li>
                          <li>• Shopping complete → Notify delivery team</li>
                          <li>• Delivery arrival → Alert concierge</li>
                          <li>• Stocking complete → Customer notification</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Stakeholder Roles</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• <Badge variant="secondary" className="mr-1">Shopper</Badge> Grocery collection</li>
                          <li>• <Badge variant="secondary" className="mr-1">Driver</Badge> Transportation</li>
                          <li>• <Badge variant="secondary" className="mr-1">Concierge</Badge> Final delivery</li>
                          <li>• <Badge variant="secondary" className="mr-1">Manager</Badge> Oversight & escalation</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          <TabsContent value="flowchart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Simple Order Workflow</CardTitle>
                <CardDescription>
                  Simplified visual representation of the order processing flow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-6 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
{`flowchart TD
    A[🛒 Customer Places Order] --> B[💳 Payment Processing]
    B --> C{✅ Payment Successful?}
    C -->|Yes| D[📋 Order Confirmed]
    C -->|No| E[❌ Payment Failed]
    
    D --> F[👥 Assign Team Members]
    F --> G[🛍️ Shopper Collects Items]
    G --> H[📦 Items Packed]
    H --> I[🚚 Driver Picks Up]
    I --> J[🏠 Delivery to Property]
    J --> K[🍽️ Concierge Stocks Kitchen]
    K --> L[🎉 Order Complete]
    
    E --> M[📧 Notify Customer]
    M --> N[🔄 Retry Payment Option]
    
    style A fill:#e3f2fd
    style D fill:#e8f5e8
    style L fill:#f3e5f5
    style E fill:#ffebee
    style F fill:#fff3e0
    style G fill:#f1f8e9
    style H fill:#e0f2f1
    style I fill:#fce4ec
    style J fill:#e8eaf6
    style K fill:#f9fbe7`}
                  </pre>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <div className="text-2xl">🛒</div>
                    <div>
                      <div className="font-medium">Order Placement</div>
                      <div className="text-sm text-muted-foreground">Customer selects items</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <div className="text-2xl">👥</div>
                    <div>
                      <div className="font-medium">Team Assignment</div>
                      <div className="text-sm text-muted-foreground">Auto-assign shopper, driver, concierge</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <div className="text-2xl">🛍️</div>
                    <div>
                      <div className="font-medium">Shopping</div>
                      <div className="text-sm text-muted-foreground">Items collected from store</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <div className="text-2xl">🚚</div>
                    <div>
                      <div className="font-medium">Delivery</div>
                      <div className="text-sm text-muted-foreground">Transport to property</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <div className="text-2xl">🍽️</div>
                    <div>
                      <div className="font-medium">Stocking</div>
                      <div className="text-sm text-muted-foreground">Concierge organizes kitchen</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <div className="text-2xl">🎉</div>
                    <div>
                      <div className="font-medium">Completion</div>
                      <div className="text-sm text-muted-foreground">Order fulfilled successfully</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  External Integrations & APIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-6 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`graph LR
    A[Tulemar Platform] --> B[Payment Gateway]
    A --> C[Email Service]
    A --> D[SMS Provider]
    A --> E[Analytics Service]
    
    B --> F[Stripe API]
    C --> G[SMTP/SendGrid]
    D --> H[Twilio/Similar]
    E --> I[Custom Analytics]
    
    subgraph "Future Integrations"
        J[Inventory APIs]
        K[Logistics Partners]
        L[POS Systems]
    end`}
                  </pre>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Current Integrations</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span>Payment Processing</span>
                        <Badge variant="default">Stripe</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span>Email Notifications</span>
                        <Badge variant="default">Supabase</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span>Real-time Updates</span>
                        <Badge variant="default">WebSockets</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span>File Storage</span>
                        <Badge variant="default">Supabase Storage</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Security & Compliance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span>Authentication</span>
                        <Badge variant="outline">JWT + RLS</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span>Data Encryption</span>
                        <Badge variant="outline">TLS 1.3</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span>Access Control</span>
                        <Badge variant="outline">Role-Based</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span>Data Privacy</span>
                        <Badge variant="outline">GDPR Ready</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ShopLayout>
  );
}