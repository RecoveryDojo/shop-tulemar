-- Update completed payment system features to 100%
UPDATE features 
SET completion_percentage = 100, updated_at = now()
WHERE id IN ('12535d3e-1956-4150-a8ab-e3a1864aaa62', 'f82e0432-3325-43bd-8fa7-f76f7e72ef9e');

-- Update completed payment system tasks to done status
UPDATE tasks 
SET status = 'done', updated_at = now()
WHERE id IN (
  '2c2b1110-210a-49f1-83be-0d6e1dfd684c', -- Checkout Flow Design
  'd2e816fe-f7c9-404a-9896-ad035932ece2', -- Order Confirmation  
  'a6e4f389-2762-42ad-a325-8291125aadd7', -- Payment Form Integration
  'ef9510e9-400e-49c9-81cd-1b9ce2574f9d', -- Guest Checkout
  '8720548d-3536-4e10-9f1d-5dc0c4f932d4'  -- Address Management
);