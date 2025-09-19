-- Enable real-time for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable real-time for stakeholder_assignments table  
ALTER PUBLICATION supabase_realtime ADD TABLE stakeholder_assignments;

-- Enable real-time for order_workflow_log table
ALTER PUBLICATION supabase_realtime ADD TABLE order_workflow_log;

-- Set replica identity to FULL for complete row data in real-time updates
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE stakeholder_assignments REPLICA IDENTITY FULL;
ALTER TABLE order_workflow_log REPLICA IDENTITY FULL;