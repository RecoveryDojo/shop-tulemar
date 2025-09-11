import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShopLayout } from '@/components/shop/ShopLayout';
import { 
  Calendar,
  Database,
  Webhook,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Link,
  Building,
  Users,
  FileText,
  Settings
} from 'lucide-react';

const integrationPhases = [
  {
    id: 1,
    title: "API Discovery & Analysis",
    status: "planned",
    priority: "high",
    estimatedWeeks: 2,
    tasks: [
      "Analyze Streamline app API endpoints",
      "Review Tulemar.com integration options",
      "Document existing reservation data structures",
      "Identify authentication mechanisms",
      "Map data relationships and dependencies"
    ],
    deliverables: [
      "API specification document",
      "Data mapping schema",
      "Integration architecture plan"
    ]
  },
  {
    id: 2,
    title: "Real-time Webhook Setup",
    status: "planned",
    priority: "high",
    estimatedWeeks: 3,
    tasks: [
      "Implement webhook endpoints for reservation updates",
      "Set up event-driven architecture",
      "Create data validation and sanitization",
      "Handle rate limiting and error recovery",
      "Implement secure authentication for webhooks"
    ],
    deliverables: [
      "Webhook infrastructure",
      "Event processing system",
      "Error handling mechanisms"
    ]
  },
  {
    id: 3,
    title: "Property Data Synchronization",
    status: "planned",
    priority: "medium",
    estimatedWeeks: 2,
    tasks: [
      "Sync property details and availability",
      "Import guest information and preferences",
      "Map amenities and special requirements",
      "Establish data refresh schedules",
      "Create conflict resolution strategies"
    ],
    deliverables: [
      "Property sync system",
      "Guest data integration",
      "Automated refresh mechanisms"
    ]
  },
  {
    id: 4,
    title: "Automated Order Creation",
    status: "planned",
    priority: "high",
    estimatedWeeks: 4,
    tasks: [
      "Create reservation-to-order mapping logic",
      "Implement smart product recommendations",
      "Set up automatic shopping list generation",
      "Build approval workflows for large orders",
      "Integrate with existing order management"
    ],
    deliverables: [
      "Order automation engine",
      "Recommendation algorithms",
      "Approval workflow system"
    ]
  },
  {
    id: 5,
    title: "Calendar & Timeline Integration",
    status: "planned",
    priority: "medium",
    estimatedWeeks: 2,
    tasks: [
      "Sync arrival/departure dates",
      "Create delivery scheduling automation",
      "Implement buffer time calculations",
      "Set up reminder and notification systems",
      "Build calendar visualization tools"
    ],
    deliverables: [
      "Calendar integration system",
      "Scheduling automation",
      "Notification framework"
    ]
  },
  {
    id: 6,
    title: "Testing & Quality Assurance",
    status: "planned",
    priority: "high",
    estimatedWeeks: 3,
    tasks: [
      "End-to-end integration testing",
      "Performance and load testing",
      "Security and data protection validation",
      "User acceptance testing with stakeholders",
      "Documentation and training materials"
    ],
    deliverables: [
      "Test suite and results",
      "Performance benchmarks",
      "Security audit report",
      "User documentation"
    ]
  }
];

const technicalRequirements = [
  {
    category: "API Integration",
    items: [
      "RESTful API client for Streamline",
      "GraphQL integration for Tulemar.com",
      "OAuth 2.0 authentication handling",
      "Rate limiting and retry mechanisms",
      "Data transformation pipelines"
    ]
  },
  {
    category: "Database Changes",
    items: [
      "New tables for external reservations",
      "Property and guest information schema",
      "Integration logs and audit trails",
      "Data synchronization tracking",
      "Conflict resolution records"
    ]
  },
  {
    category: "Real-time Features",
    items: [
      "Webhook endpoints for live updates",
      "WebSocket connections for UI updates",
      "Event streaming architecture",
      "Push notifications for critical changes",
      "Live dashboard updates"
    ]
  },
  {
    category: "Security & Compliance",
    items: [
      "PII data encryption at rest and in transit",
      "API key management and rotation",
      "Audit logging for all integrations",
      "GDPR compliance for guest data",
      "Rate limiting and DDoS protection"
    ]
  }
];

const businessBenefits = [
  {
    title: "Automated Workflow",
    description: "Eliminate manual order creation from reservations",
    impact: "80% reduction in manual work"
  },
  {
    title: "Improved Accuracy",
    description: "Reduce errors from manual data entry",
    impact: "95% accuracy improvement"
  },
  {
    title: "Enhanced Guest Experience",
    description: "Seamless service delivery based on real reservation data",
    impact: "40% faster service delivery"
  },
  {
    title: "Real-time Visibility",
    description: "Live updates on reservations and delivery schedules",
    impact: "100% real-time tracking"
  },
  {
    title: "Scalable Operations",
    description: "Handle increased volume without proportional staff increases",
    impact: "300% capacity growth potential"
  }
];

export default function IntegrationPlan() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'planned': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const totalWeeks = integrationPhases.reduce((sum, phase) => sum + phase.estimatedWeeks, 0);
  const completedPhases = integrationPhases.filter(p => p.status === 'completed').length;
  const progressPercentage = (completedPhases / integrationPhases.length) * 100;

  return (
    <ShopLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Streamline & Tulemar Integration Plan</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Strategic roadmap for integrating house reservation data from Streamline app and tulemar.com 
            to automate order creation and enhance guest experience in our MVP v2.
          </p>
          
          {/* Overall Progress */}
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
                <Progress value={progressPercentage} className="mb-2" />
                <div className="text-sm text-muted-foreground">
                  {completedPhases} of {integrationPhases.length} phases complete
                </div>
                <div className="text-sm font-medium">
                  Estimated Timeline: {totalWeeks} weeks
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Phases */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Integration Phases
          </h2>
          
          <div className="grid gap-6">
            {integrationPhases.map((phase, index) => (
              <Card key={phase.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${getStatusColor(phase.status)} text-white flex items-center justify-center text-sm font-bold`}>
                          {phase.id}
                        </div>
                        <CardTitle className="text-xl">{phase.title}</CardTitle>
                        <Badge variant={getPriorityColor(phase.priority)}>
                          {phase.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {phase.estimatedWeeks} weeks
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(phase.status)}`} />
                          {phase.status.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Key Tasks
                    </h4>
                    <ul className="space-y-1">
                      {phase.tasks.map((task, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Deliverables
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {phase.deliverables.map((deliverable, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {deliverable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
                
                {index < integrationPhases.length - 1 && (
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-background border rounded-full p-1">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Technical Requirements
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {technicalRequirements.map((req, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{req.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {req.items.map((item, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Benefits */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Expected Business Benefits
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {businessBenefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{benefit.description}</p>
                  <Badge variant="secondary" className="font-medium">
                    {benefit.impact}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Next Steps for Implementation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Immediate Actions (Next 2 weeks)</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Reach out to Streamline API team for documentation</li>
                  <li>• Contact Tulemar.com technical team for integration specs</li>
                  <li>• Begin Phase 1: API Discovery & Analysis</li>
                  <li>• Set up development environment for testing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Preparation Requirements</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Secure API access credentials from both platforms</li>
                  <li>• Set up staging environment for safe testing</li>
                  <li>• Allocate dedicated development resources</li>
                  <li>• Plan user training for new automated features</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ShopLayout>
  );
}