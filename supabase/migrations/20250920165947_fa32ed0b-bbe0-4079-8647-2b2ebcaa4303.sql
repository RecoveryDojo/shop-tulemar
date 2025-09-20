-- Reset Jessica's order assignment to make it available for reassignment
DELETE FROM stakeholder_assignments 
WHERE order_id = '93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7' 
AND user_id = 'c0656059-7095-440e-a6f2-9889128866c2';

-- Reset order status to pending and clear assigned shopper
UPDATE orders 
SET status = 'pending', 
    assigned_shopper_id = NULL,
    shopping_started_at = NULL,
    shopping_completed_at = NULL
WHERE id = '93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7';