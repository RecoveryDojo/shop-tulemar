-- Add comprehensive tasks for Tulemar Instacart project with realistic progress
DO $$
DECLARE
    tulemar_project_id UUID;
    guest_web_app_core_id UUID;
    advanced_catalog_id UUID;
    smart_shopping_id UUID;
    checkout_payment_id UUID;
    driver_dashboard_id UUID;
    route_optimization_id UUID;
    admin_portal_id UUID;
    microservices_id UUID;
    streamline_integration_id UUID;
    wordpress_plugin_id UUID;
    stripe_integration_id UUID;
BEGIN
    -- Get project and feature IDs
    SELECT id INTO tulemar_project_id FROM public.projects WHERE name = 'Tulemar Instacart Platform' LIMIT 1;
    SELECT id INTO guest_web_app_core_id FROM public.features WHERE name = 'Guest Web App Core' AND project_id = tulemar_project_id LIMIT 1;
    SELECT id INTO advanced_catalog_id FROM public.features WHERE name = 'Advanced Product Catalog' AND project_id = tulemar_project_id LIMIT 1;
    SELECT id INTO smart_shopping_id FROM public.features WHERE name = 'Smart Shopping Experience' AND project_id = tulemar_project_id LIMIT 1;
    SELECT id INTO checkout_payment_id FROM public.features WHERE name = 'Checkout & Payment System' AND project_id = tulemar_project_id LIMIT 1;
    SELECT id INTO driver_dashboard_id FROM public.features WHERE name = 'Driver Mobile Dashboard' AND project_id = tulemar_project_id LIMIT 1;
    SELECT id INTO route_optimization_id FROM public.features WHERE name = 'Intelligent Route Optimization' AND project_id = tulemar_project_id LIMIT 1;
    SELECT id INTO admin_portal_id FROM public.features WHERE name = 'Admin Management Portal' AND project_id = tulemar_project_id LIMIT 1;
    SELECT id INTO microservices_id FROM public.features WHERE name = 'Microservices Architecture' AND project_id = tulemar_project_id LIMIT 1;
    SELECT id INTO streamline_integration_id FROM public.features WHERE name = 'StreamlineVRS Integration' AND project_id = tulemar_project_id LIMIT 1;
    SELECT id INTO wordpress_plugin_id FROM public.features WHERE name = 'WordPress Plugin Development' AND project_id = tulemar_project_id LIMIT 1;
    SELECT id INTO stripe_integration_id FROM public.features WHERE name = 'Stripe Payment Integration' AND project_id = tulemar_project_id LIMIT 1;

    -- Insert comprehensive tasks for Guest Web App Core
    INSERT INTO public.tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date, order_index) VALUES
    (guest_web_app_core_id, tulemar_project_id, 'Project Architecture Setup', 'Initialize React/Vite project with TypeScript, Tailwind CSS, and Supabase integration', 'done', 'critical', 8, 8.5, '2025-01-05', 1),
    (guest_web_app_core_id, tulemar_project_id, 'Component Library Setup', 'Configure shadcn/ui components and create base design system', 'done', 'high', 6, 6.0, '2025-01-08', 2),
    (guest_web_app_core_id, tulemar_project_id, 'Routing Configuration', 'Set up React Router with all main pages and navigation', 'done', 'high', 4, 4.5, '2025-01-10', 3),
    (guest_web_app_core_id, tulemar_project_id, 'Bilingual i18n Setup', 'Implement English/Spanish language switching with react-i18next', 'in_progress', 'high', 12, 8, '2025-01-20', 4),
    (guest_web_app_core_id, tulemar_project_id, 'PWA Configuration', 'Add Progressive Web App capabilities with service worker', 'todo', 'medium', 8, 0, '2025-01-25', 5),
    (guest_web_app_core_id, tulemar_project_id, 'Voice Search Integration', 'Implement voice-to-text search functionality', 'backlog', 'medium', 15, 0, '2025-02-15', 6),
    (guest_web_app_core_id, tulemar_project_id, 'AR Product Preview', 'Add augmented reality product visualization', 'backlog', 'low', 20, 0, '2025-03-01', 7),

    -- Advanced Product Catalog tasks
    (advanced_catalog_id, tulemar_project_id, 'Database Schema Design', 'Create comprehensive product, category, and inventory data models', 'done', 'critical', 6, 6, '2025-01-08', 1),
    (advanced_catalog_id, tulemar_project_id, 'Product Grid Component', 'Build responsive product grid with loading states', 'done', 'high', 8, 9, '2025-01-12', 2),
    (advanced_catalog_id, tulemar_project_id, 'Search & Filter System', 'Implement advanced search with category, price, and availability filters', 'in_progress', 'high', 16, 10, '2025-01-30', 3),
    (advanced_catalog_id, tulemar_project_id, 'Real-time Inventory Sync', 'Connect to inventory management system for live stock updates', 'todo', 'critical', 12, 0, '2025-02-05', 4),
    (advanced_catalog_id, tulemar_project_id, 'Product Details Page', 'Create detailed product view with images, descriptions, and reviews', 'todo', 'high', 10, 0, '2025-02-10', 5),
    (advanced_catalog_id, tulemar_project_id, 'AI Recommendations', 'Implement smart product recommendations based on user behavior', 'backlog', 'medium', 18, 0, '2025-02-20', 6),

    -- Smart Shopping Experience tasks
    (smart_shopping_id, tulemar_project_id, 'Shopping Cart Context', 'Create React context for cart state management', 'done', 'critical', 6, 6.5, '2025-01-15', 1),
    (smart_shopping_id, tulemar_project_id, 'Cart UI Components', 'Build cart sidebar, item cards, and quantity controls', 'done', 'high', 8, 8, '2025-01-18', 2),
    (smart_shopping_id, tulemar_project_id, 'Wishlist Functionality', 'Add save-for-later and wishlist features', 'todo', 'medium', 6, 0, '2025-02-01', 3),
    (smart_shopping_id, tulemar_project_id, 'Social Proof Integration', 'Add customer reviews and ratings display', 'backlog', 'medium', 10, 0, '2025-02-15', 4),
    (smart_shopping_id, tulemar_project_id, 'Loyalty Program', 'Implement points system and rewards tracking', 'backlog', 'low', 15, 0, '2025-03-01', 5),
    (smart_shopping_id, tulemar_project_id, 'Offline Mode', 'Add service worker for offline cart persistence', 'backlog', 'medium', 12, 0, '2025-02-25', 6),

    -- Checkout & Payment System tasks
    (checkout_payment_id, tulemar_project_id, 'Checkout Flow Design', 'Create multi-step checkout with address and payment forms', 'in_progress', 'critical', 10, 6, '2025-01-25', 1),
    (checkout_payment_id, tulemar_project_id, 'Address Management', 'Build delivery address selection and validation', 'todo', 'high', 6, 0, '2025-01-30', 2),
    (checkout_payment_id, tulemar_project_id, 'Payment Form Integration', 'Connect Stripe Elements for secure payment processing', 'todo', 'critical', 8, 0, '2025-02-05', 3),
    (checkout_payment_id, tulemar_project_id, 'Order Confirmation', 'Create order summary and confirmation email system', 'todo', 'high', 6, 0, '2025-02-10', 4),
    (checkout_payment_id, tulemar_project_id, 'Guest Checkout', 'Enable checkout without account registration', 'backlog', 'medium', 8, 0, '2025-02-15', 5),

    -- Driver Mobile Dashboard tasks
    (driver_dashboard_id, tulemar_project_id, 'Driver Authentication', 'Set up driver login and profile management', 'todo', 'critical', 8, 0, '2025-02-01', 1),
    (driver_dashboard_id, tulemar_project_id, 'Order Assignment UI', 'Create order queue and assignment interface', 'todo', 'critical', 12, 0, '2025-02-10', 2),
    (driver_dashboard_id, tulemar_project_id, 'GPS Integration', 'Add location tracking and navigation features', 'backlog', 'high', 15, 0, '2025-02-20', 3),
    (driver_dashboard_id, tulemar_project_id, 'Earnings Dashboard', 'Build earnings tracking and analytics display', 'backlog', 'medium', 10, 0, '2025-03-01', 4),
    (driver_dashboard_id, tulemar_project_id, 'Driver Chat System', 'Implement in-app messaging with customers', 'backlog', 'medium', 12, 0, '2025-03-10', 5),

    -- Admin Management Portal tasks
    (admin_portal_id, tulemar_project_id, 'Admin Dashboard Layout', 'Create main admin interface with navigation and widgets', 'in_progress', 'critical', 10, 5, '2025-01-30', 1),
    (admin_portal_id, tulemar_project_id, 'Order Management', 'Build order tracking and status management system', 'todo', 'critical', 15, 0, '2025-02-10', 2),
    (admin_portal_id, tulemar_project_id, 'User Management', 'Create customer and driver management interface', 'todo', 'high', 12, 0, '2025-02-15', 3),
    (admin_portal_id, tulemar_project_id, 'Analytics Dashboard', 'Build revenue, orders, and performance analytics', 'backlog', 'medium', 18, 0, '2025-02-25', 4),
    (admin_portal_id, tulemar_project_id, 'Settings Management', 'Create system configuration and preferences panel', 'backlog', 'medium', 8, 0, '2025-03-05', 5),

    -- Microservices Architecture tasks
    (microservices_id, tulemar_project_id, 'Supabase Setup', 'Configure database, authentication, and edge functions', 'done', 'critical', 12, 12, '2025-01-05', 1),
    (microservices_id, tulemar_project_id, 'Database Schema Migration', 'Create all tables, relationships, and RLS policies', 'done', 'critical', 8, 9, '2025-01-10', 2),
    (microservices_id, tulemar_project_id, 'API Routes Design', 'Design RESTful API endpoints for all features', 'in_progress', 'high', 10, 6, '2025-01-25', 3),
    (microservices_id, tulemar_project_id, 'Edge Functions Setup', 'Create serverless functions for business logic', 'todo', 'high', 15, 0, '2025-02-05', 4),
    (microservices_id, tulemar_project_id, 'Real-time Subscriptions', 'Implement WebSocket connections for live updates', 'todo', 'medium', 12, 0, '2025-02-15', 5),
    (microservices_id, tulemar_project_id, 'Error Handling', 'Add comprehensive error handling and logging', 'backlog', 'medium', 8, 0, '2025-02-20', 6),

    -- StreamlineVRS Integration tasks
    (streamline_integration_id, tulemar_project_id, 'API Documentation Review', 'Study StreamlineVRS PartnerX API documentation', 'done', 'critical', 4, 4, '2025-01-08', 1),
    (streamline_integration_id, tulemar_project_id, 'Authentication Setup', 'Implement secure API key management and OAuth flow', 'done', 'critical', 8, 8.5, '2025-01-12', 2),
    (streamline_integration_id, tulemar_project_id, 'Property Data Sync', 'Build real-time property and availability synchronization', 'in_progress', 'critical', 16, 12, '2025-02-01', 3),
    (streamline_integration_id, tulemar_project_id, 'Booking Management', 'Integrate guest booking data with delivery system', 'todo', 'high', 12, 0, '2025-02-10', 4),
    (streamline_integration_id, tulemar_project_id, 'Error Handling & Fallbacks', 'Implement robust error handling and backup systems', 'todo', 'high', 8, 0, '2025-02-15', 5),

    -- WordPress Plugin Development tasks
    (wordpress_plugin_id, tulemar_project_id, 'Plugin Architecture', 'Create WordPress plugin structure and main file', 'done', 'high', 6, 6, '2025-01-10', 1),
    (wordpress_plugin_id, tulemar_project_id, 'Shortcode System', 'Implement shortcodes for embedding shop interface', 'done', 'high', 8, 8.5, '2025-01-15', 2),
    (wordpress_plugin_id, tulemar_project_id, 'Admin Settings Page', 'Create WordPress admin panel for configuration', 'in_progress', 'medium', 6, 4, '2025-01-25', 3),
    (wordpress_plugin_id, tulemar_project_id, 'Responsive Integration', 'Ensure seamless responsive design integration', 'todo', 'medium', 4, 0, '2025-02-01', 4),
    (wordpress_plugin_id, tulemar_project_id, 'Testing & Compatibility', 'Test with various WordPress themes and versions', 'backlog', 'medium', 6, 0, '2025-02-10', 5),

    -- Stripe Payment Integration tasks
    (stripe_integration_id, tulemar_project_id, 'Stripe Account Setup', 'Configure Stripe account and API keys', 'done', 'critical', 2, 2, '2025-01-05', 1),
    (stripe_integration_id, tulemar_project_id, 'Payment Elements Integration', 'Implement Stripe Elements in checkout form', 'done', 'critical', 8, 8.5, '2025-01-12', 2),
    (stripe_integration_id, tulemar_project_id, 'Webhook Configuration', 'Set up payment confirmation webhooks', 'done', 'critical', 6, 6, '2025-01-15', 3),
    (stripe_integration_id, tulemar_project_id, 'Subscription Management', 'Add recurring payment support for premium features', 'in_progress', 'medium', 8, 3, '2025-02-01', 4),
    (stripe_integration_id, tulemar_project_id, 'Fraud Detection', 'Implement Stripe Radar for fraud prevention', 'backlog', 'medium', 4, 0, '2025-02-10', 5);

    -- Update feature completion percentages and actual hours based on tasks
    UPDATE public.features SET 
        completion_percentage = 45,
        actual_hours = 27
    WHERE id = guest_web_app_core_id;

    UPDATE public.features SET 
        completion_percentage = 25,
        actual_hours = 25
    WHERE id = advanced_catalog_id;

    UPDATE public.features SET 
        completion_percentage = 25,
        actual_hours = 14.5
    WHERE id = smart_shopping_id;

    UPDATE public.features SET 
        completion_percentage = 15,
        actual_hours = 6
    WHERE id = checkout_payment_id;

    UPDATE public.features SET 
        completion_percentage = 0,
        actual_hours = 0
    WHERE id = driver_dashboard_id;

    UPDATE public.features SET 
        completion_percentage = 15,
        actual_hours = 5
    WHERE id = admin_portal_id;

    UPDATE public.features SET 
        completion_percentage = 35,
        actual_hours = 27
    WHERE id = microservices_id;

    UPDATE public.features SET 
        completion_percentage = 60,
        actual_hours = 24.5
    WHERE id = streamline_integration_id;

    UPDATE public.features SET 
        completion_percentage = 65,
        actual_hours = 18.5
    WHERE id = wordpress_plugin_id;

    UPDATE public.features SET 
        completion_percentage = 80,
        actual_hours = 19.5
    WHERE id = stripe_integration_id;

END $$;