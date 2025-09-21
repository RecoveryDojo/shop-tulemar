import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId, staffId, role, adminId } = await req.json();
    console.log(`Assignment workflow: ${role} ${staffId} to order ${orderId} by admin ${adminId}`);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, description, image_url, unit, price)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Get staff details
    const { data: staff, error: staffError } = await supabase
      .from('profiles')
      .select('id, display_name, email, phone')
      .eq('id', staffId)
      .single();

    if (staffError || !staff) {
      throw new Error('Staff member not found');
    }

    // Create or update stakeholder assignment
    const { data: existing } = await supabase
      .from('stakeholder_assignments')
      .select('id')
      .eq('order_id', orderId)
      .eq('role', role)
      .single();

    const currentTime = new Date().toISOString();
    
    if (existing) {
      // Update existing assignment
      await supabase
        .from('stakeholder_assignments')
        .update({ 
          user_id: staffId,
          status: 'assigned',
          assigned_at: currentTime,
          accepted_at: currentTime  // Auto-accept when admin assigns
        })
        .eq('id', existing.id);
    } else {
      // Create new assignment
      await supabase
        .from('stakeholder_assignments')
        .insert({
          order_id: orderId,
          user_id: staffId,
          role,
          status: 'assigned',
          assigned_at: currentTime,
          accepted_at: currentTime  // Auto-accept when admin assigns
        });
    }

    // Update order status and assigned shopper if it's a shopper assignment
    let orderUpdateData: any = {};
    if (role === 'shopper') {
      orderUpdateData = {
        assigned_shopper_id: staffId,
        status: 'assigned'
      };
    }

    if (Object.keys(orderUpdateData).length > 0) {
      await supabase
        .from('orders')
        .update(orderUpdateData)
        .eq('id', orderId);
    }

    // Log workflow action
    await supabase
      .from('order_workflow_log')
      .insert({
        order_id: orderId,
        actor_id: adminId,
        phase: 'assignment',
        action: 'staff_assigned',
        actor_role: 'admin',
        notes: `Assigned ${staff.display_name} as ${role}`,
        metadata: { 
          assigned_user_id: staffId, 
          role,
          staff_name: staff.display_name,
          staff_email: staff.email
        }
      });

    // Send notifications to all stakeholders
    const notifications = [];

    // Notify customer
    notifications.push({
      order_id: orderId,
      notification_type: 'staff_assigned',
      recipient_type: 'customer',
      recipient_identifier: order.customer_email,
      channel: 'app',
      message_content: `${staff.display_name} has been assigned as your ${role} for order #${orderId.slice(0, 8)}`,
      metadata: {
        staff_name: staff.display_name,
        staff_role: role,
        order_total: order.total_amount,
        items_count: order.order_items?.length || 0
      }
    });

    // Notify assigned staff member
    notifications.push({
      order_id: orderId,
      notification_type: 'assignment_received',
      recipient_type: 'staff',
      recipient_identifier: staff.email,
      channel: 'app',
      message_content: `You've been assigned as ${role} for ${order.customer_name}'s order ($${order.total_amount})`,
      metadata: {
        customer_name: order.customer_name,
        order_total: order.total_amount,
        items_count: order.order_items?.length || 0,
        customer_phone: order.customer_phone,
        property_address: order.property_address,
        special_instructions: order.special_instructions
      }
    });

    // Insert all notifications
    if (notifications.length > 0) {
      await supabase
        .from('order_notifications')
        .insert(notifications);
    }

    // Prepare comprehensive response with order details
    const response = {
      success: true,
      message: `Successfully assigned ${staff.display_name} as ${role}`,
      assignment: {
        order_id: orderId,
        staff_id: staffId,
        staff_name: staff.display_name,
        staff_email: staff.email,
        role: role,
        assigned_at: new Date().toISOString()
      },
      order_details: {
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        total_amount: order.total_amount,
        status: orderUpdateData.status || order.status,
        items: order.order_items?.map((item: any) => ({
          name: item.products?.name || 'Unknown Product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          image_url: item.products?.image_url
        })) || []
      }
    };

    console.log('Assignment completed successfully:', response);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in assignment-workflow:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Assignment failed',
        details: error
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});