-- Add Intelligent Route Optimization and Advanced Analytics Engine features to Phase 3
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
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Intelligent Route Optimization',
  'AI-powered delivery route optimization, real-time traffic analysis, driver efficiency tracking, and dynamic route adjustments',
  'high',
  75,
  0,
  0,
  0
),
(
  'db74a772-2acc-499c-b318-231b94830f88',
  'Advanced Analytics Engine',
  'Deep analytics for customer behavior, demand forecasting, inventory optimization, and business intelligence dashboards',
  'high',
  85,
  0,
  0,
  0
);