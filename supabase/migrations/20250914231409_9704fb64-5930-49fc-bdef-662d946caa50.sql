-- Fix Scott's role assignment
INSERT INTO public.user_roles (user_id, role)
VALUES ('c0656059-7095-440e-a6f2-9889128866c2', 'shopper')
ON CONFLICT (user_id, role) DO NOTHING;

-- Update Jessica's order status
UPDATE public.orders 
SET 
  status = 'confirmed',
  payment_status = 'completed',
  assigned_shopper_id = 'c0656059-7095-440e-a6f2-9889128866c2',
  updated_at = now()
WHERE id = '93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7';

-- Create stakeholder assignment for Scott
INSERT INTO public.stakeholder_assignments (order_id, user_id, role, status, accepted_at)
VALUES (
  '93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7',
  'c0656059-7095-440e-a6f2-9889128866c2',
  'shopper',
  'accepted',
  now()
);

-- Add workflow log entries for the order
INSERT INTO public.order_workflow_log (order_id, phase, action, new_status, previous_status, notes, metadata)
VALUES 
  (
    '93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7',
    'payment',
    'payment_completed',
    'confirmed',
    'pending',
    'Manual payment confirmation - retroactive fix',
    '{"manual_fix": true, "admin_action": true}'::jsonb
  ),
  (
    '93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7',
    'assignment',
    'shopper_assigned',
    'confirmed',
    'confirmed',
    'Assigned shopper Scott - retroactive assignment',
    '{"shopper_id": "c0656059-7095-440e-a6f2-9889128866c2", "manual_fix": true}'::jsonb
  );