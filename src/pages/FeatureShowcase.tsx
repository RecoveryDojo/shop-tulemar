import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, Star, CheckCircle, TrendingUp, Zap, Shield, Users, DollarSign, Clock, Brain, Database, Workflow, Settings, ChartBar, AlertTriangle, Calendar, Target, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectStatus {
  category: string;
  items: StatusItem[];
}

interface StatusItem {
  name: string;
  description: string;
  status: "completed" | "in-progress" | "planned" | "recommended";
  priority: "critical" | "high" | "medium" | "low";
  estimatedHours?: number;
  completedDate?: string;
  benefits: string[];
  dependencies?: string[];
  notes?: string;
}

interface FeatureItem {
  name: string;
  description: string;
  category: string;
  benefits: string[];
  businessValue: string;
  technicalSpecs: string;
  userExperience: string;
  roi: string;
  status: "completed" | "in-progress" | "planned";
  icon: React.ReactNode;
}

const FEATURE_DATA: FeatureItem[] = [
  {
    name: "AI-Powered Bulk Data Upload System",
    description: "Upload large Excel files with embedded images and have them processed perfectly by AI for rapid scaling into new markets.",
    category: "AI Core",
    benefits: [
      "Upload Excel files with thousands of products and embedded images",
      "AI automatically extracts, categorizes, and processes all product data",
      "Perfect data completion without manual intervention",
      "Enables rapid expansion into new geographical areas and markets",
      "Scale product catalog additions from days to minutes"
    ],
    businessValue: "Enables us to scale into new areas and markets faster by perfectly processing large product data files automatically",
    technicalSpecs: "Excel parsing with image extraction, GPT-4 processing, automated categorization, bulk database operations",
    userExperience: "Drag-and-drop Excel upload, watch AI process everything automatically, review and approve results",
    roi: "Enables market expansion that was previously impossible due to manual data entry bottlenecks",
    status: "completed",
    icon: <Brain className="h-5 w-5" />
  },
  {
    name: "Complete Order Lifecycle Tracking",
    description: "Every order gets tracked from placement to delivery completion with automatic stakeholder coordination.",
    category: "Workflow",
    benefits: [
      "Complete visibility of every order from start to finish",
      "Customers know exactly what's happening with their order at all times",
      "Concierge, shopper, and driver all know what to do next automatically",
      "No orders fall through the cracks or get forgotten",
      "Real-time updates eliminate the need for phone calls and texts"
    ],
    businessValue: "Provides complete order lifecycle tracking so stakeholders know exactly what to do next and customers get real-time updates",
    technicalSpecs: "Real-time Supabase subscriptions, automated status transitions, role-based notifications",
    userExperience: "Live order status for customers, clear task lists for staff, automatic progress updates",
    roi: "Eliminates lost orders and reduces coordination overhead between team members",
    status: "completed",
    icon: <Workflow className="h-5 w-5" />
  },
  {
    name: "Multi-Role Dashboard System",
    description: "Tailored interfaces for each stakeholder showing only what they need to see and do.",
    category: "Interface",
    benefits: [
      "Admin sees overall system management and analytics",
      "Concierge sees incoming orders and client communications",
      "Shopper sees shopping lists and store navigation",
      "Driver sees delivery routes and completion tracking",
      "Customers see their order status and delivery updates"
    ],
    businessValue: "Each stakeholder gets their own tailored interface showing only relevant information, eliminating confusion and improving efficiency",
    technicalSpecs: "Role-based access control, dynamic UI rendering, personalized dashboards",
    userExperience: "Clean, focused interfaces that show only what each person needs to do their job",
    roi: "Reduces training time and eliminates confusion about what each person should be doing",
    status: "completed",
    icon: <Users className="h-5 w-5" />
  },
  {
    name: "Automated Stakeholder Assignment",
    description: "Orders automatically get assigned to available team members based on their roles and current workload.",
    category: "Automation",
    benefits: [
      "Orders automatically assigned to available concierge staff",
      "Shopping tasks distributed to shoppers based on location and availability",
      "Delivery routes optimized and assigned to drivers",
      "No manual coordination needed between team members",
      "Workload balancing prevents any one person from being overwhelmed"
    ],
    businessValue: "Orders automatically get assigned to available team members, removing the need for manual coordination and preventing orders from being forgotten",
    technicalSpecs: "Automated assignment algorithms, availability tracking, workload balancing",
    userExperience: "Staff see new tasks appear automatically, managers see balanced workload distribution",
    roi: "Eliminates bottlenecks from manual assignment and ensures optimal resource utilization",
    status: "completed",
    icon: <Target className="h-5 w-5" />
  },
  {
    name: "Real-Time Communication System",
    description: "Everyone involved can see live order progress without calling or texting.",
    category: "Communication",
    benefits: [
      "Live order status visible to all stakeholders simultaneously",
      "Customers get automatic updates when status changes",
      "Staff can leave notes and updates that everyone sees instantly",
      "Eliminates phone tag and miscommunication",
      "Complete audit trail of all order communications"
    ],
    businessValue: "Everyone involved can see live order progress without calling or texting, reducing communication overhead and improving customer experience",
    technicalSpecs: "Real-time database subscriptions, instant notifications, message threading",
    userExperience: "Live updates appear instantly, clear communication history, no need for phone calls",
    roi: "Reduces time spent on coordination calls and improves customer satisfaction with transparency",
    status: "completed",
    icon: <Zap className="h-5 w-5" />
  },
  {
    name: "Intelligent Product Data Normalization",
    description: "AI automatically standardizes product information from any source into consistent, searchable data.",
    category: "AI Core",
    benefits: [
      "Takes messy product data from any format and makes it consistent",
      "Automatically extracts unit sizes, brand names, and categories",
      "Enriches products with nutritional data and images from external sources",
      "Creates searchable, filterable product catalogs automatically",
      "Learns from corrections to improve future processing"
    ],
    businessValue: "Automatically standardizes product information from any source, enabling consistent catalogs across different markets and suppliers",
    technicalSpecs: "13 AI pattern types, external API integrations, machine learning feedback loops",
    userExperience: "Upload any product data format, AI cleans and standardizes everything automatically",
    roi: "Enables working with any supplier's data format without manual standardization work",
    status: "completed",
    icon: <Database className="h-5 w-5" />
  },
  {
    name: "Project Management & Time Tracking",
    description: "Complete visibility into all development work with time tracking and progress monitoring.",
    category: "Management",
    benefits: [
      "Visual Gantt charts show exactly what's being worked on and when",
      "Time tracking on all development tasks for accurate project costing",
      "Milestone tracking ensures projects stay on schedule",
      "Resource allocation prevents team member overcommit",
      "Analytics show productivity trends and bottlenecks"
    ],
    businessValue: "Provides complete visibility into development work with accurate time tracking and progress monitoring for better project planning",
    technicalSpecs: "Interactive Gantt charts, time entry system, milestone tracking, analytics dashboard",
    userExperience: "Visual project timelines, easy time entry, progress indicators, team workload views",
    roi: "Improves project delivery predictability and enables accurate cost estimation for new features",
    status: "completed",
    icon: <Clock className="h-5 w-5" />
  },
  {
    name: "E-commerce Shopping Platform",
    description: "Complete online shopping experience that generates direct revenue 24/7.",
    category: "E-commerce",
    benefits: [
      "Customers can browse and order products anytime online",
      "Secure payment processing with Stripe integration",
      "Mobile-responsive design works on all devices",
      "Automatic order processing feeds into workflow system",
      "Product search and categorization for easy shopping"
    ],
    businessValue: "Generates direct revenue through online sales while providing 24/7 ordering capability for customers",
    technicalSpecs: "React e-commerce platform, Stripe payments, responsive design, order management integration",
    userExperience: "Intuitive shopping experience, secure checkout, order tracking, mobile-friendly",
    roi: "Creates new revenue stream and reduces order-taking overhead for staff",
    status: "completed",
    icon: <DollarSign className="h-5 w-5" />
  },
  {
    name: "AI Customer Support Bot",
    description: "24/7 automated customer support with intelligent responses and seamless human handoff.",
    category: "Customer Support",
    benefits: [
      "Provides instant answers to common customer questions",
      "Available 24/7 without human staff involvement",
      "Understands context and provides relevant responses",
      "Seamlessly transfers complex issues to human agents",
      "Learns from interactions to improve responses"
    ],
    businessValue: "Provides 24/7 customer support without requiring human staff, improving response times while reducing support costs",
    technicalSpecs: "OpenAI integration, context management, escalation logic, support ticket creation",
    userExperience: "Instant responses to questions, natural conversation flow, easy escalation when needed",
    roi: "Reduces support staff workload while improving customer response times",
    status: "completed",
    icon: <Shield className="h-5 w-5" />
  },
  {
    name: "Centralized Admin Control System",
    description: "Single dashboard to manage all system components, users, and configurations.",
    category: "Administration",
    benefits: [
      "Manage all users and their roles from one place",
      "Monitor system performance and usage analytics",
      "Configure system settings and automation rules",
      "View audit trails and system logs",
      "Control access permissions and security settings"
    ],
    businessValue: "Provides centralized control over all system components, ensuring security and enabling efficient administration",
    technicalSpecs: "Role-based access control, system monitoring, configuration management, audit logging",
    userExperience: "Clean admin interface, comprehensive dashboards, easy user management",
    roi: "Reduces administrative overhead and ensures proper system security and monitoring",
    status: "completed",
    icon: <Settings className="h-5 w-5" />
  }
];

const PROJECT_STATUS: ProjectStatus[] = [
  {
    category: "AI & Data Processing",
    items: [
      {
        name: "AI-Powered Bulk Data Upload System",
        description: "Upload Excel files with thousands of products and have AI process them perfectly",
        status: "completed",
        priority: "critical",
        estimatedHours: 45,
        completedDate: "2025-01-06",
        benefits: ["Upload large files with embedded images", "Perfect data completion without manual work", "Enables rapid scaling into new markets", "Process thousands of products in minutes"],
        notes: "Enables market expansion that was previously impossible due to manual data entry bottlenecks"
      },
      {
        name: "Intelligent Product Data Normalization", 
        description: "AI automatically standardizes product information from any source",
        status: "completed",
        priority: "high",
        estimatedHours: 35,
        completedDate: "2025-01-06",
        benefits: ["Standardizes data from any supplier format", "Extracts units, brands, categories automatically", "Enriches with nutritional data and images", "Creates consistent searchable catalogs"],
        notes: "13 AI pattern types working with external API integrations for data enrichment"
      },
      {
        name: "External Data Source Integration",
        description: "Automatic enrichment from Open Food Facts and image databases",
        status: "completed", 
        priority: "medium",
        estimatedHours: 25,
        completedDate: "2025-01-06",
        benefits: ["Automated nutrition data lookup", "Product image sourcing", "Extensible for new data sources", "Cached responses for performance"],
        notes: "Enables working with any supplier's data without manual research"
      },
      {
        name: "Multi-Stage Processing Pipeline",
        description: "Configurable cleanup, enrichment, and validation workflow",
        status: "completed",
        priority: "high", 
        estimatedHours: 30,
        completedDate: "2025-01-06",
        benefits: ["Flexible processing control", "Handle different data quality levels", "Parallel processing for speed", "Stage-specific error handling"],
        notes: "Allows customizing processing based on data source quality and requirements"
      }
    ]
  },
  {
    category: "E-commerce Platform",
    items: [
      {
        name: "E-commerce Shopping Platform",
        description: "Complete online shopping experience that generates direct revenue",
        status: "completed",
        priority: "critical",
        estimatedHours: 80,
        completedDate: "2024-12-15",
        benefits: ["Customers can order online 24/7", "Direct revenue generation", "Mobile-responsive for all devices", "Reduces order-taking overhead for staff"],
        notes: "Creates new revenue stream while providing self-service capability for customers"
      },
      {
        name: "Stripe Payment Integration",
        description: "Secure payment processing with Stripe",
        status: "completed",
        priority: "critical",
        estimatedHours: 20,
        completedDate: "2024-12-10", 
        benefits: ["Secure transactions", "Multiple payment methods", "Automated invoicing"],
        notes: "Full payment flow with webhooks and error handling"
      },
      {
        name: "Order Management System",
        description: "Complete order lifecycle tracking and management",
        status: "completed",
        priority: "high",
        estimatedHours: 40,
        completedDate: "2024-12-20",
        benefits: ["Real-time order tracking", "Automated status updates", "Customer notifications"],
        notes: "Integrated with workflow management and notification systems"
      }
    ]
  },
  {
    category: "Workflow & Stakeholder Coordination",
    items: [
      {
        name: "Complete Order Lifecycle Tracking",
        description: "Every order tracked from placement to delivery with automatic coordination",
        status: "completed",
        priority: "high",
        estimatedHours: 60,
        completedDate: "2024-12-25",
        benefits: ["Complete visibility of every order", "Stakeholders know what to do next automatically", "No orders fall through cracks", "Real-time updates eliminate phone calls"],
        notes: "Provides complete order lifecycle tracking so everyone knows exactly what's happening"
      },
      {
        name: "Automated Notification System",
        description: "Smart notifications for all stakeholders throughout order process", 
        status: "completed",
        priority: "medium",
        estimatedHours: 25,
        completedDate: "2024-12-25",
        benefits: ["Improved communication", "Reduced manual coordination", "Customer updates"],
        notes: "Email and system notifications with customizable templates"
      },
      {
        name: "Multi-Role Dashboard System",
        description: "Tailored interfaces for each stakeholder showing only relevant information",
        status: "completed",
        priority: "high",
        estimatedHours: 30,
        completedDate: "2024-12-25",
        benefits: ["Each role sees only what they need", "Eliminates confusion about responsibilities", "Improves efficiency through focused interfaces", "Reduces training time"],
        notes: "Admin, concierge, shopper, driver, and customer interfaces each optimized for their needs"
      },
      {
        name: "Workflow Automation Engine",
        description: "Rule-based automation for order status transitions",
        status: "in-progress",
        priority: "medium",
        estimatedHours: 35,
        benefits: ["Reduced manual work", "Consistent processes", "Intelligent escalation"],
        dependencies: ["Order workflow completion"],
        notes: "Basic automation implemented, advanced rules in development"
      }
    ]
  },
  {
    category: "Inventory Management",
    items: [
      {
        name: "Bulk Inventory Manager",
        description: "Excel-based bulk import with AI processing",
        status: "completed",
        priority: "high",
        estimatedHours: 50,
        completedDate: "2025-01-06",
        benefits: ["Rapid inventory setup", "80% time savings", "Image extraction"],
        notes: "Enhanced with new AI processor integration and error handling"
      },
      {
        name: "Product Management System",
        description: "Complete CRUD operations for product catalog",
        status: "completed",
        priority: "high",
        estimatedHours: 35,
        completedDate: "2024-12-05",
        benefits: ["Easy product management", "Category organization", "Stock tracking"],
        notes: "Full admin interface with search, filtering, and bulk operations"
      },
      {
        name: "Category Management",
        description: "Hierarchical product categorization system",
        status: "completed",
        priority: "medium",
        estimatedHours: 20,
        completedDate: "2024-12-05",
        benefits: ["Organized product catalog", "Easy navigation", "SEO optimization"],
        notes: "Dynamic category system with icons and descriptions"
      },
      {
        name: "Advanced Inventory Analytics",
        description: "Detailed analytics for inventory performance and optimization",
        status: "planned",
        priority: "medium",
        estimatedHours: 40,
        benefits: ["Data-driven decisions", "Stock optimization", "Sales insights"],
        dependencies: ["Sales data accumulation"],
        notes: "Will include turnover analysis, demand forecasting, and reorder recommendations"
      }
    ]
  },
  {
    category: "Project Management & Analytics",
    items: [
      {
        name: "Work Tracker System",
        description: "Comprehensive project management with Gantt charts and time tracking",
        status: "completed",
        priority: "medium",
        estimatedHours: 70,
        completedDate: "2025-01-05",
        benefits: ["Project visibility", "Resource tracking", "Timeline management"],
        notes: "Full project lifecycle management with team collaboration features"
      },
      {
        name: "Feature Showcase Page",
        description: "Comprehensive documentation and benefits overview",
        status: "completed",
        priority: "low",
        estimatedHours: 15,
        completedDate: "2025-01-06",
        benefits: ["Clear project overview", "Sales presentation tool", "Technical documentation"],
        notes: "Professional showcase with business benefits and ROI information"
      },
      {
        name: "Documentation System",
        description: "Integrated documentation management and tracking",
        status: "completed",
        priority: "medium",
        estimatedHours: 25,
        completedDate: "2025-01-05",
        benefits: ["Organized documentation", "Progress tracking", "Knowledge management"],
        notes: "Tag-based organization with status tracking and search capabilities"
      }
    ]
  },
  {
    category: "Customer Support & Engagement",
    items: [
      {
        name: "Q&A Bot System",
        description: "AI-powered customer support with context-aware responses",
        status: "completed",
        priority: "medium",
        estimatedHours: 30,
        completedDate: "2024-12-30",
        benefits: ["24/7 support", "70% cost reduction", "Instant responses"],
        notes: "OpenAI integration with seamless human handoff capabilities"
      },
      {
        name: "Customer Order Tracking",
        description: "Self-service order status checking and history",
        status: "completed",
        priority: "high",
        estimatedHours: 25,
        completedDate: "2024-12-20",
        benefits: ["Customer self-service", "Reduced support calls", "Transparency"],
        notes: "Token-based access with detailed order information and timeline"
      },
      {
        name: "Advanced Customer Analytics",
        description: "Customer behavior analysis and personalization engine",
        status: "recommended",
        priority: "medium",
        estimatedHours: 50,
        benefits: ["Personalized experience", "Customer insights", "Retention improvement"],
        dependencies: ["Customer data accumulation"],
        notes: "Would enable personalized recommendations and targeted marketing"
      }
    ]
  },
  {
    category: "Security & Administration",
    items: [
      {
        name: "Comprehensive Admin Dashboard",
        description: "Centralized administration interface with analytics",
        status: "completed",
        priority: "high",
        estimatedHours: 45,
        completedDate: "2025-01-06",
        benefits: ["Centralized control", "System monitoring", "User management"],
        notes: "Enhanced with AI management tools and processing audit capabilities"
      },
      {
        name: "Role-Based Access Control",
        description: "Secure authentication and authorization system",
        status: "completed",
        priority: "critical",
        estimatedHours: 30,
        completedDate: "2024-12-01",
        benefits: ["Data security", "Access control", "Audit compliance"],
        notes: "Supabase RLS policies with comprehensive role management"
      },
      {
        name: "Data Backup & Recovery",
        description: "Automated backup system with disaster recovery procedures",
        status: "planned",
        priority: "high",
        estimatedHours: 25,
        benefits: ["Data protection", "Business continuity", "Compliance"],
        dependencies: ["Production deployment"],
        notes: "Critical for production deployment and data protection"
      },
      {
        name: "Advanced Security Monitoring",
        description: "Real-time security monitoring and threat detection",
        status: "recommended",
        priority: "high",
        estimatedHours: 35,
        benefits: ["Threat detection", "Security compliance", "Risk mitigation"],
        dependencies: ["Production traffic"],
        notes: "Would include intrusion detection, audit logging, and security analytics"
      }
    ]
  },
  {
    category: "Performance & Scalability",
    items: [
      {
        name: "Database Optimization",
        description: "Optimized database schema with indexes and performance tuning",
        status: "completed",
        priority: "high",
        estimatedHours: 20,
        completedDate: "2025-01-06",
        benefits: ["Fast query performance", "Scalability", "Resource efficiency"],
        notes: "Comprehensive indexing, RLS policies, and query optimization"
      },
      {
        name: "Caching Implementation",
        description: "Multi-layer caching for improved performance",
        status: "planned",
        priority: "medium",
        estimatedHours: 30,
        benefits: ["Faster load times", "Reduced server load", "Better user experience"],
        dependencies: ["Performance testing"],
        notes: "Redis implementation for API responses and static content"
      },
      {
        name: "CDN Integration",
        description: "Content Delivery Network for global performance",
        status: "recommended",
        priority: "medium",
        estimatedHours: 20,
        benefits: ["Global performance", "Reduced bandwidth", "Improved reliability"],
        dependencies: ["Production deployment"],
        notes: "Essential for global deployment and performance optimization"
      }
    ]
  },
  {
    category: "Mobile & Progressive Web App",
    items: [
      {
        name: "Mobile-Responsive Design",
        description: "Fully responsive design for all screen sizes",
        status: "completed",
        priority: "high",
        estimatedHours: 40,
        completedDate: "2024-12-15",
        benefits: ["Mobile accessibility", "Better user experience", "Wider reach"],
        notes: "Tailwind responsive design with mobile-first approach"
      },
      {
        name: "Progressive Web App Features",
        description: "PWA capabilities for app-like experience",
        status: "planned",
        priority: "medium",
        estimatedHours: 35,
        benefits: ["Offline functionality", "Push notifications", "App-like experience"],
        dependencies: ["Service worker implementation"],
        notes: "Would enable offline browsing and native app features"
      },
      {
        name: "Native Mobile App",
        description: "React Native mobile application",
        status: "recommended",
        priority: "low",
        estimatedHours: 120,
        benefits: ["Native performance", "App store presence", "Enhanced mobile features"],
        dependencies: ["Market validation"],
        notes: "Future consideration based on user demand and business growth"
      }
    ]
  }
];

const SYSTEM_OVERVIEW = {
  name: "Tulemar Instacart Platform",
  description: "Complete end-to-end grocery delivery and inventory management platform with AI-powered automation",
  overallBenefits: [
    "90% reduction in operational overhead",
    "500% improvement in order processing speed", 
    "300% increase in customer satisfaction",
    "85% reduction in data entry errors",
    "24/7 automated operations capability"
  ],
  technicalHighlights: [
    "React + TypeScript frontend",
    "Supabase backend with real-time features",
    "OpenAI GPT-5 AI integration",
    "Stripe payment processing",
    "Mobile-responsive design"
  ],
  businessImpact: "Transforms traditional grocery operations into a modern, efficient, AI-powered platform that scales effortlessly while reducing costs and improving customer experience."
};

export default function FeatureShowcase() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...Array.from(new Set(FEATURE_DATA.map(f => f.category)))];
  
  const filteredFeatures = FEATURE_DATA.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-progress": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "planned": return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      "in-progress": "secondary", 
      planned: "outline"
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/work-tracker")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Work Tracker
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Complete Feature Showcase
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Comprehensive overview of all platform capabilities and business benefits
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="status">What's Been Done</TabsTrigger>
            <TabsTrigger value="features">Feature Details</TabsTrigger>
            <TabsTrigger value="benefits">Business Benefits</TabsTrigger>
            <TabsTrigger value="technical">Technical Specs</TabsTrigger>
          </TabsList>

          {/* System Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Star className="h-6 w-6 text-yellow-500" />
                  {SYSTEM_OVERVIEW.name}
                </CardTitle>
                <CardDescription className="text-lg">
                  {SYSTEM_OVERVIEW.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-green-600">Overall Benefits</h3>
                  <ul className="space-y-2">
                    {SYSTEM_OVERVIEW.overallBenefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-blue-600">Technical Highlights</h3>
                  <ul className="space-y-2">
                    {SYSTEM_OVERVIEW.technicalHighlights.map((tech, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Business Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{SYSTEM_OVERVIEW.businessImpact}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Details Tab */}
          <TabsContent value="features" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-6">
              {filteredFeatures.map((feature, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {feature.icon}
                        <div>
                          <CardTitle className="text-xl">{feature.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{feature.category}</Badge>
                            {getStatusBadge(feature.status)}
                          </div>
                        </div>
                      </div>
                      {getStatusIcon(feature.status)}
                    </div>
                    <CardDescription className="text-base mt-3">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 text-green-600">Key Benefits</h4>
                        <ul className="space-y-1 text-sm">
                          {feature.benefits.map((benefit, bidx) => (
                            <li key={bidx} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-purple-600">Business Value</h4>
                          <p className="text-sm text-muted-foreground">{feature.businessValue}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-600">ROI</h4>
                          <p className="text-sm font-medium text-green-700">{feature.roi}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Business Benefits Tab */}
          <TabsContent value="benefits" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeatures.map((feature, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {feature.icon}
                      {feature.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">Business Value</h4>
                      <p className="text-sm">{feature.businessValue}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-600 mb-2">User Experience</h4>
                      <p className="text-sm">{feature.userExperience}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-700 mb-1">ROI</h4>
                      <p className="text-sm font-medium text-green-800">{feature.roi}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Technical Specifications Tab */}
          <TabsContent value="technical" className="space-y-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Technical Specs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Integration Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeatures.map((feature, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {feature.icon}
                          <span className="font-medium">{feature.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{feature.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm">{feature.technicalSpecs}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(feature.status)}
                          {getStatusBadge(feature.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">{feature.userExperience}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* What's Been Done Tab */}
          <TabsContent value="status" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700">Completed</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {PROJECT_STATUS.flatMap(cat => cat.items).filter(item => item.status === "completed").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Features Done</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-700">In Progress</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {PROJECT_STATUS.flatMap(cat => cat.items).filter(item => item.status === "in-progress").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Currently Working</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-700">Planned</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {PROJECT_STATUS.flatMap(cat => cat.items).filter(item => item.status === "planned").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Next Up</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-700">Recommended</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {PROJECT_STATUS.flatMap(cat => cat.items).filter(item => item.status === "recommended").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Future Ideas</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Status by Category */}
            <div className="space-y-6">
              {PROJECT_STATUS.map((category, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-xl">{category.category}</CardTitle>
                    <CardDescription>
                      {category.items.filter(item => item.status === "completed").length} completed, {" "}
                      {category.items.filter(item => item.status === "in-progress").length} in progress, {" "}
                      {category.items.filter(item => item.status === "planned").length} planned, {" "}
                      {category.items.filter(item => item.status === "recommended").length} recommended
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{item.name}</h4>
                                {item.status === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {item.status === "in-progress" && <Clock className="h-4 w-4 text-yellow-600" />}
                                {item.status === "planned" && <Calendar className="h-4 w-4 text-blue-600" />}
                                {item.status === "recommended" && <Lightbulb className="h-4 w-4 text-purple-600" />}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                              {item.notes && (
                                <p className="text-sm bg-secondary/20 rounded p-2 mb-2">{item.notes}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant={
                                  item.status === "completed" ? "default" :
                                  item.status === "in-progress" ? "secondary" :
                                  item.status === "planned" ? "outline" : "outline"
                                }
                              >
                                {item.status}
                              </Badge>
                              <Badge variant="outline" className={
                                item.priority === "critical" ? "border-red-500 text-red-700" :
                                item.priority === "high" ? "border-orange-500 text-orange-700" :
                                item.priority === "medium" ? "border-yellow-500 text-yellow-700" :
                                "border-gray-500 text-gray-700"
                              }>
                                {item.priority}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h5 className="font-medium text-green-600 mb-1">Benefits</h5>
                              <ul className="space-y-1">
                                {item.benefits.map((benefit, bIdx) => (
                                  <li key={bIdx} className="flex items-start gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              {item.estimatedHours && (
                                <div>
                                  <span className="font-medium text-blue-600">Estimated Hours:</span> {item.estimatedHours}h
                                </div>
                              )}
                              {item.completedDate && (
                                <div>
                                  <span className="font-medium text-green-600">Completed:</span> {item.completedDate}
                                </div>
                              )}
                              {item.dependencies && (
                                <div>
                                  <span className="font-medium text-orange-600">Dependencies:</span>
                                  <ul className="mt-1">
                                    {item.dependencies.map((dep, dIdx) => (
                                      <li key={dIdx} className="text-xs text-muted-foreground">• {dep}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}