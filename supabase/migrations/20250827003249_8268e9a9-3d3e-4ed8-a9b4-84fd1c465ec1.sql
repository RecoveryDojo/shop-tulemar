-- Add next 15 features to the work tracker project
INSERT INTO public.features (
  project_id, 
  name, 
  description, 
  priority, 
  estimated_hours, 
  actual_hours, 
  completion_percentage,
  order_index
) VALUES 
-- Phase 3 Continuation (Next 5)
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Real-time Collaboration System',
  'Live editing, team communication, real-time cursors, and conflict resolution for seamless team collaboration',
  'high',
  95,
  0,
  0,
  1
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Advanced Project Templates',
  'Industry-specific templates, customizable workflows, and template marketplace for quick project setup',
  'medium',
  65,
  0,
  0,
  2
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Resource Management & Capacity Planning',
  'Team workload balancing, skill-based task assignment, and resource forecasting for optimal productivity',
  'high',
  80,
  0,
  0,
  3
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Advanced Time Tracking & Billing',
  'Automated time capture, billable hours tracking, invoice generation, and comprehensive client reporting',
  'high',
  70,
  0,
  0,
  4
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Custom Workflow Engine',
  'Drag-and-drop workflow builder, approval processes, and automation rules for custom business processes',
  'medium',
  90,
  0,
  0,
  5
),
-- Phase 4 (Next 5)
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Integration Hub',
  'Slack, Microsoft Teams, Jira, GitHub, and 50+ third-party integrations for seamless workflow connectivity',
  'high',
  100,
  0,
  0,
  6
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Mobile App',
  'iOS/Android apps with offline sync, push notifications, and mobile-optimized interfaces for on-the-go management',
  'high',
  120,
  0,
  0,
  7
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Advanced Security & Compliance',
  'SSO, 2FA, audit logs, GDPR compliance, and enterprise security features for enterprise-grade protection',
  'critical',
  85,
  0,
  0,
  8
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Portfolio Management',
  'Multi-project dashboards, cross-project resource allocation, and portfolio analytics for executive oversight',
  'medium',
  75,
  0,
  0,
  9
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Client Portal',
  'Client-facing dashboards, progress sharing, feedback collection, and approval workflows for client engagement',
  'medium',
  65,
  0,
  0,
  10
),
-- Phase 5 (Next 5)
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Advanced Reporting & BI',
  'Custom report builder, executive dashboards, predictive analytics, and data visualization for business intelligence',
  'medium',
  110,
  0,
  0,
  11
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'AI Project Assistant',
  'Smart task suggestions, risk prediction, deadline optimization, and automated status updates powered by AI',
  'low',
  130,
  0,
  0,
  12
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Enterprise API & Webhooks',
  'REST/GraphQL APIs, webhook system, and developer tools for custom integrations and third-party development',
  'medium',
  95,
  0,
  0,
  13
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'White-label Solution',
  'Custom branding, domain mapping, multi-tenant architecture, and reseller capabilities for business scaling',
  'low',
  140,
  0,
  0,
  14
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Advanced Automation',
  'Smart notifications, auto-task creation, dependency management, and workflow triggers for intelligent automation',
  'medium',
  105,
  0,
  0,
  15
);