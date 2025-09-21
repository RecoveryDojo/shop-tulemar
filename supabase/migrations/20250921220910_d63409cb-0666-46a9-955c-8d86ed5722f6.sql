-- Fix existing assignments by setting accepted_at for admin-assigned orders
UPDATE stakeholder_assignments 
SET accepted_at = assigned_at,
    updated_at = now()
WHERE accepted_at IS NULL 
  AND status = 'assigned'
  AND assigned_at IS NOT NULL;