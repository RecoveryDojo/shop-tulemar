-- First, add comprehensive documentation for the Complete Order Workflow
INSERT INTO public.documentation (project_id, title, description, type, status, priority, tags, notes) VALUES
-- Get the Tulemar project ID first
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Complete Order Workflow & Communication Flow', 
'End-to-end workflow from client order completion to kitchen stocking with multi-stakeholder communication system',
'feature', 'in-progress', 'critical', 
ARRAY['workflow', 'communication', 'automation', 'notifications', 'stakeholders'],
'Comprehensive 9-phase workflow: Order Confirmation → Shopper Assignment → Shopping Process → Quality Check & Packing → Delivery & Transit → Property Arrival → Concierge Stocking → Final Confirmation → Follow-up'),

-- Phase 1: Order Confirmation & Assignment
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Phase 1: Order Confirmation & Assignment', 
'Automated order confirmation, payment processing, and shopper assignment based on location and availability',
'feature', 'planned', 'high', 
ARRAY['order-management', 'assignment', 'automation'],
'Triggers: Order submitted, payment confirmed. Actions: Send confirmation SMS/email to client, assign shopper based on proximity/availability, create order record with access token. Stakeholders: Client, Assigned Shopper, Admin'),

-- Phase 2: Shopper Assignment & Acceptance
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Phase 2: Shopper Assignment & Acceptance', 
'Shopper notification system, order acceptance workflow, and backup assignment for declined orders',
'feature', 'planned', 'high', 
ARRAY['shopper-dashboard', 'notifications', 'assignment'],
'Triggers: Shopper assigned. Actions: Push notification to shopper, 15-minute acceptance window, auto-reassign if declined. Communications: Real-time push to shopper, SMS backup, admin alert for reassignments'),

-- Phase 3: Shopping Process
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Phase 3: Shopping Process Management', 
'Real-time shopping interface with substitution approvals, inventory tracking, and customer communication',
'feature', 'planned', 'critical', 
ARRAY['shopping-interface', 'substitutions', 'communication', 'real-time'],
'Triggers: Shopper starts shopping. Actions: Real-time item scanning, photo substitution requests, customer approval workflow. Communications: SMS substitution requests with photos, push notifications for approvals'),

-- Phase 4: Quality Check & Packing
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Phase 4: Quality Check & Packing Protocol', 
'Quality assurance checklist, temperature-sensitive item handling, and photo documentation system',
'feature', 'planned', 'high', 
ARRAY['quality-control', 'packing', 'documentation', 'temperature-control'],
'Triggers: Shopping completed. Actions: Quality checklist completion, special item protocols, photo documentation of packed order. Communications: Quality report to admin, packing complete notification to client'),

-- Phase 5: Delivery & Transit
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Phase 5: Delivery & Transit Tracking', 
'GPS tracking, route optimization, real-time delivery updates, and arrival notifications',
'feature', 'planned', 'high', 
ARRAY['delivery', 'gps-tracking', 'route-optimization', 'real-time-updates'],
'Triggers: Order out for delivery. Actions: GPS tracking activation, ETA calculations, route optimization. Communications: Real-time delivery tracking link to client, arrival ETA updates via SMS'),

-- Phase 6: Property Arrival
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Phase 6: Property Arrival & Handoff', 
'Arrival confirmation, photo proof of delivery, and concierge handoff protocol',
'feature', 'planned', 'high', 
ARRAY['arrival', 'handoff', 'proof-of-delivery', 'concierge'],
'Triggers: GPS confirms property arrival. Actions: Photo proof of delivery, concierge handoff protocol, delivery confirmation. Communications: Arrival SMS to client and concierge, photo proof via email'),

-- Phase 7: Concierge Stocking
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Phase 7: Kitchen Stocking & Preparation', 
'Concierge kitchen stocking protocol, item placement guidelines, and quality verification',
'feature', 'planned', 'critical', 
ARRAY['concierge', 'stocking', 'kitchen-prep', 'quality-verification'],
'Triggers: Groceries delivered to concierge. Actions: Item verification against order, proper kitchen placement, temperature-appropriate storage. Communications: Stocking progress updates to admin, completion notification preparation'),

-- Phase 8: Final Confirmation
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Phase 8: Kitchen Stocked Confirmation', 
'Final stocking confirmation with photo documentation and multi-stakeholder notification system',
'feature', 'planned', 'critical', 
ARRAY['completion', 'confirmation', 'documentation', 'multi-stakeholder'],
'Triggers: Kitchen stocking completed. Actions: Photo documentation of stocked kitchen, order completion marking, comprehensive notification system. Communications: "Kitchen Ready" SMS/email to client, completion notifications to all stakeholders'),

-- Phase 9: Follow-up & Analytics
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Phase 9: Post-Completion Follow-up', 
'Guest satisfaction survey, service feedback collection, and performance analytics',
'feature', 'planned', 'medium', 
ARRAY['follow-up', 'analytics', 'feedback', 'satisfaction'],
'Triggers: 2 hours after stocking completion. Actions: Satisfaction survey delivery, service feedback request, performance data collection. Communications: Follow-up email with satisfaction survey, thank you message'),

-- Communication Infrastructure
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Multi-Channel Communication System', 
'Integrated SMS, email, and push notification system with role-based messaging and automated triggers',
'build', 'planned', 'critical', 
ARRAY['communication', 'sms', 'email', 'push-notifications', 'automation'],
'SMS via Twilio for immediate updates, Email for detailed communications with photos, Push notifications for real-time app updates, Role-based messaging for stakeholders, Automated trigger system for workflow events'),

-- Technology Requirements
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Technology Infrastructure Requirements', 
'Edge functions, WebSocket connections, GPS integration, photo storage, and notification services',
'build', 'planned', 'critical', 
ARRAY['infrastructure', 'edge-functions', 'websockets', 'gps', 'storage'],
'Supabase Edge Functions for workflow automation, WebSocket for real-time updates, GPS tracking integration, Photo storage with Supabase Storage, Multi-channel notification service integration'),

-- Database Enhancements
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Database Schema Enhancements', 
'Extended order statuses, stakeholder tables, notification tracking, and audit logging',
'build', 'planned', 'high', 
ARRAY['database', 'schema', 'tracking', 'audit-log'],
'New order statuses: assigned, shopping, packed, out_for_delivery, arrived, stocking, completed. Stakeholder assignment tables. Notification delivery tracking. Comprehensive audit logging for compliance'),

-- Role-Specific Dashboards
((SELECT id FROM public.projects WHERE name = 'Tulemar Instacart Platform'), 
'Role-Specific Dashboard Development', 
'Dedicated dashboards for shoppers, drivers, concierges, and admins with role-appropriate features',
'build', 'planned', 'high', 
ARRAY['dashboards', 'roles', 'ui', 'mobile-first'],
'Shopper Dashboard: Order management, scanning interface, substitution handling. Concierge Portal: Stocking protocols, guest preparation. Admin Dashboard: Full workflow oversight, escalation management. Mobile-first responsive design');

-- Now create the stakeholder assignment and notification tracking tables
CREATE TABLE public.stakeholder_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('shopper', 'driver', 'concierge')),
    user_id UUID, -- References auth.users but no FK constraint due to Supabase limitations
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stakeholder_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stakeholder_assignments
CREATE POLICY "Admin/Sysadmin can manage stakeholder assignments" 
ON public.stakeholder_assignments 
FOR ALL 
USING (is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Users can view their own assignments" 
ON public.stakeholder_assignments 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own assignment status" 
ON public.stakeholder_assignments 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Notification tracking table
CREATE TABLE public.order_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('client', 'shopper', 'driver', 'concierge', 'admin')),
    recipient_identifier TEXT NOT NULL, -- email, phone, or user_id
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'push', 'in-app')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    message_content TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_notifications
CREATE POLICY "Admin/Sysadmin can manage notifications" 
ON public.order_notifications 
FOR ALL 
USING (is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Users can view notifications related to their orders" 
ON public.order_notifications 
FOR SELECT 
USING (
    -- Users can see notifications for orders they placed
    EXISTS (
        SELECT 1 FROM public.orders o 
        WHERE o.id = order_notifications.order_id 
        AND o.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR
    -- Users can see notifications sent to them
    recipient_identifier = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    OR
    recipient_identifier = auth.uid()::text
);

-- Order workflow audit log
CREATE TABLE public.order_workflow_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    phase TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID, -- References auth.users
    actor_role TEXT,
    previous_status TEXT,
    new_status TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT
);

-- Enable RLS
ALTER TABLE public.order_workflow_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow log
CREATE POLICY "Admin/Sysadmin can view all workflow logs" 
ON public.order_workflow_log 
FOR SELECT 
USING (is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Users can view logs for their orders" 
ON public.order_workflow_log 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders o 
        WHERE o.id = order_workflow_log.order_id 
        AND o.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

CREATE POLICY "System can insert workflow logs" 
ON public.order_workflow_log 
FOR INSERT 
WITH CHECK (true);

-- Add new order statuses (update the existing orders table to include new statuses)
-- We'll do this by adding a check constraint that includes the new statuses
-- First drop existing constraint if any, then add new one
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'assigned', 'shopping', 'packed', 'out_for_delivery', 'arrived', 'stocking', 'completed', 'cancelled'));

-- Add triggers for updated_at columns
CREATE TRIGGER update_stakeholder_assignments_updated_at
    BEFORE UPDATE ON public.stakeholder_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_stakeholder_assignments_order_id ON public.stakeholder_assignments(order_id);
CREATE INDEX idx_stakeholder_assignments_user_id ON public.stakeholder_assignments(user_id);
CREATE INDEX idx_stakeholder_assignments_role ON public.stakeholder_assignments(role);
CREATE INDEX idx_order_notifications_order_id ON public.order_notifications(order_id);
CREATE INDEX idx_order_notifications_status ON public.order_notifications(status);
CREATE INDEX idx_order_workflow_log_order_id ON public.order_workflow_log(order_id);
CREATE INDEX idx_order_workflow_log_timestamp ON public.order_workflow_log(timestamp);