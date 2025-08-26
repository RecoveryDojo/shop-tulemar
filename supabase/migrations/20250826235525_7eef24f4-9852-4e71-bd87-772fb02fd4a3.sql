-- Add missing e-commerce and shop features to the work tracker with correct enum values
INSERT INTO features (project_id, name, description, priority, estimated_hours, actual_hours, completion_percentage) VALUES 
-- Get the project ID first
((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'E-commerce Core Platform', 
'Complete shopping cart, product catalog, checkout flow, and order management system', 
'critical', 
120, 
85, 
70),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'User Authentication & Profiles', 
'Secure user registration, login, password reset, and profile management with guest checkout', 
'critical', 
40, 
32, 
80),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Responsive UI Components', 
'Complete component library with cards, buttons, forms, navigation, and responsive design', 
'high', 
60, 
54, 
90),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Category & Product Management', 
'Dynamic category pages, product search, filtering, and product detail views', 
'critical', 
50, 
40, 
80),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Shopping Cart & State Management', 
'React Context for cart state, local storage persistence, and cart operations', 
'critical', 
30, 
28, 
95),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Routing & Navigation', 
'React Router setup, protected routes, navigation components, and URL management', 
'high', 
25, 
24, 
95),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'Content Management System', 
'About pages, how it works, FAQ section, and static content management', 
'medium', 
35, 
30, 
85),

((SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
'SEO & Performance Optimization', 
'Meta tags, semantic HTML, image optimization, and core web vitals improvements', 
'medium', 
40, 
15, 
40);

-- Add comprehensive tasks for all the built features
INSERT INTO tasks (feature_id, project_id, title, description, status, priority, estimated_hours, actual_hours, due_date) VALUES

-- E-commerce Core Platform tasks
((SELECT id FROM features WHERE name = 'E-commerce Core Platform'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Shopping Cart Implementation', 
 'Build complete shopping cart with add/remove items, quantity updates, and total calculations',
 'done', 'critical', 15, 15, '2024-12-15'),

((SELECT id FROM features WHERE name = 'E-commerce Core Platform'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Product Catalog System', 
 'Implement product display, categories, search, and filtering functionality',
 'done', 'critical', 25, 24, '2024-12-20'),

((SELECT id FROM features WHERE name = 'E-commerce Core Platform'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Checkout Flow Implementation', 
 'Build multi-step checkout with delivery options, contact info, and order summary',
 'in_progress', 'critical', 20, 12, '2025-01-10'),

((SELECT id FROM features WHERE name = 'E-commerce Core Platform'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Order Management Backend', 
 'Implement order processing, status tracking, and order history',
 'in_progress', 'critical', 30, 15, '2025-01-15'),

((SELECT id FROM features WHERE name = 'E-commerce Core Platform'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Inventory Integration', 
 'Connect product catalog with real inventory management system',
 'backlog', 'high', 20, 8, '2025-01-25'),

((SELECT id FROM features WHERE name = 'E-commerce Core Platform'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Order Analytics Dashboard', 
 'Build analytics for order tracking, popular products, and sales metrics',
 'backlog', 'medium', 10, 11, '2025-02-01'),

-- User Authentication & Profiles tasks
((SELECT id FROM features WHERE name = 'User Authentication & Profiles'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Supabase Auth Integration', 
 'Set up Supabase authentication with email/password and social logins',
 'done', 'critical', 12, 12, '2024-12-10'),

((SELECT id FROM features WHERE name = 'User Authentication & Profiles'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'User Profile Management', 
 'Build profile pages with address management and preferences',
 'done', 'high', 15, 14, '2024-12-25'),

((SELECT id FROM features WHERE name = 'User Authentication & Profiles'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Guest Checkout Flow', 
 'Implement guest checkout without account requirement',
 'done', 'medium', 8, 6, '2025-01-05'),

((SELECT id FROM features WHERE name = 'User Authentication & Profiles'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Password Reset System', 
 'Build secure password reset with email verification',
 'testing', 'medium', 5, 0, '2025-01-20'),

-- Responsive UI Components tasks
((SELECT id FROM features WHERE name = 'Responsive UI Components'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Shadcn/UI Component Setup', 
 'Install and configure shadcn/ui component library with custom theming',
 'done', 'high', 8, 8, '2024-11-30'),

((SELECT id FROM features WHERE name = 'Responsive UI Components'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Product Card Components', 
 'Build reusable product cards with images, pricing, and cart actions',
 'done', 'high', 12, 11, '2024-12-05'),

((SELECT id FROM features WHERE name = 'Responsive UI Components'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Navigation Components', 
 'Create responsive navigation with mobile menu and shopping cart icon',
 'done', 'high', 10, 9, '2024-12-08'),

((SELECT id FROM features WHERE name = 'Responsive UI Components'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Form Components', 
 'Build reusable forms for checkout, contact, and user input',
 'done', 'medium', 15, 14, '2024-12-12'),

((SELECT id FROM features WHERE name = 'Responsive UI Components'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Layout Components', 
 'Create consistent layout components with header, footer, and main content areas',
 'done', 'medium', 10, 8, '2024-12-15'),

((SELECT id FROM features WHERE name = 'Responsive UI Components'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Mobile Optimization', 
 'Optimize all components for mobile devices and touch interactions',
 'done', 'high', 5, 4, '2024-12-18'),

-- Category & Product Management tasks
((SELECT id FROM features WHERE name = 'Category & Product Management'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Product Data Structure', 
 'Design and implement product data schema with categories and attributes',
 'done', 'critical', 8, 8, '2024-12-01'),

((SELECT id FROM features WHERE name = 'Category & Product Management'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Category Pages Implementation', 
 'Build dynamic category pages with product filtering and search',
 'done', 'high', 15, 14, '2024-12-10'),

((SELECT id FROM features WHERE name = 'Category & Product Management'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Product Search Functionality', 
 'Implement search with filtering by name, category, and price',
 'done', 'high', 12, 10, '2024-12-15'),

((SELECT id FROM features WHERE name = 'Category & Product Management'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Product Detail Views', 
 'Create detailed product pages with images, descriptions, and related products',
 'in_progress', 'medium', 10, 6, '2025-01-12'),

((SELECT id FROM features WHERE name = 'Category & Product Management'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Dynamic Category Navigation', 
 'Build dynamic category menu with subcategories and product counts',
 'testing', 'medium', 5, 2, '2025-01-18'),

-- Shopping Cart & State Management tasks
((SELECT id FROM features WHERE name = 'Shopping Cart & State Management'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'React Context Implementation', 
 'Set up React Context for global cart state management',
 'done', 'critical', 8, 8, '2024-11-28'),

((SELECT id FROM features WHERE name = 'Shopping Cart & State Management'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Local Storage Persistence', 
 'Implement cart persistence using browser local storage',
 'done', 'high', 6, 6, '2024-12-02'),

((SELECT id FROM features WHERE name = 'Shopping Cart & State Management'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Cart Operations Logic', 
 'Build add, remove, update quantity, and clear cart functionality',
 'done', 'critical', 10, 9, '2024-12-05'),

((SELECT id FROM features WHERE name = 'Shopping Cart & State Management'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Cart UI Components', 
 'Create cart sidebar, cart page, and cart item components',
 'done', 'high', 6, 5, '2024-12-08'),

-- Routing & Navigation tasks
((SELECT id FROM features WHERE name = 'Routing & Navigation'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'React Router Setup', 
 'Configure React Router with all application routes',
 'done', 'critical', 6, 6, '2024-11-25'),

((SELECT id FROM features WHERE name = 'Routing & Navigation'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Navigation Components', 
 'Build main navigation, breadcrumbs, and footer navigation',
 'done', 'high', 8, 8, '2024-12-01'),

((SELECT id FROM features WHERE name = 'Routing & Navigation'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Protected Routes Setup', 
 'Implement authentication-protected routes and redirects',
 'done', 'medium', 5, 5, '2024-12-10'),

((SELECT id FROM features WHERE name = 'Routing & Navigation'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'URL Parameter Handling', 
 'Set up dynamic routes for categories, products, and user pages',
 'done', 'medium', 4, 3, '2024-12-12'),

((SELECT id FROM features WHERE name = 'Routing & Navigation'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 '404 Error Handling', 
 'Create custom 404 page with helpful navigation',
 'done', 'low', 2, 2, '2024-12-15'),

-- Content Management System tasks
((SELECT id FROM features WHERE name = 'Content Management System'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'About Pages Content', 
 'Create compelling about us, mission, and company story pages',
 'done', 'medium', 8, 8, '2024-12-05'),

((SELECT id FROM features WHERE name = 'Content Management System'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'How It Works Section', 
 'Build step-by-step guide explaining the shopping and delivery process',
 'done', 'medium', 10, 9, '2024-12-10'),

((SELECT id FROM features WHERE name = 'Content Management System'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'FAQ Implementation', 
 'Create comprehensive FAQ section with collapsible answers',
 'in_progress', 'low', 6, 3, '2025-01-15'),

((SELECT id FROM features WHERE name = 'Content Management System'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Legal Pages', 
 'Add privacy policy, terms of service, and return policy pages',
 'backlog', 'low', 8, 5, '2025-01-25'),

((SELECT id FROM features WHERE name = 'Content Management System'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Contact Information', 
 'Implement contact forms and location information',
 'done', 'medium', 3, 5, '2024-12-18'),

-- SEO & Performance Optimization tasks
((SELECT id FROM features WHERE name = 'SEO & Performance Optimization'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Meta Tags Implementation', 
 'Add proper meta tags, Open Graph, and Twitter Card data',
 'in_progress', 'medium', 8, 3, '2025-01-10'),

((SELECT id FROM features WHERE name = 'SEO & Performance Optimization'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Semantic HTML Structure', 
 'Ensure proper HTML5 semantic elements and accessibility',
 'testing', 'medium', 6, 2, '2025-01-12'),

((SELECT id FROM features WHERE name = 'SEO & Performance Optimization'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Image Optimization', 
 'Implement lazy loading, WebP format, and responsive images',
 'backlog', 'medium', 10, 4, '2025-01-20'),

((SELECT id FROM features WHERE name = 'SEO & Performance Optimization'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Performance Monitoring', 
 'Set up Core Web Vitals tracking and performance optimization',
 'backlog', 'low', 8, 3, '2025-01-25'),

((SELECT id FROM features WHERE name = 'SEO & Performance Optimization'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Sitemap Generation', 
 'Create dynamic sitemap for better search engine indexing',
 'done', 'low', 4, 2, '2024-12-20'),

((SELECT id FROM features WHERE name = 'SEO & Performance Optimization'), 
 (SELECT id FROM projects WHERE name = 'Tulemar Instacart Platform'),
 'Structured Data Markup', 
 'Add JSON-LD structured data for products and organization',
 'backlog', 'medium', 4, 1, '2025-02-01');

-- Update project completion based on new data
UPDATE projects 
SET description = 'Comprehensive grocery delivery platform for Tulemar guests with complete e-commerce functionality, work tracking system, and WordPress integration. Currently includes: shopping cart, product catalog, user authentication, responsive UI, category management, routing, content pages, and SEO optimization.'
WHERE name = 'Tulemar Instacart Platform';