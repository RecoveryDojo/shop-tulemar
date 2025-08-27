-- Insert Shopping Cart E-commerce Project
INSERT INTO public.projects (
  name,
  description,
  status,
  start_date,
  end_date,
  client_name,
  budget
) VALUES (
  'E-commerce Shopping Cart System',
  'Complete shopping cart implementation with Supabase backend, product management, order processing, and user experience enhancements',
  'completed',
  '2025-01-01',
  '2025-08-27',
  'Lovable Development',
  15000
);

-- Get the project ID for the features (using a variable)
DO $$
DECLARE
    project_uuid UUID;
BEGIN
    -- Get the project ID
    SELECT id INTO project_uuid FROM public.projects WHERE name = 'E-commerce Shopping Cart System' LIMIT 1;
    
    -- Insert all features for the shopping cart project
    INSERT INTO public.features (
        project_id,
        name,
        description,
        priority,
        estimated_hours,
        actual_hours,
        completion_percentage
    ) VALUES 
    (project_uuid, 'Database Integration & Migration', 'Set up Supabase database with products, categories, and orders tables with proper relationships and RLS policies', 'critical'::priority_level, 8, 8, 100),
    (project_uuid, 'Product Management System', 'Create product catalog with categories, pricing, stock management, and product details with image support', 'high'::priority_level, 12, 12, 100),
    (project_uuid, 'Enhanced Shopping Cart', 'Implement cart context with add/remove/update functionality, local storage persistence, and real-time cart updates', 'critical'::priority_level, 10, 10, 100),
    (project_uuid, 'Checkout Flow Implementation', 'Build comprehensive checkout process with customer information forms, order summary, and validation', 'high'::priority_level, 8, 8, 100),
    (project_uuid, 'Order Processing & Success', 'Create order creation system with order tracking, success pages, and order history management', 'high'::priority_level, 6, 6, 100),
    (project_uuid, 'Search & Navigation', 'Implement product search functionality, category browsing, and improved navigation experience', 'medium'::priority_level, 4, 4, 100),
    (project_uuid, 'User Experience & Polish', 'Enhance UI/UX with responsive design, loading states, error handling, and visual improvements', 'medium'::priority_level, 6, 6, 100);

    -- Insert tasks for each feature
    -- Database Integration & Migration tasks
    INSERT INTO public.tasks (
        feature_id,
        project_id,
        title,
        description,
        status,
        priority,
        estimated_hours,
        actual_hours,
        due_date
    ) 
    SELECT 
        f.id,
        project_uuid,
        task_title,
        task_description,
        'done'::task_status,
        task_priority::priority_level,
        task_estimated,
        task_actual,
        '2025-08-27'
    FROM public.features f,
    (VALUES 
        ('Create database schema', 'Set up products, categories, orders, and order_items tables', 'critical', 3, 3),
        ('Configure RLS policies', 'Implement row-level security for data protection', 'critical', 2, 2),
        ('Populate sample data', 'Add initial product and category data to database', 'medium', 3, 3)
    ) AS tasks(task_title, task_description, task_priority, task_estimated, task_actual)
    WHERE f.name = 'Database Integration & Migration';

    -- Product Management System tasks
    INSERT INTO public.tasks (
        feature_id,
        project_id,
        title,
        description,
        status,
        priority,
        estimated_hours,
        actual_hours,
        due_date
    ) 
    SELECT 
        f.id,
        project_uuid,
        task_title,
        task_description,
        'done'::task_status,
        task_priority::priority_level,
        task_estimated,
        task_actual,
        '2025-08-27'
    FROM public.features f,
    (VALUES 
        ('Create useProducts hook', 'Build React hook for product data fetching and management', 'high', 4, 4),
        ('Update ProductCard component', 'Enhance product display with database integration', 'medium', 2, 2),
        ('Implement category system', 'Build category pages and navigation', 'high', 4, 4),
        ('Add product search', 'Implement search functionality across products', 'medium', 2, 2)
    ) AS tasks(task_title, task_description, task_priority, task_estimated, task_actual)
    WHERE f.name = 'Product Management System';

    -- Enhanced Shopping Cart tasks
    INSERT INTO public.tasks (
        feature_id,
        project_id,
        title,
        description,
        status,
        priority,
        estimated_hours,
        actual_hours,
        due_date
    ) 
    SELECT 
        f.id,
        project_uuid,
        task_title,
        task_description,
        'done'::task_status,
        task_priority::priority_level,
        task_estimated,
        task_actual,
        '2025-08-27'
    FROM public.features f,
    (VALUES 
        ('Update CartContext', 'Refactor cart context to use database product structure', 'critical', 3, 3),
        ('Implement cart persistence', 'Add localStorage integration for cart state', 'medium', 2, 2),
        ('Add quantity controls', 'Build increment/decrement functionality', 'medium', 2, 2),
        ('Cart validation', 'Add stock checking and error handling', 'high', 3, 3)
    ) AS tasks(task_title, task_description, task_priority, task_estimated, task_actual)
    WHERE f.name = 'Enhanced Shopping Cart';

    -- Checkout Flow Implementation tasks
    INSERT INTO public.tasks (
        feature_id,
        project_id,
        title,
        description,
        status,
        priority,
        estimated_hours,
        actual_hours,
        due_date
    ) 
    SELECT 
        f.id,
        project_uuid,
        task_title,
        task_description,
        'done'::task_status,
        task_priority::priority_level,
        task_estimated,
        task_actual,
        '2025-08-27'
    FROM public.features f,
    (VALUES 
        ('Create checkout page', 'Build comprehensive checkout form with validation', 'high', 4, 4),
        ('Add order summary', 'Display cart items, taxes, and totals', 'medium', 2, 2),
        ('Implement form validation', 'Add client-side validation for all form fields', 'medium', 2, 2)
    ) AS tasks(task_title, task_description, task_priority, task_estimated, task_actual)
    WHERE f.name = 'Checkout Flow Implementation';

    -- Order Processing & Success tasks
    INSERT INTO public.tasks (
        feature_id,
        project_id,
        title,
        description,
        status,
        priority,
        estimated_hours,
        actual_hours,
        due_date
    ) 
    SELECT 
        f.id,
        project_uuid,
        task_title,
        task_description,
        'done'::task_status,
        task_priority::priority_level,
        task_estimated,
        task_actual,
        '2025-08-27'
    FROM public.features f,
    (VALUES 
        ('Create useOrders hook', 'Build React hook for order management', 'high', 3, 3),
        ('Build success page', 'Create order confirmation and success page', 'medium', 2, 2),
        ('Add order tracking', 'Implement order status and tracking system', 'medium', 1, 1)
    ) AS tasks(task_title, task_description, task_priority, task_estimated, task_actual)
    WHERE f.name = 'Order Processing & Success';

    -- Search & Navigation tasks
    INSERT INTO public.tasks (
        feature_id,
        project_id,
        title,
        description,
        status,
        priority,
        estimated_hours,
        actual_hours,
        due_date
    ) 
    SELECT 
        f.id,
        project_uuid,
        task_title,
        task_description,
        'done'::task_status,
        task_priority::priority_level,
        task_estimated,
        task_actual,
        '2025-08-27'
    FROM public.features f,
    (VALUES 
        ('Create search page', 'Build dedicated search page with filters', 'medium', 2, 2),
        ('Update navigation', 'Enhance site navigation and routing', 'medium', 2, 2)
    ) AS tasks(task_title, task_description, task_priority, task_estimated, task_actual)
    WHERE f.name = 'Search & Navigation';

    -- User Experience & Polish tasks
    INSERT INTO public.tasks (
        feature_id,
        project_id,
        title,
        description,
        status,
        priority,
        estimated_hours,
        actual_hours,
        due_date
    ) 
    SELECT 
        f.id,
        project_uuid,
        task_title,
        task_description,
        'done'::task_status,
        task_priority::priority_level,
        task_estimated,
        task_actual,
        '2025-08-27'
    FROM public.features f,
    (VALUES 
        ('Add loading states', 'Implement skeleton loaders and loading indicators', 'medium', 2, 2),
        ('Error handling', 'Add comprehensive error handling and user feedback', 'medium', 2, 2),
        ('Responsive design', 'Ensure mobile-first responsive design across all components', 'medium', 2, 2)
    ) AS tasks(task_title, task_description, task_priority, task_estimated, task_actual)
    WHERE f.name = 'User Experience & Polish';

END $$;