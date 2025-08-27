-- Add multi-phase plan features, tasks, and milestones (corrected)

-- PHASE FEATURES
INSERT INTO features (project_id, name, description, priority, estimated_hours, actual_hours, completion_percentage)
VALUES
((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Phase 1: Development Environment Setup',
 'GitHub integration, CI/CD pipeline, staging environment, and client hosting capabilities',
 'critical', 80, 20, 25),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Phase 1: MVP Core Features',
 'Essential e-commerce functionality: catalog, cart, checkout, payment, and basic user management',
 'critical', 200, 165, 82),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Phase 2: Multi-tenant Architecture',
 'Multi-tenant system with isolated data per property/client and custom branding',
 'high', 150, 0, 0),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Phase 2: Advanced SaaS Features',
 'Subscription management, tenant onboarding, custom domain mapping, white-labeling, enterprise billing',
 'high', 120, 0, 0),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Phase 2: Enterprise Analytics & Reporting',
 'Advanced analytics dashboard, multi-tenant reporting, and business intelligence',
 'medium', 90, 0, 0),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Phase 3: Advanced Market Expansion',
 'Multi-language, international payments, currency conversion, and regional compliance',
 'medium', 100, 0, 0),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Phase 3: AI-Powered Enhancements',
 'Recommendations, predictive inventory, AI support, forecasting, and intelligent pricing',
 'medium', 110, 0, 0),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Phase 3: Enterprise Integrations',
 'ERP/POS integrations, advanced CRM, supply chain, and marketplace syndication',
 'low', 80, 0, 0);

-- PHASE 1: DEVELOPMENT ENVIRONMENT TASKS
INSERT INTO tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date)
VALUES
((SELECT id FROM features WHERE name = 'Phase 1: Development Environment Setup'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'GitHub Repository Setup & Integration',
 'Configure repo, branching, PR reviews, and documentation standards',
 'done', 'critical', 8, 8, '2024-11-20'),

((SELECT id FROM features WHERE name = 'Phase 1: Development Environment Setup'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'CI/CD Pipeline Development',
 'Automated testing and deployments with GitHub Actions',
 'in_progress', 'critical', 20, 8, '2025-01-15'),

((SELECT id FROM features WHERE name = 'Phase 1: Development Environment Setup'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Staging Environment Configuration',
 'Staging setup mirroring production for client UAT',
 'todo', 'critical', 15, 0, '2025-01-20'),

((SELECT id FROM features WHERE name = 'Phase 1: Development Environment Setup'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Production Deployment Setup',
 'Hosting, SSL, CDN, monitoring, and backups',
 'todo', 'critical', 18, 2, '2025-01-25'),

((SELECT id FROM features WHERE name = 'Phase 1: Development Environment Setup'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Client Hosting Integration',
 'Enable hosting on client page/domain with DNS and branded deployment',
 'todo', 'high', 12, 2, '2025-01-30'),

((SELECT id FROM features WHERE name = 'Phase 1: Development Environment Setup'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Monitoring & Analytics Setup',
 'Error tracking, performance monitoring, uptime, and usage analytics',
 'backlog', 'medium', 7, 0, '2025-02-05');

-- PHASE 1: MVP CORE FEATURES TASKS
INSERT INTO tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date)
VALUES
((SELECT id FROM features WHERE name = 'Phase 1: MVP Core Features'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'MVP Product Launch Preparation',
 'QA, performance tuning, security review, and launch checklist',
 'in_progress', 'critical', 25, 15, '2025-01-31'),

((SELECT id FROM features WHERE name = 'Phase 1: MVP Core Features'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Client Training & Documentation',
 'Admin training, user guides, and ops docs',
 'todo', 'high', 20, 5, '2025-02-10'),

((SELECT id FROM features WHERE name = 'Phase 1: MVP Core Features'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'MVP Support Infrastructure',
 'Support desk, ticketing, and maintenance protocols',
 'todo', 'medium', 15, 0, '2025-02-15');

-- PHASE 2: MULTI-TENANT ARCHITECTURE TASKS
INSERT INTO tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date)
VALUES
((SELECT id FROM features WHERE name = 'Phase 2: Multi-tenant Architecture'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Database Multi-tenancy Design',
 'Isolated tenant data and security boundaries',
 'backlog', 'critical', 30, 0, '2025-03-01'),

((SELECT id FROM features WHERE name = 'Phase 2: Multi-tenant Architecture'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Tenant Management System',
 'Onboarding, configuration, and resource isolation',
 'backlog', 'critical', 40, 0, '2025-03-15'),

((SELECT id FROM features WHERE name = 'Phase 2: Multi-tenant Architecture'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Custom Branding Engine',
 'Dynamic themes, logos, and white-label options',
 'backlog', 'high', 25, 0, '2025-03-30'),

((SELECT id FROM features WHERE name = 'Phase 2: Multi-tenant Architecture'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Multi-tenant Security Framework',
 'Isolation, privacy controls, and compliance',
 'backlog', 'critical', 35, 0, '2025-04-10'),

((SELECT id FROM features WHERE name = 'Phase 2: Multi-tenant Architecture'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Scalability & Performance Optimization',
 'Auto-scaling, load balancing, perf monitoring',
 'backlog', 'high', 20, 0, '2025-04-20');

-- PHASE 2: ADVANCED SAAS FEATURES TASKS
INSERT INTO tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date)
VALUES
((SELECT id FROM features WHERE name = 'Phase 2: Advanced SaaS Features'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Subscription Management Platform',
 'Billing, tiers, usage tracking, payments',
 'backlog', 'critical', 45, 0, '2025-04-30'),

((SELECT id FROM features WHERE name = 'Phase 2: Advanced SaaS Features'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Custom Domain Management',
 'Tenant custom domains with SSL and DNS',
 'backlog', 'high', 20, 0, '2025-05-10'),

((SELECT id FROM features WHERE name = 'Phase 2: Advanced SaaS Features'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Advanced Admin Portal',
 'Super-admin dashboard for tenants and billing',
 'backlog', 'high', 30, 0, '2025-05-20'),

((SELECT id FROM features WHERE name = 'Phase 2: Advanced SaaS Features'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'API & Integration Framework',
 'REST APIs, webhooks, and integrations',
 'backlog', 'medium', 25, 0, '2025-05-30');

-- PHASE 2: ENTERPRISE ANALYTICS & REPORTING TASKS
INSERT INTO tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date)
VALUES
((SELECT id FROM features WHERE name = 'Phase 2: Enterprise Analytics & Reporting'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Advanced Analytics Dashboard',
 'Revenue, customers, and operations insights',
 'backlog', 'high', 35, 0, '2025-06-10'),

((SELECT id FROM features WHERE name = 'Phase 2: Enterprise Analytics & Reporting'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Multi-tenant Reporting Engine',
 'Tenant-specific reports and automated insights',
 'backlog', 'medium', 30, 0, '2025-06-20'),

((SELECT id FROM features WHERE name = 'Phase 2: Enterprise Analytics & Reporting'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Business Intelligence Tools',
 'Predictive analytics and trend analysis',
 'backlog', 'medium', 25, 0, '2025-06-30');

-- PHASE 3: ADVANCED MARKET EXPANSION TASKS
INSERT INTO tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date)
VALUES
((SELECT id FROM features WHERE name = 'Phase 3: Advanced Market Expansion'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Internationalization Framework',
 'Multi-language and localization management',
 'backlog', 'medium', 40, 0, '2025-07-15'),

((SELECT id FROM features WHERE name = 'Phase 3: Advanced Market Expansion'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Global Payment Processing',
 'International gateways and currency conversion',
 'backlog', 'medium', 35, 0, '2025-07-30'),

((SELECT id FROM features WHERE name = 'Phase 3: Advanced Market Expansion'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Regional Compliance & Legal',
 'GDPR, CCPA, tax handling, and jurisdiction rules',
 'backlog', 'medium', 25, 0, '2025-08-10');

-- PHASE 3: AI-POWERED ENHANCEMENTS TASKS
INSERT INTO tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date)
VALUES
((SELECT id FROM features WHERE name = 'Phase 3: AI-Powered Enhancements'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'ML Recommendation Engine',
 'Personalized product recommendations and behavior analysis',
 'backlog', 'medium', 50, 0, '2025-08-20'),

((SELECT id FROM features WHERE name = 'Phase 3: AI-Powered Enhancements'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Predictive Analytics & Forecasting',
 'Demand forecasting and inventory optimization',
 'backlog', 'medium', 35, 0, '2025-09-01'),

((SELECT id FROM features WHERE name = 'Phase 3: AI-Powered Enhancements'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'AI Customer Service Integration',
 'Chatbots and automated support',
 'backlog', 'low', 25, 0, '2025-09-15');

-- PHASE 3: ENTERPRISE INTEGRATIONS TASKS
INSERT INTO tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date)
VALUES
((SELECT id FROM features WHERE name = 'Phase 3: Enterprise Integrations'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'ERP System Integration',
 'Inventory, accounting, and business processes',
 'backlog', 'low', 40, 0, '2025-09-30'),

((SELECT id FROM features WHERE name = 'Phase 3: Enterprise Integrations'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Advanced CRM & Marketing Automation',
 'CRM integration and lifecycle marketing',
 'backlog', 'low', 25, 0, '2025-10-10'),

((SELECT id FROM features WHERE name = 'Phase 3: Enterprise Integrations'),
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Supply Chain & Marketplace Integration',
 'Supplier, distributor, and marketplace connections',
 'backlog', 'low', 15, 0, '2025-10-20');

-- MILESTONES
INSERT INTO milestones (project_id, name, description, due_date, is_completed, completion_date)
VALUES
((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Phase 1: MVP Launch',
 'MVP with core features, dev environment, and client hosting capability',
 '2025-02-28', false, null),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Phase 2: SaaS Platform Release',
 'Multi-tenant SaaS release with subscriptions and analytics',
 '2025-06-30', false, null),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Phase 3: Enterprise Expansion',
 'AI, international expansion, and enterprise integrations',
 '2025-10-31', false, null);