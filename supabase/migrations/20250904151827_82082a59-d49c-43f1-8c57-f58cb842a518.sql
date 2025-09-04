-- Update completed payment system features
UPDATE features 
SET completion_percentage = 100, updated_at = now()
WHERE id IN ('12535d3e-1956-4150-a8ab-e3a1864aaa62', 'f82e0432-3325-43bd-8fa7-f76f7e72ef9e');

-- Update completed payment system tasks
UPDATE tasks 
SET status = 'done', updated_at = now()
WHERE id IN (
  '2c2b1110-210a-49f1-83be-0d6e1dfd684c', -- Checkout Flow Design
  'd2e816fe-f7c9-404a-9896-ad035932ece2', -- Order Confirmation  
  'a6e4f389-2762-42ad-a325-8291125aadd7', -- Payment Form Integration
  'ef9510e9-400e-49c9-81cd-1b9ce2574f9d', -- Guest Checkout
  '8720548d-3536-4e10-9f1d-5dc0c4f932d4'  -- Address Management
);

-- Add completion notes to workflow log
INSERT INTO order_workflow_log (order_id, phase, action, new_status, notes, metadata, actor_role)
VALUES (
  gen_random_uuid(), -- dummy order id for development tracking
  'development',
  'feature_completed',
  'done',
  'Stripe payment system fully implemented: checkout flow, payment processing, order confirmation, guest checkout, and address management',
  jsonb_build_object(
    'features_completed', ARRAY['Checkout & Payment System', 'Stripe Payment Integration'],
    'tasks_completed', ARRAY['Checkout Flow Design', 'Order Confirmation', 'Payment Form Integration', 'Guest Checkout', 'Address Management'],
    'implementation_date', now(),
    'technologies', ARRAY['Stripe API', 'Supabase Edge Functions', 'React', 'TypeScript']
  ),
  'developer'
);