-- Add comprehensive multi-phase development plan for client presentation
-- Phase 1: MVP + Development Environment
INSERT INTO features (project_id, name, description, priority, estimated_hours, actual_hours, completion_percentage) VALUES 
((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Phase 1: Development Environment Setup', 
'Complete GitHub integration, CI/CD pipeline, staging environment, and client hosting capabilities for seamless deployment and testing', 
'critical', 
80, 
20, 
25),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Phase 1: MVP Core Features', 
'Essential e-commerce functionality including product catalog, shopping cart, checkout, payment processing, and basic user management', 
'critical', 
200, 
165, 
82),

-- Phase 2: SaaS/Multi-tenant Features
((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Phase 2: Multi-tenant Architecture', 
'Enterprise-grade multi-tenant system allowing multiple properties/clients to use the same platform with isolated data and custom branding', 
'high', 
150, 
0, 
0),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Phase 2: Advanced SaaS Features', 
'Subscription management, tenant onboarding, custom domain mapping, white-label solutions, and enterprise billing systems', 
'high', 
120, 
0, 
0),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Phase 2: Enterprise Analytics & Reporting', 
'Advanced analytics dashboard, multi-tenant reporting, revenue optimization tools, and business intelligence features', 
'medium', 
90, 
0, 
0),

-- Phase 3: Expansion Features
((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Phase 3: Advanced Market Expansion', 
'Multi-language support, international payment gateways, currency conversion, and region-specific compliance features', 
'medium', 
100, 
0, 
0),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Phase 3: AI-Powered Enhancements', 
'Machine learning recommendations, predictive inventory, AI customer service, automated demand forecasting, and intelligent pricing', 
'medium', 
110, 
0, 
0),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Phase 3: Enterprise Integrations', 
'ERP system connections, POS integration, advanced CRM, supply chain management, and third-party marketplace syndication', 
'low', 
80, 
0, 
0);

-- Phase 1: Development Environment Setup Tasks
INSERT INTO tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date) VALUES

-- Development Environment Tasks
((SELECT id FROM features WHERE name = 'Phase 1: Development Environment Setup'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'GitHub Repository Setup & Integration', 
 'Configure GitHub repository with proper branching strategy, code review processes, and documentation standards',
 'done', 'critical', 8, 8, '2024-11-20'),

((SELECT id FROM features WHERE name = 'Phase 1: Development Environment Setup'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'CI/CD Pipeline Development', 
 'Build automated testing, deployment pipelines, and quality assurance workflows using GitHub Actions',
 'in_progress', 'critical', 20, 8, '2025-01-15'),

((SELECT id FROM features WHERE name = 'Phase 1: Development Environment Setup'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Staging Environment Configuration', 
 'Set up staging server with identical production environment for client testing and approval',
 'todo', 'critical', 15, 0, '2025-01-20'),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Production Deployment Setup', 
 'Configure production hosting, SSL certificates, CDN, monitoring, and backup systems',
 'todo', 'critical', 18, 2, '2025-01-25'),

((SELECT id FROM features WHERE name = 'Phase 1: Development Environment Setup'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Client Hosting Integration', 
 'Enable seamless hosting on client domain with custom DNS, subdomain mapping, and branded deployment',
 'todo', 'high', 12, 2, '2025-01-30'),

((SELECT id FROM features WHERE name = 'Phase 1: Development Environment Setup'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Monitoring & Analytics Setup', 
 'Implement error tracking, performance monitoring, uptime monitoring, and usage analytics',
 'backlog', 'medium', 7, 0, '2025-02-05'),

-- Phase 1: MVP Core Features Tasks
((SELECT id FROM features WHERE name = 'Phase 1: MVP Core Features'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'MVP Product Launch Preparation', 
 'Final QA testing, performance optimization, security review, and launch readiness checklist',
 'in_progress', 'critical', 25, 15, '2025-01-31'),

((SELECT id FROM features WHERE name = 'Phase 1: MVP Core Features'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Client Training & Documentation', 
 'Create comprehensive admin training, user guides, and operational documentation',
 'todo', 'high', 20, 5, '2025-02-10'),

((SELECT id FROM features WHERE name = 'Phase 1: MVP Core Features'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'MVP Support Infrastructure', 
 'Set up customer support systems, ticketing, and maintenance protocols',
 'todo', 'medium', 15, 0, '2025-02-15'),

-- Phase 2: Multi-tenant Architecture Tasks
((SELECT id FROM features WHERE name = 'Phase 2: Multi-tenant Architecture'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Database Multi-tenancy Design', 
 'Architect isolated database schemas with tenant-specific data separation and security',
 'backlog', 'critical', 30, 0, '2025-03-01'),

((SELECT id FROM features WHERE name = 'Phase 2: Multi-tenant Architecture'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Tenant Management System', 
 'Build tenant onboarding, configuration management, and resource allocation systems',
 'backlog', 'critical', 40, 0, '2025-03-15'),

((SELECT id FROM features WHERE name = 'Phase 2: Multi-tenant Architecture'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Custom Branding Engine', 
 'Develop dynamic theming, logo management, and white-label customization tools',
 'backlog', 'high', 25, 0, '2025-03-30'),

((SELECT id FROM features WHERE name = 'Phase 2: Multi-tenant Architecture'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Multi-tenant Security Framework', 
 'Implement tenant isolation, data privacy controls, and compliance features',
 'backlog', 'critical', 35, 0, '2025-04-10'),

((SELECT id FROM features WHERE name = 'Phase 2: Multi-tenant Architecture'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Scalability & Performance Optimization', 
 'Design auto-scaling, load balancing, and performance monitoring for multiple tenants',
 'backlog', 'high', 20, 0, '2025-04-20'),

-- Phase 2: Advanced SaaS Features Tasks
((SELECT id FROM features WHERE name = 'Phase 2: Advanced SaaS Features'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Subscription Management Platform', 
 'Build billing, subscription tiers, usage tracking, and payment processing for SaaS model',
 'backlog', 'critical', 45, 0, '2025-04-30'),

((SELECT id FROM features WHERE name = 'Phase 2: Advanced SaaS Features'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Custom Domain Management', 
 'Enable tenants to use custom domains with SSL provisioning and DNS management',
 'backlog', 'high', 20, 0, '2025-05-10'),

((SELECT id FROM features WHERE name = 'Phase 2: Advanced SaaS Features'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Advanced Admin Portal', 
 'Create super-admin dashboard for managing all tenants, billing, and platform analytics',
 'backlog', 'high', 30, 0, '2025-05-20'),

((SELECT id FROM features WHERE name = 'Phase 2: Advanced SaaS Features'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'API & Integration Framework', 
 'Develop RESTful APIs, webhooks, and integration capabilities for third-party systems',
 'backlog', 'medium', 25, 0, '2025-05-30'),

-- Phase 2: Enterprise Analytics & Reporting Tasks
((SELECT id FROM features WHERE name = 'Phase 2: Enterprise Analytics & Reporting'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Advanced Analytics Dashboard', 
 'Build comprehensive analytics with revenue tracking, customer insights, and performance metrics',
 'backlog', 'high', 35, 0, '2025-06-10'),

((SELECT id FROM features WHERE name = 'Phase 2: Enterprise Analytics & Reporting'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Multi-tenant Reporting Engine', 
 'Create customizable reports, automated insights, and tenant-specific analytics',
 'backlog', 'medium', 30, 0, '2025-06-20'),

((SELECT id FROM features WHERE name = 'Phase 2: Enterprise Analytics & Reporting'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Business Intelligence Tools', 
 'Implement predictive analytics, trend analysis, and strategic business insights',
 'backlog', 'medium', 25, 0, '2025-06-30'),

-- Phase 3: Advanced Market Expansion Tasks
((SELECT id FROM features WHERE name = 'Phase 3: Advanced Market Expansion'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Internationalization Framework', 
 'Build multi-language support, cultural customization, and localization management',
 'backlog', 'medium', 40, 0, '2025-07-15'),

((SELECT id FROM features WHERE name = 'Phase 3: Advanced Market Expansion'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Global Payment Processing', 
 'Integrate international payment gateways, currency conversion, and regional compliance',
 'backlog', 'medium', 35, 0, '2025-07-30'),

((SELECT id FROM features WHERE name = 'Phase 3: Advanced Market Expansion'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Regional Compliance & Legal', 
 'Implement GDPR, CCPA, regional tax handling, and jurisdiction-specific requirements',
 'backlog', 'medium', 25, 0, '2025-08-10'),

-- Phase 3: AI-Powered Enhancements Tasks
((SELECT id FROM features WHERE name = 'Phase 3: AI-Powered Enhancements'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Machine Learning Recommendation Engine', 
 'Build AI-powered product recommendations, personalization, and customer behavior analysis',
 'backlog', 'medium', 50, 0, '2025-08-20'),

((SELECT id FROM features WHERE name = 'Phase 3: AI-Powered Enhancements'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Predictive Analytics & Forecasting', 
 'Implement demand forecasting, inventory optimization, and predictive maintenance',
 'backlog', 'medium', 35, 0, '2025-09-01'),

((SELECT id FROM features WHERE name = 'Phase 3: AI-Powered Enhancements'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'AI Customer Service Integration', 
 'Deploy chatbots, automated support, and intelligent customer interaction systems',
 'backlog', 'low', 25, 0, '2025-09-15'),

-- Phase 3: Enterprise Integrations Tasks
((SELECT id FROM features WHERE name = 'Phase 3: Enterprise Integrations'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'ERP System Integration', 
 'Connect with major ERP systems for inventory, accounting, and business process integration',
 'backlog', 'low', 40, 0, '2025-09-30'),

((SELECT id FROM features WHERE name = 'Phase 3: Enterprise Integrations'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Advanced CRM & Marketing Automation', 
 'Integrate with CRM systems, email marketing, and customer lifecycle management',
 'backlog', 'low', 25, 0, '2025-10-10'),

((SELECT id FROM features WHERE name = 'Phase 3: Enterprise Integrations'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Supply Chain & Marketplace Integration', 
 'Connect with suppliers, distributors, and third-party marketplaces for expanded reach',
 'backlog', 'low', 15, 0, '2025-10-20');

-- Add milestones for each phase
INSERT INTO milestones (project_id, name, description, due_date, is_completed, completion_date) VALUES
((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Phase 1: MVP Launch', 
'Complete MVP with all core e-commerce features, development environment, and client hosting capability',
'2025-02-28', false, null),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Phase 2: SaaS Platform Release', 
'Launch multi-tenant SaaS platform with enterprise features, subscription management, and advanced analytics',
'2025-06-30', false, null),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Phase 3: Enterprise Expansion', 
'Deploy AI enhancements, international expansion features, and enterprise-grade integrations',
'2025-10-31', false, null);