import { supabase } from '@/integrations/supabase/client';

export const testWorkflowWithRealOrders = async () => {
  try {
    console.log('🚀 Starting workflow test with real orders...');
    
    // 1. Get a real confirmed order
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'placed')
      .limit(1);
    
    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) {
      console.log('❌ No placed orders found for testing');
      return;
    }
    
    const testOrder = orders[0];
    console.log(`✅ Found test order: ${testOrder.id} (${testOrder.customer_name})`);
    
    // 2. Test accept order
    console.log('📦 Testing accept order...');
    const { data: acceptData, error: acceptError } = await supabase.functions.invoke('enhanced-order-workflow', {
      body: {
        action: 'accept_order',
        orderId: testOrder.id
      }
    });
    
    if (acceptError) {
      console.log('❌ Accept order failed:', acceptError);
    } else {
      console.log('✅ Accept order succeeded:', acceptData);
    }
    
    // Wait a moment between calls
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Test start shopping
    console.log('🛒 Testing start shopping...');
    const { data: shoppingData, error: shoppingError } = await supabase.functions.invoke('enhanced-order-workflow', {
      body: {
        action: 'start_shopping',
        orderId: testOrder.id
      }
    });
    
    if (shoppingError) {
      console.log('❌ Start shopping failed:', shoppingError);
    } else {
      console.log('✅ Start shopping succeeded:', shoppingData);
    }
    
    console.log('🎉 Workflow test complete!');
    return { success: true, orderId: testOrder.id };
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error);
    return { success: false, error };
  }
};

export const createTestOrder = async () => {
  try {
    console.log('📝 Creating test order...');
    
    // Get a real product
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(1);
    
    if (!products || products.length === 0) {
      throw new Error('No active products found');
    }
    
    const product = products[0];
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: 'Test Customer',
        customer_email: 'test@workflow.com',
        customer_phone: '555-0123',
        property_address: '123 Test Street, Test City',
        arrival_date: '2025-01-25',
        departure_date: '2025-01-30',
        guest_count: 2,
        special_instructions: 'Test order for workflow testing',
        subtotal: product.price,
        tax_amount: product.price * 0.1,
        delivery_fee: 5.00,
        total_amount: product.price * 1.1 + 5.00,
        status: 'placed',
        payment_status: 'paid'
      })
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    // Create order item
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: product.id,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price
      });
    
    if (itemError) throw itemError;
    
    console.log(`✅ Created test order: ${order.id}`);
    return order;
    
  } catch (error) {
    console.error('❌ Failed to create test order:', error);
    throw error;
  }
};