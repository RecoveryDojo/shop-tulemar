-- Insert Tulemar Instacart project with comprehensive feature breakdown
INSERT INTO public.projects (name, description, status, client_name, start_date, end_date, budget) VALUES 
('Tulemar Instacart Platform', 'Full-stack grocery delivery platform for Tulemar Resort with guest web app, driver dashboard, and admin management system', 'active', 'Tulemar Resort', '2025-01-01', '2025-06-01', 75000.00);

-- Get the project ID for inserting features
DO $$
DECLARE
    tulemar_project_id UUID;
BEGIN
    SELECT id INTO tulemar_project_id FROM public.projects WHERE name = 'Tulemar Instacart Platform' LIMIT 1;
    
    -- Insert Phase 1 Features with enhanced 10x breakdown
    INSERT INTO public.features (project_id, name, description, priority, estimated_hours, completion_percentage, order_index) VALUES
    -- Guest Web App Module (Enhanced 10x)
    (tulemar_project_id, 'Guest Web App Core', 'WordPress-embedded bilingual (English/Spanish) web application with PWA capabilities, voice search, AR preview, and smart recommendations', 'critical', 120, 15, 1),
    (tulemar_project_id, 'Advanced Product Catalog', 'Real-time inventory sync, intelligent search/filtering, voice search integration, AR product preview, and AI-powered recommendations', 'critical', 80, 10, 2),
    (tulemar_project_id, 'Smart Shopping Experience', 'Progressive Web App with offline mode, social proof integration, loyalty program, and personalized shopping lists', 'high', 60, 5, 3),
    (tulemar_project_id, 'Checkout & Payment System', 'Secure PCI-compliant payment processing with multiple payment methods and guest checkout optimization', 'critical', 40, 20, 4),
    
    -- Driver/Shopper Dashboard (Enhanced 10x)
    (tulemar_project_id, 'Driver Mobile Dashboard', 'React Native app with real-time order assignment, GPS optimization, earnings analytics, and gamification', 'critical', 100, 8, 5),
    (tulemar_project_id, 'Intelligent Route Optimization', 'AI-powered route planning, real-time traffic integration, and smart shopping list optimization', 'high', 50, 0, 6),
    (tulemar_project_id, 'Driver Communication Hub', 'In-app chat, photo verification, customer feedback system, and performance monitoring', 'medium', 40, 0, 7),
    (tulemar_project_id, 'Offline Mode & Sync', 'Offline functionality with automatic data synchronization and conflict resolution', 'medium', 30, 0, 8),
    
    -- Host/Admin Dashboard (Enhanced 10x)
    (tulemar_project_id, 'Admin Management Portal', 'Comprehensive admin dashboard with real-time analytics, reporting, and multi-property management', 'critical', 90, 12, 9),
    (tulemar_project_id, 'Advanced Analytics Engine', 'Predictive analytics, revenue optimization, performance monitoring, and custom reporting tools', 'high', 70, 0, 10),
    (tulemar_project_id, 'Inventory Management System', 'AI-powered inventory tracking, predictive restocking, bulk upload tools, and automated alerts', 'critical', 60, 5, 11),
    (tulemar_project_id, 'Commission & Revenue Tracking', 'Automated commission calculations, revenue optimization tools, and financial reporting', 'high', 45, 0, 12),
    
    -- Technical Infrastructure (Enhanced 10x)
    (tulemar_project_id, 'Microservices Architecture', 'Scalable backend with microservices, API gateway, load balancing, and auto-scaling capabilities', 'critical', 150, 20, 13),
    (tulemar_project_id, 'Real-time Synchronization', 'WebSocket connections, real-time updates, conflict resolution, and data consistency across platforms', 'critical', 80, 10, 14),
    (tulemar_project_id, 'Security & Compliance', 'PCI compliance, GDPR/CCPA compliance, security audit trails, and comprehensive logging', 'critical', 60, 15, 15),
    (tulemar_project_id, 'Performance Optimization', 'Advanced caching, CDN integration, image optimization, and sub-second response times', 'high', 50, 8, 16),
    
    -- Integration Layer (Enhanced 10x)
    (tulemar_project_id, 'StreamlineVRS Integration', 'Complete API integration with StreamlineVRS PartnerX, real-time property sync, and automated booking management', 'critical', 70, 25, 17),
    (tulemar_project_id, 'WordPress Plugin Development', 'Custom WordPress plugin with seamless embedding, responsive design, and admin configuration', 'high', 35, 30, 18),
    (tulemar_project_id, 'Stripe Payment Integration', 'Advanced payment processing, subscription management, and fraud detection', 'critical', 25, 40, 19),
    (tulemar_project_id, 'Third-party API Integrations', 'Maps integration, SMS/email providers, analytics tools, and monitoring services', 'medium', 40, 0, 20),
    
    -- Quality Assurance & Testing (Enhanced 10x)
    (tulemar_project_id, 'Comprehensive Testing Suite', 'Automated testing, load testing, security testing, and cross-platform compatibility testing', 'high', 80, 5, 21),
    (tulemar_project_id, 'Beta Testing & Launch Support', '2-week beta period with user feedback collection, bug fixes, and production deployment', 'medium', 40, 0, 22),
    
    -- Documentation & Training (Enhanced 10x)
    (tulemar_project_id, 'Technical Documentation', 'Complete API documentation, system architecture docs, and maintenance guides', 'medium', 30, 0, 23),
    (tulemar_project_id, 'User Training & Support', 'Admin training materials, user guides, and ongoing support documentation', 'low', 20, 0, 24);
    
END $$;