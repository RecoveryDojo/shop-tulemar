-- Insert Tulemar Instacart project with comprehensive feature breakdown
INSERT INTO public.projects (name, description, status, client_name, start_date, end_date, budget) VALUES 
('Tulemar Instacart Platform', 'Full-stack grocery delivery platform for Tulemar Resort with guest web app, driver dashboard, and admin management system', 'active', 'Tulemar Resort', '2025-01-01', '2025-06-01', 75000.00);

-- Get the project ID for inserting features
DO $$
DECLARE
    project_id UUID;
BEGIN
    SELECT id INTO project_id FROM public.projects WHERE name = 'Tulemar Instacart Platform' LIMIT 1;
    
    -- Insert Phase 1 Features with enhanced 10x breakdown
    INSERT INTO public.features (project_id, name, description, priority, estimated_hours, completion_percentage, order_index) VALUES
    -- Guest Web App Module (Enhanced 10x)
    (project_id, 'Guest Web App Core', 'WordPress-embedded bilingual (English/Spanish) web application with PWA capabilities, voice search, AR preview, and smart recommendations', 'critical', 120, 15, 1),
    (project_id, 'Advanced Product Catalog', 'Real-time inventory sync, intelligent search/filtering, voice search integration, AR product preview, and AI-powered recommendations', 'critical', 80, 10, 2),
    (project_id, 'Smart Shopping Experience', 'Progressive Web App with offline mode, social proof integration, loyalty program, and personalized shopping lists', 'high', 60, 5, 3),
    (project_id, 'Checkout & Payment System', 'Secure PCI-compliant payment processing with multiple payment methods and guest checkout optimization', 'critical', 40, 20, 4),
    
    -- Driver/Shopper Dashboard (Enhanced 10x)
    (project_id, 'Driver Mobile Dashboard', 'React Native app with real-time order assignment, GPS optimization, earnings analytics, and gamification', 'critical', 100, 8, 5),
    (project_id, 'Intelligent Route Optimization', 'AI-powered route planning, real-time traffic integration, and smart shopping list optimization', 'high', 50, 0, 6),
    (project_id, 'Driver Communication Hub', 'In-app chat, photo verification, customer feedback system, and performance monitoring', 'medium', 40, 0, 7),
    (project_id, 'Offline Mode & Sync', 'Offline functionality with automatic data synchronization and conflict resolution', 'medium', 30, 0, 8),
    
    -- Host/Admin Dashboard (Enhanced 10x)
    (project_id, 'Admin Management Portal', 'Comprehensive admin dashboard with real-time analytics, reporting, and multi-property management', 'critical', 90, 12, 9),
    (project_id, 'Advanced Analytics Engine', 'Predictive analytics, revenue optimization, performance monitoring, and custom reporting tools', 'high', 70, 0, 10),
    (project_id, 'Inventory Management System', 'AI-powered inventory tracking, predictive restocking, bulk upload tools, and automated alerts', 'critical', 60, 5, 11),
    (project_id, 'Commission & Revenue Tracking', 'Automated commission calculations, revenue optimization tools, and financial reporting', 'high', 45, 0, 12),
    
    -- Technical Infrastructure (Enhanced 10x)
    (project_id, 'Microservices Architecture', 'Scalable backend with microservices, API gateway, load balancing, and auto-scaling capabilities', 'critical', 150, 20, 13),
    (project_id, 'Real-time Synchronization', 'WebSocket connections, real-time updates, conflict resolution, and data consistency across platforms', 'critical', 80, 10, 14),
    (project_id, 'Security & Compliance', 'PCI compliance, GDPR/CCPA compliance, security audit trails, and comprehensive logging', 'critical', 60, 15, 15),
    (project_id, 'Performance Optimization', 'Advanced caching, CDN integration, image optimization, and sub-second response times', 'high', 50, 8, 16),
    
    -- Integration Layer (Enhanced 10x)
    (project_id, 'StreamlineVRS Integration', 'Complete API integration with StreamlineVRS PartnerX, real-time property sync, and automated booking management', 'critical', 70, 25, 17),
    (project_id, 'WordPress Plugin Development', 'Custom WordPress plugin with seamless embedding, responsive design, and admin configuration', 'high', 35, 30, 18),
    (project_id, 'Stripe Payment Integration', 'Advanced payment processing, subscription management, and fraud detection', 'critical', 25, 40, 19),
    (project_id, 'Third-party API Integrations', 'Maps integration, SMS/email providers, analytics tools, and monitoring services', 'medium', 40, 0, 20),
    
    -- Quality Assurance & Testing (Enhanced 10x)
    (project_id, 'Comprehensive Testing Suite', 'Automated testing, load testing, security testing, and cross-platform compatibility testing', 'high', 80, 5, 21),
    (project_id, 'Beta Testing & Launch Support', '2-week beta period with user feedback collection, bug fixes, and production deployment', 'medium', 40, 0, 22),
    
    -- Documentation & Training (Enhanced 10x)
    (project_id, 'Technical Documentation', 'Complete API documentation, system architecture docs, and maintenance guides', 'medium', 30, 0, 23),
    (project_id, 'User Training & Support', 'Admin training materials, user guides, and ongoing support documentation', 'low', 20, 0, 24);
    
    -- Insert sample tasks for key features
    INSERT INTO public.tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date) VALUES
    -- Guest Web App Core tasks
    ((SELECT id FROM public.features WHERE name = 'Guest Web App Core' AND project_id = project_id LIMIT 1), project_id, 'Set up React/Vite project structure', 'Initialize project with TypeScript, Tailwind, and essential dependencies', 'done', 'high', 8, 7.5, '2025-01-15'),
    ((SELECT id FROM public.features WHERE name = 'Guest Web App Core' AND project_id = project_id LIMIT 1), project_id, 'Implement bilingual support (EN/ES)', 'Set up i18n framework and translation system', 'in_progress', 'high', 12, 8, '2025-01-20'),
    ((SELECT id FROM public.features WHERE name = 'Guest Web App Core' AND project_id = project_id LIMIT 1), project_id, 'WordPress embedding integration', 'Create WordPress plugin for seamless embedding', 'todo', 'critical', 16, 0, '2025-01-25'),
    
    -- Advanced Product Catalog tasks
    ((SELECT id FROM public.features WHERE name = 'Advanced Product Catalog' AND project_id = project_id LIMIT 1), project_id, 'Design product database schema', 'Create comprehensive product and inventory data model', 'done', 'critical', 6, 6, '2025-01-10'),
    ((SELECT id FROM public.features WHERE name = 'Advanced Product Catalog' AND project_id = project_id LIMIT 1), project_id, 'Build search and filtering system', 'Implement advanced search with filters and AI recommendations', 'in_progress', 'high', 20, 12, '2025-01-30'),
    ((SELECT id FROM public.features WHERE name = 'Advanced Product Catalog' AND project_id = project_id LIMIT 1), project_id, 'Voice search integration', 'Add voice-to-text search functionality', 'backlog', 'medium', 15, 0, '2025-02-15'),
    
    -- Microservices Architecture tasks
    ((SELECT id FROM public.features WHERE name = 'Microservices Architecture' AND project_id = project_id LIMIT 1), project_id, 'Set up Supabase backend', 'Configure database, auth, and edge functions', 'done', 'critical', 12, 11, '2025-01-05'),
    ((SELECT id FROM public.features WHERE name = 'Microservices Architecture' AND project_id = project_id LIMIT 1), project_id, 'API gateway configuration', 'Set up API routing and rate limiting', 'in_progress', 'high', 18, 10, '2025-01-28'),
    ((SELECT id FROM public.features WHERE name = 'Microservices Architecture' AND project_id = project_id LIMIT 1), project_id, 'Database optimization', 'Implement indexing and query optimization', 'todo', 'medium', 15, 0, '2025-02-05'),
    
    -- StreamlineVRS Integration tasks
    ((SELECT id FROM public.features WHERE name = 'StreamlineVRS Integration' AND project_id = project_id LIMIT 1), project_id, 'API authentication setup', 'Implement secure API key management and authentication', 'done', 'critical', 8, 7, '2025-01-08'),
    ((SELECT id FROM public.features WHERE name = 'StreamlineVRS Integration' AND project_id = project_id LIMIT 1), project_id, 'Property data synchronization', 'Build real-time property and booking sync system', 'in_progress', 'critical', 20, 15, '2025-02-01'),
    ((SELECT id FROM public.features WHERE name = 'StreamlineVRS Integration' AND project_id = project_id LIMIT 1), project_id, 'Error handling and fallbacks', 'Implement robust error handling and backup systems', 'todo', 'high', 12, 0, '2025-02-10');
    
END $$;