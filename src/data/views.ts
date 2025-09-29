import { supabase } from "@/integrations/supabase/client"
import type { OrderItemView, OrderEventView } from "@/types/db-views"

export const ORDER_ITEMS_SELECT = 
  "id,order_id,sku,product_id,name,qty,quantity,qty_picked,found_quantity,notes,shopper_notes,created_at,unit_price,total_price,shopping_status,photo_url,substitution_data,products,product_name,product_unit,product_category_id,product_price"

export const ORDER_EVENTS_SELECT = 
  "id,order_id,event_type,actor_role,data,payload,created_at"

export async function fetchOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from("order_items")
    .select(ORDER_ITEMS_SELECT)
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []) as OrderItemView[]
}

export async function fetchOrderEvents(orderId: string) {
  const { data, error } = await supabase
    .from("order_events") 
    .select(ORDER_EVENTS_SELECT)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as OrderEventView[]
}